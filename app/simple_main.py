"""
Simple FastAPI application for MKTO trading platform
Simplified version without database and complex dependencies
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import httpx
import asyncio
from datetime import datetime, timedelta
import random

app = FastAPI(
    title="MKTO Trading Platform",
    description="AI-powered portfolio optimization using knapsack algorithm",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AssetData(BaseModel):
    symbol: str
    price: float
    expected_return: float
    risk: float
    weight: float = 0.0

class OptimizationRequest(BaseModel):
    budget: float
    assets: List[str]
    risk_tolerance: float = 0.5

class OptimizationResult(BaseModel):
    selected_assets: List[AssetData]
    total_value: float
    expected_return: float
    total_risk: float
    allocation: Dict[str, float]

class PortfolioPosition(BaseModel):
    symbol: str
    quantity: float
    current_price: float
    market_value: float
    pnl: float
    weight: float

# Mock data for demonstration
MOCK_ASSETS = {
    "AAPL": {"price": 175.50, "expected_return": 0.12, "risk": 0.18},
    "GOOGL": {"price": 2850.00, "expected_return": 0.15, "risk": 0.22},
    "MSFT": {"price": 385.20, "expected_return": 0.11, "risk": 0.16},
    "TSLA": {"price": 245.80, "expected_return": 0.25, "risk": 0.35},
    "AMZN": {"price": 3200.00, "expected_return": 0.14, "risk": 0.25},
    "NVDA": {"price": 875.50, "expected_return": 0.28, "risk": 0.40},
    "META": {"price": 320.75, "expected_return": 0.18, "risk": 0.28},
    "BTC": {"price": 42000.00, "expected_return": 0.45, "risk": 0.65},
}

def knapsack_optimize(budget: float, assets: List[str], risk_tolerance: float = 0.5) -> OptimizationResult:
    """
    Simplified knapsack optimization algorithm for portfolio selection
    """
    available_assets = []
    for symbol in assets:
        if symbol in MOCK_ASSETS:
            asset_data = MOCK_ASSETS[symbol]
            # Adjust expected return based on risk tolerance
            adjusted_return = asset_data["expected_return"] * (1 - asset_data["risk"] * (1 - risk_tolerance))
            available_assets.append({
                "symbol": symbol,
                "price": asset_data["price"],
                "expected_return": asset_data["expected_return"],
                "risk": asset_data["risk"],
                "value_per_dollar": adjusted_return / asset_data["price"]
            })
    
    # Sort by value per dollar (efficiency)
    available_assets.sort(key=lambda x: x["value_per_dollar"], reverse=True)
    
    selected_assets = []
    remaining_budget = budget
    total_value = 0
    total_expected_return = 0
    total_risk = 0
    allocation = {}
    
    for asset in available_assets:
        if asset["price"] <= remaining_budget:
            # Calculate how many shares we can buy
            shares = int(remaining_budget // asset["price"])
            if shares > 0:
                investment = shares * asset["price"]
                selected_assets.append(AssetData(
                    symbol=asset["symbol"],
                    price=asset["price"],
                    expected_return=asset["expected_return"],
                    risk=asset["risk"],
                    weight=investment / budget
                ))
                allocation[asset["symbol"]] = investment
                remaining_budget -= investment
                total_value += investment
                total_expected_return += asset["expected_return"] * (investment / budget)
                total_risk += asset["risk"] * (investment / budget)
    
    return OptimizationResult(
        selected_assets=selected_assets,
        total_value=total_value,
        expected_return=total_expected_return,
        total_risk=total_risk,
        allocation=allocation
    )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "MKTO Trading Platform API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "optimize": "/api/v1/optimize",
            "assets": "/api/v1/assets",
            "portfolio": "/api/v1/portfolio"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/api/v1/assets")
async def get_assets():
    """Get available assets"""
    return {
        "assets": [
            {
                "symbol": symbol,
                "name": symbol,
                "price": data["price"],
                "expected_return": data["expected_return"],
                "risk": data["risk"]
            }
            for symbol, data in MOCK_ASSETS.items()
        ]
    }

@app.post("/api/v1/optimize")
async def optimize_portfolio(request: OptimizationRequest):
    """Optimize portfolio using knapsack algorithm"""
    try:
        result = knapsack_optimize(request.budget, request.assets, request.risk_tolerance)
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/portfolio")
async def get_portfolio():
    """Get current portfolio positions (mock data)"""
    positions = []
    symbols = ["AAPL", "GOOGL", "MSFT"]
    
    for symbol in symbols:
        asset_data = MOCK_ASSETS[symbol]
        quantity = random.uniform(1, 10)
        current_price = asset_data["price"] * random.uniform(0.95, 1.05)  # Price fluctuation
        market_value = quantity * current_price
        pnl = market_value - (quantity * asset_data["price"])
        
        positions.append(PortfolioPosition(
            symbol=symbol,
            quantity=quantity,
            current_price=current_price,
            market_value=market_value,
            pnl=pnl,
            weight=market_value / 10000  # Assume total portfolio value of 10k
        ))
    
    total_value = sum(p.market_value for p in positions)
    total_pnl = sum(p.pnl for p in positions)
    
    return {
        "positions": positions,
        "summary": {
            "total_value": total_value,
            "total_pnl": total_pnl,
            "total_return": total_pnl / (total_value - total_pnl) if total_value != total_pnl else 0,
            "num_positions": len(positions)
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/market-data/{symbol}")
async def get_market_data(symbol: str):
    """Get market data for a specific symbol"""
    if symbol not in MOCK_ASSETS:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    asset_data = MOCK_ASSETS[symbol]
    # Generate mock historical data
    dates = []
    prices = []
    base_price = asset_data["price"]
    
    for i in range(30):  # 30 days of data
        date = datetime.now() - timedelta(days=29-i)
        dates.append(date.isoformat())
        # Random walk for price
        price_change = random.uniform(-0.05, 0.05)
        base_price *= (1 + price_change)
        prices.append(round(base_price, 2))
    
    return {
        "symbol": symbol,
        "current_price": asset_data["price"],
        "expected_return": asset_data["expected_return"],
        "risk": asset_data["risk"],
        "historical_data": {
            "dates": dates,
            "prices": prices
        },
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
