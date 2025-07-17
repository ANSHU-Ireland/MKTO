"""
Real-time market data WebSocket endpoint.

Streams live market data from Redis to connected clients.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import asyncio
import json
import redis.asyncio as aioredis
from loguru import logger

from app.websockets import manager
from app.core.redis_client import get_redis
from app.core.config import settings


router = APIRouter()


@router.websocket("/data")
async def websocket_market_data(
    websocket: WebSocket,
    symbols: str = "aapl.us,msft.us,goog.us,tsla.us",
    redis_client = Depends(get_redis)
):
    """
    WebSocket endpoint for real-time market data.
    
    Streams live price updates from Redis to connected clients.
    
    Query Parameters:
    - symbols: Comma-separated list of symbols to subscribe to
    """
    channel = "market_data"
    
    try:
        await manager.connect(websocket, channel)
        
        # Parse requested symbols
        symbol_list = [s.strip().lower() for s in symbols.split(",")]
        
        # Send initial connection message
        await manager.send_personal_message(
            json.dumps({
                "type": "connection",
                "status": "connected",
                "subscribed_symbols": symbol_list,
                "message": "Market data stream connected"
            }),
            websocket
        )
        
        # Start Redis subscription in background
        subscription_task = asyncio.create_task(
            _stream_market_data(websocket, symbol_list, redis_client)
        )
        
        # Keep connection alive and handle client messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages
                if message.get("type") == "subscribe":
                    new_symbols = message.get("symbols", [])
                    symbol_list.extend(new_symbols)
                    
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "subscription_updated",
                            "subscribed_symbols": symbol_list
                        }),
                        websocket
                    )
                
                elif message.get("type") == "ping":
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "pong",
                            "timestamp": message.get("timestamp")
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
                logger.error(f"Error in WebSocket message handling: {e}")
                break
    
    except WebSocketDisconnect:
        logger.info("Market data WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, channel)
        if 'subscription_task' in locals():
            subscription_task.cancel()


async def _stream_market_data(
    websocket: WebSocket,
    symbol_list: list,
    redis_client
):
    """Stream market data from Redis to WebSocket."""
    try:
        # Create Redis pub/sub connection
        pubsub = redis_client.redis.pubsub()
        await pubsub.subscribe("ticks")
        
        logger.info(f"Started market data stream for symbols: {symbol_list}")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    # Parse tick data
                    tick_data = json.loads(message["data"])
                    symbol = tick_data.get("symbol", "").lower()
                    
                    # Filter by subscribed symbols
                    if symbol in symbol_list or not symbol_list:
                        # Format message for client
                        client_message = {
                            "type": "market_data",
                            "symbol": symbol,
                            "data": json.loads(tick_data.get("data", "{}")),
                            "timestamp": tick_data.get("timestamp")
                        }
                        
                        await manager.send_personal_message(
                            json.dumps(client_message),
                            websocket
                        )
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing tick data: {e}")
                except Exception as e:
                    logger.error(f"Error processing tick data: {e}")
    
    except asyncio.CancelledError:
        logger.info("Market data stream cancelled")
    except Exception as e:
        logger.error(f"Error in market data stream: {e}")
    finally:
        try:
            await pubsub.close()
        except:
            pass


@router.websocket("/data/bars")
async def websocket_market_bars(
    websocket: WebSocket,
    symbol: str = "aapl.us",
    interval: int = 5,
    redis_client = Depends(get_redis)
):
    """
    WebSocket endpoint for historical price bars.
    
    Streams historical price bar data for charting.
    """
    channel = f"bars_{symbol}_{interval}"
    
    try:
        await manager.connect(websocket, channel)
        
        # Send initial bars data
        bars = await redis_client.get_market_bars(symbol)
        
        await manager.send_personal_message(
            json.dumps({
                "type": "initial_bars",
                "symbol": symbol,
                "interval": interval,
                "bars": bars[-100:] if bars else [],  # Last 100 bars
                "count": len(bars) if bars else 0
            }),
            websocket
        )
        
        # Set up real-time bar updates
        last_bar_time = None
        
        # Subscribe to tick stream to build bars
        pubsub = redis_client.redis.pubsub()
        await pubsub.subscribe("ticks")
        
        current_bar = None
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    tick_data = json.loads(message["data"])
                    tick_symbol = tick_data.get("symbol", "").lower()
                    
                    if tick_symbol == symbol.lower():
                        tick_info = json.loads(tick_data.get("data", "{}"))
                        price = tick_info.get("last_price")
                        
                        if price:
                            # Simple bar aggregation (in real implementation, use proper time windows)
                            bar_update = {
                                "type": "bar_update",
                                "symbol": symbol,
                                "interval": interval,
                                "price": price,
                                "timestamp": tick_data.get("timestamp")
                            }
                            
                            await manager.send_personal_message(
                                json.dumps(bar_update),
                                websocket
                            )
                
                except Exception as e:
                    logger.error(f"Error processing bar update: {e}")
        
        # Keep connection alive
        while True:
            await asyncio.sleep(1)
    
    except WebSocketDisconnect:
        logger.info(f"Bars WebSocket disconnected for {symbol}")
    except Exception as e:
        logger.error(f"Bars WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, channel)


@router.websocket("/data/quotes")
async def websocket_quotes(
    websocket: WebSocket,
    symbols: str = "aapl.us,msft.us",
    redis_client = Depends(get_redis)
):
    """
    WebSocket endpoint for real-time quotes.
    
    Provides simplified quote stream with bid/ask/last prices.
    """
    channel = "quotes"
    
    try:
        await manager.connect(websocket, channel)
        
        symbol_list = [s.strip().lower() for s in symbols.split(",")]
        
        await manager.send_personal_message(
            json.dumps({
                "type": "quote_connection",
                "status": "connected",
                "symbols": symbol_list
            }),
            websocket
        )
        
        # Subscribe to market data
        pubsub = redis_client.redis.pubsub()
        await pubsub.subscribe("ticks")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    tick_data = json.loads(message["data"])
                    symbol = tick_data.get("symbol", "").lower()
                    
                    if symbol in symbol_list:
                        tick_info = json.loads(tick_data.get("data", "{}"))
                        
                        # Create simplified quote
                        quote = {
                            "type": "quote",
                            "symbol": symbol,
                            "last": tick_info.get("last_price"),
                            "bid": tick_info.get("last_price", 0) * 0.999,  # Mock bid
                            "ask": tick_info.get("last_price", 0) * 1.001,  # Mock ask
                            "high": tick_info.get("high"),
                            "low": tick_info.get("low"),
                            "volume": tick_info.get("volume"),
                            "timestamp": tick_data.get("timestamp")
                        }
                        
                        await manager.send_personal_message(
                            json.dumps(quote),
                            websocket
                        )
                
                except Exception as e:
                    logger.error(f"Error processing quote: {e}")
        
        while True:
            await asyncio.sleep(0.1)
    
    except WebSocketDisconnect:
        logger.info("Quotes WebSocket disconnected")
    except Exception as e:
        logger.error(f"Quotes WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, channel)
