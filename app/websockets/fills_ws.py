"""
Fills WebSocket endpoint.

Streams real-time order fill events and execution updates.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import asyncio
import json
from datetime import datetime
from loguru import logger

from app.websockets import manager
from app.core.redis_client import get_redis


router = APIRouter()


@router.websocket("/fills")
async def websocket_fills(
    websocket: WebSocket,
    user_id: int = 1,
    redis_client = Depends(get_redis)
):
    """
    WebSocket endpoint for order fill events.
    
    Streams real-time order executions and fill confirmations.
    """
    channel = f"fills_user_{user_id}"
    
    try:
        await manager.connect(websocket, channel)
        
        # Send connection confirmation
        await manager.send_personal_message(
            json.dumps({
                "type": "fills_connection",
                "status": "connected",
                "user_id": user_id,
                "message": "Order fills stream connected"
            }),
            websocket
        )
        
        # Start fills stream
        fills_task = asyncio.create_task(
            _stream_fills(websocket, user_id, redis_client)
        )
        
        # Handle client messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "get_recent_fills":
                    # Send recent fills
                    recent_fills = await _get_recent_fills(user_id, redis_client)
                    
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "recent_fills",
                            "fills": recent_fills,
                            "count": len(recent_fills)
                        }),
                        websocket
                    )
                
                elif message.get("type") == "ping":
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat()
                        }),
                        websocket
                    )
            
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": "Invalid JSON format"
                    }),
                    websocket
                )
            except Exception as e:
                logger.error(f"Error in fills WebSocket: {e}")
                break
    
    except WebSocketDisconnect:
        logger.info(f"Fills WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"Fills WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, channel)
        if 'fills_task' in locals():
            fills_task.cancel()


async def _stream_fills(
    websocket: WebSocket,
    user_id: int,
    redis_client
):
    """Stream fill events from Redis to WebSocket."""
    try:
        # Subscribe to fills channel
        pubsub = redis_client.redis.pubsub()
        await pubsub.subscribe("fills")
        
        logger.info(f"Started fills stream for user {user_id}")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    fill_data = json.loads(message["data"])
                    
                    # For now, send all fills (in production, filter by user_id)
                    client_message = {
                        "type": "fill",
                        "fill_data": fill_data,
                        "timestamp": fill_data.get("timestamp")
                    }
                    
                    await manager.send_personal_message(
                        json.dumps(client_message),
                        websocket
                    )
                
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing fill data: {e}")
                except Exception as e:
                    logger.error(f"Error processing fill: {e}")
    
    except asyncio.CancelledError:
        logger.info("Fills stream cancelled")
    except Exception as e:
        logger.error(f"Error in fills stream: {e}")
    finally:
        try:
            await pubsub.close()
        except:
            pass


async def _get_recent_fills(user_id: int, redis_client) -> list:
    """Get recent fills for a user."""
    try:
        # Mock implementation - in production, query from database or Redis
        from datetime import timedelta
        
        mock_fills = [
            {
                "order_id": "order_123",
                "symbol": "AAPL.US",
                "side": "buy",
                "quantity": 100,
                "price": 209.50,
                "timestamp": (datetime.utcnow() - timedelta(minutes=2)).isoformat(),
                "slippage_bps": 1.5,
                "execution_venue": "paper_trading"
            },
            {
                "order_id": "order_124",
                "symbol": "MSFT.US",
                "side": "sell",
                "quantity": 50,
                "price": 342.25,
                "timestamp": (datetime.utcnow() - timedelta(minutes=10)).isoformat(),
                "slippage_bps": 2.1,
                "execution_venue": "paper_trading"
            },
            {
                "order_id": "order_125",
                "symbol": "GOOG.US",
                "side": "buy",
                "quantity": 25,
                "price": 2750.80,
                "timestamp": (datetime.utcnow() - timedelta(minutes=25)).isoformat(),
                "slippage_bps": 0.8,
                "execution_venue": "paper_trading"
            }
        ]
        
        return mock_fills
        
    except Exception as e:
        logger.error(f"Error getting recent fills: {e}")
        return []


@router.websocket("/fills/portfolio")
async def websocket_portfolio_updates(
    websocket: WebSocket,
    user_id: int = 1,
    redis_client = Depends(get_redis)
):
    """
    WebSocket endpoint for portfolio-level updates.
    
    Streams portfolio value changes, P&L updates, and position changes.
    """
    channel = f"portfolio_user_{user_id}"
    
    try:
        await manager.connect(websocket, channel)
        
        await manager.send_personal_message(
            json.dumps({
                "type": "portfolio_connection",
                "status": "connected",
                "user_id": user_id,
                "message": "Portfolio updates stream connected"
            }),
            websocket
        )
        
        # Send initial portfolio snapshot
        portfolio_snapshot = await _get_portfolio_snapshot(user_id)
        
        await manager.send_personal_message(
            json.dumps({
                "type": "portfolio_snapshot",
                "data": portfolio_snapshot,
                "timestamp": datetime.utcnow().isoformat()
            }),
            websocket
        )
        
        # Subscribe to fills to calculate portfolio updates
        pubsub = redis_client.redis.pubsub()
        await pubsub.subscribe("fills")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    fill_data = json.loads(message["data"])
                    
                    # Calculate portfolio impact
                    portfolio_update = await _calculate_portfolio_impact(fill_data, user_id)
                    
                    if portfolio_update:
                        await manager.send_personal_message(
                            json.dumps({
                                "type": "portfolio_update",
                                "data": portfolio_update,
                                "triggered_by_fill": fill_data.get("order_id"),
                                "timestamp": datetime.utcnow().isoformat()
                            }),
                            websocket
                        )
                
                except Exception as e:
                    logger.error(f"Error processing portfolio update: {e}")
        
        while True:
            await asyncio.sleep(1)
    
    except WebSocketDisconnect:
        logger.info(f"Portfolio updates WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"Portfolio updates WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, channel)


async def _get_portfolio_snapshot(user_id: int) -> dict:
    """Get current portfolio snapshot."""
    try:
        # Mock implementation
        return {
            "total_value": 125000.0,
            "cash_balance": 25000.0,
            "invested_amount": 100000.0,
            "unrealized_pnl": 5000.0,
            "unrealized_pnl_percent": 5.0,
            "day_change": 2500.0,
            "day_change_percent": 2.0,
            "position_count": 4,
            "largest_position": "AAPL.US",
            "largest_position_percent": 35.0
        }
    except Exception as e:
        logger.error(f"Error getting portfolio snapshot: {e}")
        return {}


async def _calculate_portfolio_impact(fill_data: dict, user_id: int) -> dict:
    """Calculate the impact of a fill on the portfolio."""
    try:
        # Mock calculation
        symbol = fill_data.get("symbol")
        side = fill_data.get("side")
        quantity = fill_data.get("quantity", 0)
        price = fill_data.get("price", 0)
        
        trade_value = quantity * price
        
        return {
            "symbol": symbol,
            "side": side,
            "trade_value": trade_value,
            "new_position_value": trade_value * 1.1,  # Mock
            "portfolio_value_change": trade_value if side == "buy" else -trade_value,
            "new_total_portfolio_value": 125000.0 + (trade_value if side == "buy" else -trade_value)
        }
        
    except Exception as e:
        logger.error(f"Error calculating portfolio impact: {e}")
        return {}


@router.websocket("/fills/execution")
async def websocket_execution_updates(
    websocket: WebSocket,
    redis_client = Depends(get_redis)
):
    """
    WebSocket endpoint for execution service updates.
    
    Streams execution latency, venue status, and order routing information.
    """
    channel = "execution_updates"
    
    try:
        await manager.connect(websocket, channel)
        
        await manager.send_personal_message(
            json.dumps({
                "type": "execution_connection",
                "status": "connected",
                "message": "Execution updates stream connected"
            }),
            websocket
        )
        
        # Send periodic execution metrics
        while True:
            # Mock execution metrics
            execution_metrics = {
                "type": "execution_metrics",
                "data": {
                    "avg_fill_time_ms": 45.2,
                    "fill_rate": 98.5,
                    "avg_slippage_bps": 1.8,
                    "orders_per_minute": 12,
                    "venue_status": {
                        "paper_trading": "healthy",
                        "primary_venue": "healthy",
                        "backup_venue": "degraded"
                    },
                    "latency_p95_ms": 78.3,
                    "latency_p99_ms": 125.7
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await manager.send_personal_message(
                json.dumps(execution_metrics),
                websocket
            )
            
            # Send updates every 30 seconds
            await asyncio.sleep(30)
    
    except WebSocketDisconnect:
        logger.info("Execution updates WebSocket disconnected")
    except Exception as e:
        logger.error(f"Execution updates WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, channel)
