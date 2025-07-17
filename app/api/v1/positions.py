"""
Positions API

Handles portfolio positions and holdings.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db, Position
from app.services.data_service import get_data_service


router = APIRouter()


class PositionResponse(BaseModel):
    """Response model for position data."""
    id: int
    symbol: str
    quantity: float
    avg_price: float
    current_price: Optional[float]
    market_value: Optional[float]
    unrealized_pnl: Optional[float]
    unrealized_pnl_percent: Optional[float]
    created_at: datetime
    updated_at: datetime


class PositionsSnapshot(BaseModel):
    """Complete positions snapshot."""
    positions: List[PositionResponse]
    total_market_value: float
    total_unrealized_pnl: float
    total_unrealized_pnl_percent: float
    cash_balance: float
    timestamp: datetime


@router.get("/positions", response_model=PositionsSnapshot)
async def get_positions(
    user_id: int = 1,  # Simplified - no auth for MVP
    db: AsyncSession = Depends(get_db),
    data_service = Depends(get_data_service)
):
    """
    Get current portfolio positions snapshot.
    
    Returns all positions with current market values and P&L calculations.
    """
    try:
        # Get positions from database
        result = await db.execute(
            select(Position).where(Position.user_id == user_id)
        )
        positions = result.scalars().all()
        
        position_responses = []
        total_market_value = 0.0
        total_unrealized_pnl = 0.0
        
        # Enrich positions with current market data
        for position in positions:
            # Get current market price
            market_data = await data_service.client.get_market_data(position.symbol)
            current_price = market_data.get('last_price') if market_data else None
            
            # Calculate market value and P&L
            market_value = None
            unrealized_pnl = None
            unrealized_pnl_percent = None
            
            if current_price:
                market_value = position.quantity * current_price
                unrealized_pnl = (current_price - position.avg_price) * position.quantity
                unrealized_pnl_percent = (
                    (current_price - position.avg_price) / position.avg_price * 100
                    if position.avg_price > 0 else 0
                )
                
                total_market_value += market_value
                total_unrealized_pnl += unrealized_pnl
                
                # Update position in database
                position.current_price = current_price
                position.unrealized_pnl = unrealized_pnl
                position.updated_at = datetime.utcnow()
            
            position_responses.append(PositionResponse(
                id=position.id,
                symbol=position.symbol,
                quantity=position.quantity,
                avg_price=position.avg_price,
                current_price=current_price,
                market_value=market_value,
                unrealized_pnl=unrealized_pnl,
                unrealized_pnl_percent=unrealized_pnl_percent,
                created_at=position.created_at,
                updated_at=position.updated_at
            ))
        
        # Commit price updates
        await db.commit()
        
        # Calculate total P&L percentage
        total_cost_basis = sum(p.quantity * p.avg_price for p in positions)
        total_unrealized_pnl_percent = (
            (total_unrealized_pnl / total_cost_basis * 100)
            if total_cost_basis > 0 else 0
        )
        
        return PositionsSnapshot(
            positions=position_responses,
            total_market_value=total_market_value,
            total_unrealized_pnl=total_unrealized_pnl,
            total_unrealized_pnl_percent=total_unrealized_pnl_percent,
            cash_balance=10000.0,  # Simplified - static cash balance
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/positions/{symbol}")
async def get_position(
    symbol: str,
    user_id: int = 1,
    db: AsyncSession = Depends(get_db),
    data_service = Depends(get_data_service)
):
    """Get position for a specific symbol."""
    try:
        result = await db.execute(
            select(Position).where(
                Position.user_id == user_id,
                Position.symbol == symbol
            )
        )
        position = result.scalar_one_or_none()
        
        if not position:
            raise HTTPException(status_code=404, detail="Position not found")
        
        # Get current market price
        market_data = await data_service.client.get_market_data(symbol)
        current_price = market_data.get('last_price') if market_data else None
        
        # Calculate market metrics
        market_value = None
        unrealized_pnl = None
        unrealized_pnl_percent = None
        
        if current_price:
            market_value = position.quantity * current_price
            unrealized_pnl = (current_price - position.avg_price) * position.quantity
            unrealized_pnl_percent = (
                (current_price - position.avg_price) / position.avg_price * 100
                if position.avg_price > 0 else 0
            )
        
        return PositionResponse(
            id=position.id,
            symbol=position.symbol,
            quantity=position.quantity,
            avg_price=position.avg_price,
            current_price=current_price,
            market_value=market_value,
            unrealized_pnl=unrealized_pnl,
            unrealized_pnl_percent=unrealized_pnl_percent,
            created_at=position.created_at,
            updated_at=position.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
