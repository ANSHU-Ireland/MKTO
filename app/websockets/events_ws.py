"""
Events WebSocket endpoint.

Streams system events like optimization results, risk alerts, etc.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import asyncio
import json
from loguru import logger

from app.websockets import manager
from app.core.redis_client import get_redis


router = APIRouter()


@router.websocket("/events")
async def websocket_events(
    websocket: WebSocket,
    event_types: str = "optimization,risk,training",
    redis_client = Depends(get_redis)
):
    """
    WebSocket endpoint for system events.
    
    Streams optimization results, risk alerts, model training updates, etc.
    
    Query Parameters:
    - event_types: Comma-separated list of event types to subscribe to
    """
    channel = "events"
    
    try:
        await manager.connect(websocket, channel)
        
        # Parse event types
        subscribed_events = [e.strip() for e in event_types.split(",")]
        
        # Send connection confirmation
        await manager.send_personal_message(
            json.dumps({
                "type": "events_connection",
                "status": "connected",
                "subscribed_events": subscribed_events,
                "message": "Events stream connected"
            }),
            websocket
        )
        
        # Start event stream
        event_task = asyncio.create_task(
            _stream_events(websocket, subscribed_events, redis_client)
        )
        
        # Handle client messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "subscribe_events":
                    new_events = message.get("event_types", [])
                    subscribed_events.extend(new_events)
                    
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "subscription_updated",
                            "subscribed_events": subscribed_events
                        }),
                        websocket
                    )
                
                elif message.get("type") == "get_recent_events":
                    # Send recent events (mock implementation)
                    recent_events = await _get_recent_events(redis_client)
                    
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "recent_events",
                            "events": recent_events
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
                logger.error(f"Error in events WebSocket: {e}")
                break
    
    except WebSocketDisconnect:
        logger.info("Events WebSocket disconnected")
    except Exception as e:
        logger.error(f"Events WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, channel)
        if 'event_task' in locals():
            event_task.cancel()


async def _stream_events(
    websocket: WebSocket,
    subscribed_events: list,
    redis_client
):
    """Stream events from Redis to WebSocket."""
    try:
        # Subscribe to events channel
        pubsub = redis_client.redis.pubsub()
        await pubsub.subscribe("events")
        
        logger.info(f"Started events stream for: {subscribed_events}")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    event_data = json.loads(message["data"])
                    event_type = event_data.get("type", "")
                    
                    # Filter by subscribed event types
                    if any(sub_type in event_type for sub_type in subscribed_events):
                        client_message = {
                            "type": "event",
                            "event_type": event_type,
                            "data": event_data.get("data", {}),
                            "timestamp": event_data.get("timestamp")
                        }
                        
                        await manager.send_personal_message(
                            json.dumps(client_message),
                            websocket
                        )
                
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing event data: {e}")
                except Exception as e:
                    logger.error(f"Error processing event: {e}")
    
    except asyncio.CancelledError:
        logger.info("Events stream cancelled")
    except Exception as e:
        logger.error(f"Error in events stream: {e}")
    finally:
        try:
            await pubsub.close()
        except:
            pass


async def _get_recent_events(redis_client) -> list:
    """Get recent events from Redis."""
    try:
        # In a real implementation, you'd store events in Redis with timestamps
        # For now, return mock events
        from datetime import datetime, timedelta
        
        mock_events = [
            {
                "type": "optimization_completed",
                "timestamp": (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
                "data": {
                    "selected_assets": ["AAPL.US", "MSFT.US", "GOOG.US"],
                    "optimization_time_ms": 45.2,
                    "sharpe_ratio": 1.45
                }
            },
            {
                "type": "risk_alert",
                "timestamp": (datetime.utcnow() - timedelta(minutes=15)).isoformat(),
                "data": {
                    "alert_type": "var_breach",
                    "severity": "medium",
                    "message": "Portfolio VaR exceeded threshold"
                }
            },
            {
                "type": "model_training_completed",
                "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                "data": {
                    "symbol": "AAPL.US",
                    "accuracy": 0.78,
                    "model_type": "xgboost"
                }
            }
        ]
        
        return mock_events
        
    except Exception as e:
        logger.error(f"Error getting recent events: {e}")
        return []


@router.websocket("/events/optimization")
async def websocket_optimization_events(
    websocket: WebSocket,
    redis_client = Depends(get_redis)
):
    """
    Dedicated WebSocket for optimization events.
    
    Streams real-time optimization progress and results.
    """
    channel = "optimization_events"
    
    try:
        await manager.connect(websocket, channel)
        
        await manager.send_personal_message(
            json.dumps({
                "type": "optimization_events_connection",
                "status": "connected",
                "message": "Optimization events stream connected"
            }),
            websocket
        )
        
        # Subscribe to optimization events
        pubsub = redis_client.redis.pubsub()
        await pubsub.subscribe("events")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    event_data = json.loads(message["data"])
                    event_type = event_data.get("type", "")
                    
                    # Filter optimization-related events
                    if "optimization" in event_type:
                        client_message = {
                            "type": "optimization_event",
                            "event_type": event_type,
                            "data": event_data.get("data", {}),
                            "timestamp": event_data.get("timestamp")
                        }
                        
                        await manager.send_personal_message(
                            json.dumps(client_message),
                            websocket
                        )
                
                except Exception as e:
                    logger.error(f"Error processing optimization event: {e}")
        
        while True:
            await asyncio.sleep(0.1)
    
    except WebSocketDisconnect:
        logger.info("Optimization events WebSocket disconnected")
    except Exception as e:
        logger.error(f"Optimization events WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, channel)


@router.websocket("/events/risk")
async def websocket_risk_events(
    websocket: WebSocket,
    redis_client = Depends(get_redis)
):
    """
    Dedicated WebSocket for risk management events.
    
    Streams risk alerts, VaR breaches, stress test results, etc.
    """
    channel = "risk_events"
    
    try:
        await manager.connect(websocket, channel)
        
        await manager.send_personal_message(
            json.dumps({
                "type": "risk_events_connection",
                "status": "connected",
                "message": "Risk events stream connected"
            }),
            websocket
        )
        
        # Subscribe to risk events
        pubsub = redis_client.redis.pubsub()
        await pubsub.subscribe("events")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    event_data = json.loads(message["data"])
                    event_type = event_data.get("type", "")
                    
                    # Filter risk-related events
                    if any(keyword in event_type for keyword in ["risk", "var", "stress", "alert"]):
                        client_message = {
                            "type": "risk_event",
                            "event_type": event_type,
                            "data": event_data.get("data", {}),
                            "timestamp": event_data.get("timestamp")
                        }
                        
                        await manager.send_personal_message(
                            json.dumps(client_message),
                            websocket
                        )
                
                except Exception as e:
                    logger.error(f"Error processing risk event: {e}")
        
        while True:
            await asyncio.sleep(0.1)
    
    except WebSocketDisconnect:
        logger.info("Risk events WebSocket disconnected")
    except Exception as e:
        logger.error(f"Risk events WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, channel)
