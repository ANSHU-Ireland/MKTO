"""
Orders API

Handles order placement and execution (paper trading).
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import random
import uuid

from app.core.database import get_db, Order, Position
from app.services.data_service import get_data_service
from app.core.redis_client import get_redis


router = APIRouter()


class OrderRequest(BaseModel):
    """Request model for placing orders."""
    symbol: str = Field(..., description="Trading symbol (e.g., 'AAPL.US')")
    side: str = Field(..., description="Order side: 'buy' or 'sell'")
    quantity: float = Field(..., gt=0, description="Order quantity")
    order_type: str = Field("market", description="Order type: 'market' or 'limit'")
    price: Optional[float] = Field(None, description="Limit price (required for limit orders)")


class OrderResponse(BaseModel):
    """Response model for order placement."""
    order_id: str
    symbol: str
    side: str
    quantity: float
    order_type: str
    price: Optional[float]
    status: str
    filled_quantity: float
    filled_price: Optional[float]
    created_at: datetime
    filled_at: Optional[datetime]
    estimated_fill_price: Optional[float]
    estimated_slippage_bps: Optional[float]


class OrderFill(BaseModel):
    """Model for order fill events."""
    order_id: str
    symbol: str
    side: str
    quantity: float
    price: float
    timestamp: datetime
    slippage_bps: float


@router.post("/orders", response_model=OrderResponse)
async def place_order(
    order_request: OrderRequest,
    background_tasks: BackgroundTasks,
    user_id: int = 1,  # Simplified - no auth for MVP
    db: AsyncSession = Depends(get_db),
    data_service = Depends(get_data_service),
    redis_client = Depends(get_redis)
):
    """
    Place a new order (paper trading).
    
    Orders are executed immediately with simulated slippage between 1-3 basis points.
    This is paper trading only - no real money is involved.
    """
    try:
        # Validate order
        if order_request.side not in ["buy", "sell"]:
            raise HTTPException(status_code=400, detail="Side must be 'buy' or 'sell'")
        
        if order_request.order_type not in ["market", "limit"]:
            raise HTTPException(status_code=400, detail="Order type must be 'market' or 'limit'")
        
        if order_request.order_type == "limit" and order_request.price is None:
            raise HTTPException(status_code=400, detail="Price required for limit orders")
        
        # Get current market price
        market_data = await data_service.client.get_market_data(order_request.symbol)
        if not market_data or not market_data.get('last_price'):
            raise HTTPException(
                status_code=404, 
                detail=f"No market data available for {order_request.symbol}"
            )
        
        market_price = market_data['last_price']
        
        # Create order in database
        order_id = str(uuid.uuid4())
        order = Order(
            id=order_id,
            user_id=user_id,
            symbol=order_request.symbol,
            side=order_request.side,
            quantity=order_request.quantity,
            price=order_request.price,
            order_type=order_request.order_type,
            status="pending",
            filled_quantity=0.0
        )
        
        db.add(order)
        await db.commit()
        await db.refresh(order)
        
        # For market orders, execute immediately
        if order_request.order_type == "market":
            fill_result = await _execute_market_order(
                order, market_price, db, redis_client
            )
            
            background_tasks.add_task(
                _process_order_fill,
                fill_result,
                user_id,
                db,
                redis_client
            )
            
            return OrderResponse(
                order_id=order_id,
                symbol=order.symbol,
                side=order.side,
                quantity=order.quantity,
                order_type=order.order_type,
                price=order.price,
                status=order.status,
                filled_quantity=order.filled_quantity,
                filled_price=order.filled_price,
                created_at=order.created_at,
                filled_at=order.filled_at,
                estimated_fill_price=fill_result['price'],
                estimated_slippage_bps=fill_result['slippage_bps']
            )
        
        # For limit orders, check if they can be filled immediately
        elif order_request.order_type == "limit":
            can_fill = (
                (order_request.side == "buy" and order_request.price >= market_price) or
                (order_request.side == "sell" and order_request.price <= market_price)
            )
            
            if can_fill:
                fill_result = await _execute_limit_order(
                    order, order_request.price, db, redis_client
                )
                
                background_tasks.add_task(
                    _process_order_fill,
                    fill_result,
                    user_id,
                    db,
                    redis_client
                )
            
            return OrderResponse(
                order_id=order_id,
                symbol=order.symbol,
                side=order.side,
                quantity=order.quantity,
                order_type=order.order_type,
                price=order.price,
                status=order.status,
                filled_quantity=order.filled_quantity,
                filled_price=order.filled_price,
                created_at=order.created_at,
                filled_at=order.filled_at,
                estimated_fill_price=order_request.price if can_fill else None,
                estimated_slippage_bps=0.0 if can_fill else None
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders")
async def get_orders(
    user_id: int = 1,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get order history for the user."""
    try:
        result = await db.execute(
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .limit(limit)
        )
        orders = result.scalars().all()
        
        return [
            OrderResponse(
                order_id=str(order.id),
                symbol=order.symbol,
                side=order.side,
                quantity=order.quantity,
                order_type=order.order_type,
                price=order.price,
                status=order.status,
                filled_quantity=order.filled_quantity,
                filled_price=order.filled_price,
                created_at=order.created_at,
                filled_at=order.filled_at,
                estimated_fill_price=None,
                estimated_slippage_bps=None
            )
            for order in orders
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}")
async def get_order(
    order_id: str,
    user_id: int = 1,
    db: AsyncSession = Depends(get_db)
):
    """Get specific order details."""
    try:
        result = await db.execute(
            select(Order).where(
                Order.id == order_id,
                Order.user_id == user_id
            )
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return OrderResponse(
            order_id=str(order.id),
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            order_type=order.order_type,
            price=order.price,
            status=order.status,
            filled_quantity=order.filled_quantity,
            filled_price=order.filled_price,
            created_at=order.created_at,
            filled_at=order.filled_at,
            estimated_fill_price=None,
            estimated_slippage_bps=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _execute_market_order(
    order: Order,
    market_price: float,
    db: AsyncSession,
    redis_client
) -> dict:
    """Execute a market order with simulated slippage."""
    # Simulate slippage (1-3 basis points)
    slippage_bps = random.uniform(1.0, 3.0)
    slippage_factor = slippage_bps / 10000.0
    
    if order.side == "buy":
        fill_price = market_price * (1 + slippage_factor)
    else:  # sell
        fill_price = market_price * (1 - slippage_factor)
    
    # Update order status
    order.status = "filled"
    order.filled_quantity = order.quantity
    order.filled_price = fill_price
    order.filled_at = datetime.utcnow()
    
    await db.commit()
    
    return {
        'order_id': str(order.id),
        'symbol': order.symbol,
        'side': order.side,
        'quantity': order.quantity,
        'price': fill_price,
        'slippage_bps': slippage_bps,
        'timestamp': order.filled_at
    }


async def _execute_limit_order(
    order: Order,
    limit_price: float,
    db: AsyncSession,
    redis_client
) -> dict:
    """Execute a limit order at the limit price."""
    # Limit orders fill at the specified price (no slippage)
    order.status = "filled"
    order.filled_quantity = order.quantity
    order.filled_price = limit_price
    order.filled_at = datetime.utcnow()
    
    await db.commit()
    
    return {
        'order_id': str(order.id),
        'symbol': order.symbol,
        'side': order.side,
        'quantity': order.quantity,
        'price': limit_price,
        'slippage_bps': 0.0,
        'timestamp': order.filled_at
    }


async def _process_order_fill(
    fill_result: dict,
    user_id: int,
    db: AsyncSession,
    redis_client
):
    """Process order fill and update positions."""
    try:
        symbol = fill_result['symbol']
        side = fill_result['side']
        quantity = fill_result['quantity']
        price = fill_result['price']
        
        # Update or create position
        async with async_session_maker() as session:
            result = await session.execute(
                select(Position).where(
                    Position.user_id == user_id,
                    Position.symbol == symbol
                )
            )
            position = result.scalar_one_or_none()
            
            if position:
                # Update existing position
                if side == "buy":
                    # Calculate new average price
                    total_cost = (position.quantity * position.avg_price) + (quantity * price)
                    total_quantity = position.quantity + quantity
                    position.avg_price = total_cost / total_quantity
                    position.quantity = total_quantity
                else:  # sell
                    position.quantity -= quantity
                    
                    # Remove position if quantity becomes zero or negative
                    if position.quantity <= 0:
                        await session.delete(position)
                    
                position.updated_at = datetime.utcnow()
            else:
                # Create new position (only for buy orders)
                if side == "buy":
                    position = Position(
                        user_id=user_id,
                        symbol=symbol,
                        quantity=quantity,
                        avg_price=price
                    )
                    session.add(position)
            
            await session.commit()
        
        # Publish fill event to WebSocket
        fill_event = {
            "order_id": fill_result['order_id'],
            "symbol": symbol,
            "side": side,
            "quantity": quantity,
            "price": price,
            "timestamp": fill_result['timestamp'].isoformat(),
            "slippage_bps": fill_result['slippage_bps']
        }
        
        await redis_client.publish_fill(fill_event)
        
    except Exception as e:
        print(f"Error processing order fill: {e}")  # Log error
