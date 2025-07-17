"""
Risk Management API

Handles portfolio risk analysis, VaR calculations, and stress testing.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import numpy as np
import asyncio
import uuid

from app.core.database import get_db, Position, MarketData, RiskMetrics
from app.services.data_service import get_data_service
from app.core.redis_client import get_redis


router = APIRouter()


class RiskSnapshot(BaseModel):
    """Current risk metrics snapshot."""
    portfolio_value: float
    var_1d_95: Optional[float] = Field(None, description="1-day VaR at 95% confidence")
    var_1d_99: Optional[float] = Field(None, description="1-day VaR at 99% confidence")
    var_5d_95: Optional[float] = Field(None, description="5-day VaR at 95% confidence")
    expected_shortfall: Optional[float] = Field(None, description="Expected shortfall (CVaR)")
    max_drawdown: Optional[float] = Field(None, description="Maximum drawdown")
    sharpe_ratio: Optional[float] = Field(None, description="Portfolio Sharpe ratio")
    beta: Optional[float] = Field(None, description="Portfolio beta vs market")
    volatility: Optional[float] = Field(None, description="Annualized volatility")
    concentration_risk: Dict[str, float] = Field(default_factory=dict, description="Concentration by asset")
    correlation_risk: Optional[float] = Field(None, description="Average correlation")
    timestamp: datetime


class StressTestScenario(BaseModel):
    """Stress test scenario definition."""
    name: str
    description: str
    shock_type: str = Field(..., description="Type: 'market_shock', 'sector_shock', 'correlation_shock'")
    parameters: Dict[str, float] = Field(..., description="Scenario parameters")


class StressTestRequest(BaseModel):
    """Request for stress testing."""
    scenarios: List[StressTestScenario]
    portfolio_snapshot: Optional[Dict] = None


class StressTestResult(BaseModel):
    """Stress test results."""
    scenario_name: str
    current_portfolio_value: float
    stressed_portfolio_value: float
    portfolio_loss: float
    portfolio_loss_percent: float
    asset_level_impacts: Dict[str, float]
    worst_performing_assets: List[str]


class StressTestResponse(BaseModel):
    """Complete stress test response."""
    job_id: str
    status: str
    results: List[StressTestResult]
    timestamp: datetime


@router.get("/risk/snapshot", response_model=RiskSnapshot)
async def get_risk_snapshot(
    user_id: int = 1,
    db: AsyncSession = Depends(get_db),
    data_service = Depends(get_data_service)
):
    """
    Get current portfolio risk metrics snapshot.
    
    Calculates various risk metrics including VaR, expected shortfall,
    concentration risk, and correlation analysis.
    """
    try:
        # Get current positions
        result = await db.execute(
            select(Position).where(Position.user_id == user_id)
        )
        positions = result.scalars().all()
        
        if not positions:
            return RiskSnapshot(
                portfolio_value=0.0,
                timestamp=datetime.utcnow()
            )
        
        # Calculate portfolio value and get market data
        portfolio_value = 0.0
        position_data = []
        
        for position in positions:
            market_data = await data_service.client.get_market_data(position.symbol)
            current_price = market_data.get('last_price', position.avg_price) if market_data else position.avg_price
            
            market_value = position.quantity * current_price
            portfolio_value += market_value
            
            # Get historical data for risk calculations
            bars = await data_service.client.fetch_stooq_bars(position.symbol, interval=5)
            returns = _calculate_returns_from_bars(bars)
            
            position_data.append({
                'symbol': position.symbol,
                'weight': market_value,  # Will be normalized later
                'returns': returns,
                'current_price': current_price,
                'market_value': market_value
            })
        
        # Normalize weights
        for pos in position_data:
            pos['weight'] = pos['market_value'] / portfolio_value if portfolio_value > 0 else 0
        
        # Calculate risk metrics
        risk_metrics = await _calculate_portfolio_risk_metrics(position_data, portfolio_value)
        
        # Store risk metrics in database
        await _store_risk_metrics(db, user_id, portfolio_value, risk_metrics)
        
        return RiskSnapshot(
            portfolio_value=portfolio_value,
            var_1d_95=risk_metrics.get('var_1d_95'),
            var_1d_99=risk_metrics.get('var_1d_99'),
            var_5d_95=risk_metrics.get('var_5d_95'),
            expected_shortfall=risk_metrics.get('expected_shortfall'),
            max_drawdown=risk_metrics.get('max_drawdown'),
            sharpe_ratio=risk_metrics.get('sharpe_ratio'),
            beta=risk_metrics.get('beta'),
            volatility=risk_metrics.get('volatility'),
            concentration_risk=risk_metrics.get('concentration_risk', {}),
            correlation_risk=risk_metrics.get('correlation_risk'),
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/risk/stress", response_model=StressTestResponse)
async def run_stress_test(
    request: StressTestRequest,
    background_tasks: BackgroundTasks,
    user_id: int = 1,
    db: AsyncSession = Depends(get_db),
    redis_client = Depends(get_redis)
):
    """
    Run stress tests on the current portfolio.
    
    Applies various shock scenarios to assess portfolio resilience
    under adverse market conditions.
    """
    try:
        job_id = str(uuid.uuid4())
        
        # Get current positions
        result = await db.execute(
            select(Position).where(Position.user_id == user_id)
        )
        positions = result.scalars().all()
        
        if not positions:
            raise HTTPException(status_code=400, detail="No positions to stress test")
        
        # Start stress test in background
        background_tasks.add_task(
            _run_stress_test_async,
            job_id,
            request.scenarios,
            positions,
            user_id,
            redis_client
        )
        
        return StressTestResponse(
            job_id=job_id,
            status="running",
            results=[],
            timestamp=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk/stress/{job_id}")
async def get_stress_test_results(
    job_id: str,
    redis_client = Depends(get_redis)
):
    """Get stress test results by job ID."""
    try:
        # Try to get results from Redis cache
        results = await redis_client.get_cached_response(f"stress_test:{job_id}")
        
        if results:
            import json
            return json.loads(results)
        else:
            return {
                "job_id": job_id,
                "status": "not_found",
                "message": "Stress test results not found or expired"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk/alerts")
async def get_risk_alerts(
    user_id: int = 1,
    redis_client = Depends(get_redis)
):
    """Get current risk alerts and warnings."""
    try:
        # This would integrate with a real alerting system
        # For now, return mock alerts based on portfolio state
        
        alerts = []
        
        # Example risk alerts
        sample_alerts = [
            {
                "id": "alert_1",
                "type": "concentration_risk",
                "severity": "medium",
                "message": "Portfolio concentration in AAPL.US exceeds 25%",
                "timestamp": datetime.utcnow().isoformat(),
                "action_required": False
            },
            {
                "id": "alert_2", 
                "type": "var_breach",
                "severity": "high",
                "message": "Daily VaR exceeded by 15% in last session",
                "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "action_required": True
            }
        ]
        
        return {
            "alerts": sample_alerts,
            "alert_count": len(sample_alerts),
            "high_severity_count": sum(1 for a in sample_alerts if a["severity"] == "high"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _calculate_returns_from_bars(bars: List[Dict]) -> List[float]:
    """Calculate returns from price bars."""
    if len(bars) < 2:
        return []
    
    returns = []
    for i in range(1, len(bars)):
        prev_close = bars[i-1]['close']
        curr_close = bars[i]['close']
        if prev_close > 0:
            returns.append((curr_close - prev_close) / prev_close)
    
    return returns


async def _calculate_portfolio_risk_metrics(position_data: List[Dict], portfolio_value: float) -> Dict:
    """Calculate comprehensive portfolio risk metrics."""
    try:
        if not position_data:
            return {}
        
        # Collect all returns and weights
        all_returns = []
        weights = []
        symbols = []
        
        for pos in position_data:
            if pos['returns']:
                all_returns.append(np.array(pos['returns']))
                weights.append(pos['weight'])
                symbols.append(pos['symbol'])
        
        if not all_returns:
            return {}
        
        # Align return series (take minimum length)
        min_length = min(len(returns) for returns in all_returns)
        if min_length < 10:  # Need minimum data
            return {}
        
        # Truncate all series to minimum length
        aligned_returns = np.array([returns[-min_length:] for returns in all_returns])
        weights = np.array(weights)
        
        # Calculate portfolio returns
        portfolio_returns = np.dot(weights, aligned_returns)
        
        # Risk metrics calculations
        var_1d_95 = np.percentile(portfolio_returns, 5) * portfolio_value
        var_1d_99 = np.percentile(portfolio_returns, 1) * portfolio_value
        var_5d_95 = np.percentile(portfolio_returns, 5) * portfolio_value * np.sqrt(5)
        
        # Expected shortfall (average of worst 5% outcomes)
        worst_outcomes = portfolio_returns[portfolio_returns <= np.percentile(portfolio_returns, 5)]
        expected_shortfall = np.mean(worst_outcomes) * portfolio_value if len(worst_outcomes) > 0 else None
        
        # Volatility and Sharpe ratio
        volatility = np.std(portfolio_returns) * np.sqrt(252)  # Annualized
        mean_return = np.mean(portfolio_returns) * 252  # Annualized
        risk_free_rate = 0.02  # 2% risk-free rate
        sharpe_ratio = (mean_return - risk_free_rate) / volatility if volatility > 0 else None
        
        # Maximum drawdown
        cumulative_returns = np.cumsum(portfolio_returns)
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdowns = cumulative_returns - running_max
        max_drawdown = np.min(drawdowns) * portfolio_value if len(drawdowns) > 0 else None
        
        # Concentration risk
        concentration_risk = {
            symbols[i]: weights[i] for i in range(len(symbols))
        }
        
        # Correlation risk (average pairwise correlation)
        if len(aligned_returns) > 1:
            correlation_matrix = np.corrcoef(aligned_returns)
            # Get upper triangle (excluding diagonal)
            upper_triangle = correlation_matrix[np.triu_indices_from(correlation_matrix, k=1)]
            correlation_risk = np.mean(np.abs(upper_triangle)) if len(upper_triangle) > 0 else None
        else:
            correlation_risk = None
        
        # Simple beta calculation (vs equal-weighted portfolio as proxy for market)
        market_proxy = np.mean(aligned_returns, axis=0)
        if len(market_proxy) > 1 and np.std(market_proxy) > 0:
            beta = np.cov(portfolio_returns, market_proxy)[0, 1] / np.var(market_proxy)
        else:
            beta = None
        
        return {
            'var_1d_95': var_1d_95,
            'var_1d_99': var_1d_99,
            'var_5d_95': var_5d_95,
            'expected_shortfall': expected_shortfall,
            'max_drawdown': max_drawdown,
            'sharpe_ratio': sharpe_ratio,
            'beta': beta,
            'volatility': volatility,
            'concentration_risk': concentration_risk,
            'correlation_risk': correlation_risk
        }
        
    except Exception as e:
        print(f"Error calculating risk metrics: {e}")
        return {}


async def _store_risk_metrics(db: AsyncSession, user_id: int, portfolio_value: float, metrics: Dict):
    """Store risk metrics in database."""
    try:
        risk_record = RiskMetrics(
            user_id=user_id,
            portfolio_value=portfolio_value,
            var_1d=metrics.get('var_1d_95'),
            var_5d=metrics.get('var_5d_95'),
            max_drawdown=metrics.get('max_drawdown'),
            sharpe_ratio=metrics.get('sharpe_ratio'),
            beta=metrics.get('beta')
        )
        
        db.add(risk_record)
        await db.commit()
        
    except Exception as e:
        print(f"Error storing risk metrics: {e}")


async def _run_stress_test_async(
    job_id: str,
    scenarios: List[StressTestScenario],
    positions: List[Position],
    user_id: int,
    redis_client
):
    """Run stress test scenarios asynchronously."""
    try:
        results = []
        
        # Calculate current portfolio value
        current_value = sum(pos.quantity * pos.avg_price for pos in positions)  # Simplified
        
        for scenario in scenarios:
            # Apply stress scenario
            stressed_value = _apply_stress_scenario(positions, scenario, current_value)
            
            loss = current_value - stressed_value
            loss_percent = (loss / current_value * 100) if current_value > 0 else 0
            
            # Identify worst performing assets (simplified)
            worst_assets = [pos.symbol for pos in positions[:3]]  # Simplified
            
            asset_impacts = {
                pos.symbol: -scenario.parameters.get('shock_size', 0.1) * 100
                for pos in positions
            }
            
            result = StressTestResult(
                scenario_name=scenario.name,
                current_portfolio_value=current_value,
                stressed_portfolio_value=stressed_value,
                portfolio_loss=loss,
                portfolio_loss_percent=loss_percent,
                asset_level_impacts=asset_impacts,
                worst_performing_assets=worst_assets
            )
            
            results.append(result)
        
        # Store results in Redis
        response = StressTestResponse(
            job_id=job_id,
            status="completed",
            results=results,
            timestamp=datetime.utcnow()
        )
        
        import json
        await redis_client.set_cached_response(
            f"stress_test:{job_id}",
            json.dumps(response.dict()),
            ttl=3600  # 1 hour
        )
        
        # Publish completion event
        await redis_client.publish_event("stress_test_completed", {
            "job_id": job_id,
            "timestamp": datetime.utcnow().isoformat(),
            "scenario_count": len(scenarios)
        })
        
    except Exception as e:
        print(f"Error in stress test: {e}")
        # Store error result
        error_response = StressTestResponse(
            job_id=job_id,
            status="failed",
            results=[],
            timestamp=datetime.utcnow()
        )
        
        import json
        await redis_client.set_cached_response(
            f"stress_test:{job_id}",
            json.dumps(error_response.dict()),
            ttl=3600
        )


def _apply_stress_scenario(positions: List[Position], scenario: StressTestScenario, current_value: float) -> float:
    """Apply stress scenario to portfolio positions."""
    # Simplified stress scenario application
    shock_size = scenario.parameters.get('shock_size', 0.1)  # 10% default shock
    
    if scenario.shock_type == "market_shock":
        # Apply uniform shock to all positions
        return current_value * (1 - shock_size)
    
    elif scenario.shock_type == "sector_shock":
        # Apply shock to specific sectors (simplified)
        return current_value * (1 - shock_size * 0.5)  # 50% of positions affected
    
    elif scenario.shock_type == "correlation_shock":
        # Increase correlations and apply shock
        return current_value * (1 - shock_size * 1.2)  # 20% amplification
    
    else:
        return current_value
