"""
WebSocket handlers for real-time data streaming.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict, Set
import asyncio
import json
from loguru import logger

from app.core.redis_client import get_redis
from app.services.data_service import get_data_service


class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_count = 0
    
    async def connect(self, websocket: WebSocket, channel: str):
        """Accept and store WebSocket connection."""
        await websocket.accept()
        
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        
        self.active_connections[channel].add(websocket)
        self.connection_count += 1
        
        logger.info(f"WebSocket connected to {channel}. Total connections: {self.connection_count}")
    
    def disconnect(self, websocket: WebSocket, channel: str):
        """Remove WebSocket connection."""
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
            if not self.active_connections[channel]:
                del self.active_connections[channel]
        
        self.connection_count -= 1
        logger.info(f"WebSocket disconnected from {channel}. Total connections: {self.connection_count}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to specific WebSocket."""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def broadcast_to_channel(self, message: str, channel: str):
        """Broadcast message to all connections in a channel."""
        if channel not in self.active_connections:
            return
        
        disconnected = set()
        
        for connection in self.active_connections[channel]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {channel}: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.active_connections[channel].discard(connection)
    
    async def broadcast_json_to_channel(self, data: dict, channel: str):
        """Broadcast JSON data to all connections in a channel."""
        message = json.dumps(data)
        await self.broadcast_to_channel(message, channel)


# Global connection manager
manager = ConnectionManager()
