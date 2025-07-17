"""
Portfolio Optimization API

Implements knapsack-based portfolio optimization endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
import asyncio
from loguru import logger

from app.services.knapsack_optimizer import get_optimizer, OptimizationResult
from app.services.data_service import get_data_service
from app.core.redis_client import get_redis


router = APIRouter()


class AssetInput(BaseModel):
    """Input model for asset data."""
    symbol: str = Field(..., description="Asset symbol (e.g., 'AAPL.US')")
    current_price: float = Field(..., description="Current market price")
    returns: List[float] = Field(..., description="Historical returns array")
    max_allocation: Optional[float] = Field(
        0.25, 
        description="Maximum allocation percentage (0.0 to 1.0)"
    )


class OptimizationRequest(BaseModel):
    """Request model for portfolio optimization."""
    assets: List[AssetInput] = Field(..., description="List of assets to optimize")
    risk_budget: Optional[int] = Field(
        1000, 
        description="Risk budget (higher = more risk tolerance)"
    )
    optimization_objective: Optional[str] = Field(
        "sharpe", 
        description="Optimization objective: 'sharpe', 'return', 'volatility'"
    )


class OptimizationResponse(BaseModel):
    """Response model for portfolio optimization."""
    success: bool
    selected_assets: List[str]
    allocations: Dict[str, float]
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float
    optimization_time_ms: float
    timestamp: str
    risk_metrics: Dict[str, float]


class PortfolioItem(BaseModel):
    """Individual portfolio item for knapsack optimization."""
    symbol: str
    weight: float  # Risk weight
    value: float   # Expected return or utility
    quantity: Optional[int] = None
    price: Optional[float] = None


@router.post("/optimize", response_model=OptimizationResponse)
async def optimize_portfolio(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks,
    optimizer = Depends(get_optimizer),
    redis_client = Depends(get_redis)
):
    """
    Optimize portfolio using knapsack algorithm.
    
    This endpoint accepts a list of assets with their historical returns
    and uses a knapsack algorithm to find the optimal portfolio allocation
    that maximizes risk-adjusted returns within the specified risk budget.
    
    The knapsack algorithm treats each asset as an item where:
    - Weight = Risk (scaled volatility)
    - Value = Expected return or Sharpe ratio
    - Capacity = Risk budget
    
    Returns the optimal asset selection and allocation percentages.
    """
    try:
        logger.info(f"Starting portfolio optimization for {len(request.assets)} assets")
        
        # Validate input
        if not request.assets:
            raise HTTPException(status_code=400, detail="No assets provided")
        
        if len(request.assets) > 50:
            raise HTTPException(
                status_code=400, 
                detail="Too many assets (max 50)"
            )
        
        # Convert request to internal format
        asset_data = []
        for asset in request.assets:
            asset_data.append({
                'symbol': asset.symbol,
                'returns': asset.returns,
                'current_price': asset.current_price,
                'max_allocation': asset.max_allocation
            })
        
        # Perform optimization
        result = await optimizer.optimize_portfolio(
            asset_data=asset_data,
            risk_budget=request.risk_budget
        )
        
        # Calculate additional risk metrics
        risk_metrics = await _calculate_risk_metrics(result, asset_data)
        
        # Log optimization result
        logger.info(
            f"Optimization completed: {len(result.selected_assets)} assets selected, "
            f"Sharpe ratio: {result.sharpe_ratio:.3f}, "
            f"Time: {result.optimization_time_ms:.2f}ms"
        )
        
        # Schedule background tasks
        background_tasks.add_task(
            _log_optimization_metrics, 
            result, 
            redis_client
        )
        
        return OptimizationResponse(
            success=True,
            selected_assets=result.selected_assets,
            allocations=result.allocations,
            expected_return=result.expected_return,
            expected_volatility=result.expected_volatility,
            sharpe_ratio=result.sharpe_ratio,
            optimization_time_ms=result.optimization_time_ms,
            timestamp=datetime.utcnow().isoformat(),
            risk_metrics=risk_metrics
        )
        
    except Exception as e:
        logger.error(f"Portfolio optimization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/simple")
async def optimize_simple_portfolio(
    symbols: List[str],
    risk_budget: Optional[int] = 1000,
    data_service = Depends(get_data_service),
    optimizer = Depends(get_optimizer)
):
    """
    Simplified optimization endpoint using current market data.
    
    This endpoint takes a list of symbols and automatically fetches
    recent market data to perform optimization. Useful for quick
    portfolio optimization without providing historical data.
    """
    try:
        if not symbols:
            raise HTTPException(status_code=400, detail="No symbols provided")
        
        if len(symbols) > 20:
            raise HTTPException(status_code=400, detail="Too many symbols (max 20)")
        
        # Fetch market data for symbols
        asset_data = []
        for symbol in symbols:
            # Get recent market data
            market_data = await data_service.client.get_market_data(symbol)
            if not market_data:
                logger.warning(f"No market data available for {symbol}")
                continue
            
            # Get historical bars for returns calculation
            bars = await data_service.client.fetch_stooq_bars(symbol, interval=5)
            if len(bars) < 10:
                logger.warning(f"Insufficient historical data for {symbol}")
                continue
            
            # Calculate simple returns from bars
            returns = []
            for i in range(1, len(bars)):
                prev_close = bars[i-1]['close']
                curr_close = bars[i]['close']
                if prev_close > 0:
                    returns.append((curr_close - prev_close) / prev_close)
            
            if len(returns) < 5:
                continue
            
            asset_data.append({
                'symbol': symbol,
                'returns': returns[-50:],  # Use last 50 returns
                'current_price': market_data.get('last_price', 0)
            })
        
        if not asset_data:
            raise HTTPException(
                status_code=404, 
                detail="No valid market data found for provided symbols"
            )
        
        # Perform optimization
        result = await optimizer.optimize_portfolio(
            asset_data=asset_data,
            risk_budget=risk_budget
        )
        
        return {
            "success": True,
            "selected_assets": result.selected_assets,
            "allocations": result.allocations,
            "expected_return": result.expected_return,
            "expected_volatility": result.expected_volatility,
            "sharpe_ratio": result.sharpe_ratio,
            "optimization_time_ms": result.optimization_time_ms,
            "data_points_used": len(asset_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Simple optimization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimize/status/{optimization_id}")
async def get_optimization_status(optimization_id: str):
    """
    Get the status of a background optimization job.
    
    For future implementation of async optimization jobs.
    """
    # Placeholder for async optimization status
    return {
        "optimization_id": optimization_id,
        "status": "completed",
        "message": "Optimization completed successfully"
    }


async def _calculate_risk_metrics(
    result: OptimizationResult, 
    asset_data: List[Dict]
) -> Dict[str, float]:
    """Calculate additional risk metrics for the optimized portfolio."""
    try:
        import numpy as np
        
        # Create symbol to data mapping
        symbol_data = {asset['symbol']: asset for asset in asset_data}
        
        # Calculate portfolio metrics
        portfolio_returns = []
        for symbol, allocation in result.allocations.items():
            if symbol in symbol_data:
                asset_returns = np.array(symbol_data[symbol]['returns'])
                portfolio_returns.append(asset_returns * allocation)
        
        if portfolio_returns:
            portfolio_returns = np.sum(portfolio_returns, axis=0)
            
            # Calculate risk metrics
            return {
                "value_at_risk_95": float(np.percentile(portfolio_returns, 5)),
                "value_at_risk_99": float(np.percentile(portfolio_returns, 1)),
                "max_drawdown": float(np.min(np.cumsum(portfolio_returns))),
                "volatility_annualized": float(np.std(portfolio_returns) * np.sqrt(252)),
                "skewness": float(_calculate_skewness(portfolio_returns)),
                "kurtosis": float(_calculate_kurtosis(portfolio_returns))
            }
        
        return {}
        
    except Exception as e:
        logger.error(f"Error calculating risk metrics: {e}")
        return {}


def _calculate_skewness(returns: np.ndarray) -> float:
    """Calculate skewness of returns."""
    try:
        from scipy import stats
        return stats.skew(returns)
    except ImportError:
        # Fallback calculation
        mean = np.mean(returns)
        std = np.std(returns)
        return np.mean(((returns - mean) / std) ** 3) if std > 0 else 0


def _calculate_kurtosis(returns: np.ndarray) -> float:
    """Calculate kurtosis of returns."""
    try:
        from scipy import stats
        return stats.kurtosis(returns)
    except ImportError:
        # Fallback calculation
        mean = np.mean(returns)
        std = np.std(returns)
        return np.mean(((returns - mean) / std) ** 4) - 3 if std > 0 else 0


async def _log_optimization_metrics(result: OptimizationResult, redis_client):
    """Log optimization metrics for monitoring."""
    try:
        metrics = {
            "optimization_time_ms": result.optimization_time_ms,
            "selected_asset_count": len(result.selected_assets),
            "sharpe_ratio": result.sharpe_ratio,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Publish metrics event
        await redis_client.publish_event("optimization_metrics", metrics)
        
        # Log for Prometheus/observability
        logger.info(f"METRICS optimization_time_ms={result.optimization_time_ms}")
        logger.info(f"METRICS optimization_sharpe_ratio={result.sharpe_ratio}")
        
    except Exception as e:
        logger.error(f"Error logging optimization metrics: {e}")
