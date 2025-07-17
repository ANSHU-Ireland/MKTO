import redis.asyncio as aioredis
from loguru import logger
from typing import Optional
import json

from app.core.config import settings


class RedisClient:
    """Redis client wrapper."""
    
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
    
    async def connect(self):
        """Connect to Redis."""
        try:
            self.redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis.ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis:
            await self.redis.close()
    
    async def set_cached_response(self, key: str, value: str, ttl: int = None):
        """Cache a response with TTL."""
        ttl = ttl or settings.REDIS_CACHE_TTL_SECONDS
        await self.redis.setex(key, ttl, value)
    
    async def get_cached_response(self, key: str) -> Optional[str]:
        """Get cached response."""
        return await self.redis.get(key)
    
    async def publish_tick(self, symbol: str, tick_data: dict):
        """Publish tick data to Redis streams."""
        await self.redis.xadd("ticks", {
            "symbol": symbol,
            "data": json.dumps(tick_data),
            "timestamp": tick_data.get("timestamp", "")
        })
    
    async def get_recent_ticks(self, symbol: str, count: int = 100) -> list:
        """Get recent ticks for a symbol."""
        try:
            # Get from Redis stream
            stream_data = await self.redis.xrevrange("ticks", count=count)
            ticks = []
            for entry_id, fields in stream_data:
                if fields.get("symbol") == symbol:
                    tick_data = json.loads(fields.get("data", "{}"))
                    ticks.append(tick_data)
            return ticks
        except Exception as e:
            logger.error(f"Error getting recent ticks: {e}")
            return []
    
    async def store_market_bars(self, symbol: str, bars: list):
        """Store market bars in Redis with expiration."""
        key = f"bars:{symbol}"
        await self.redis.setex(
            key,
            settings.REDIS_BARS_RETENTION_DAYS * 24 * 3600,
            json.dumps(bars)
        )
    
    async def get_market_bars(self, symbol: str) -> list:
        """Get market bars from Redis."""
        key = f"bars:{symbol}"
        data = await self.redis.get(key)
        return json.loads(data) if data else []
    
    async def publish_event(self, event_type: str, data: dict):
        """Publish event to Redis pub/sub."""
        await self.redis.publish("events", json.dumps({
            "type": event_type,
            "data": data,
            "timestamp": data.get("timestamp", "")
        }))
    
    async def publish_fill(self, fill_data: dict):
        """Publish fill event."""
        await self.redis.publish("fills", json.dumps(fill_data))


# Global Redis client instance
redis_client = RedisClient()


async def init_redis():
    """Initialize Redis connection."""
    await redis_client.connect()


async def get_redis() -> RedisClient:
    """Dependency to get Redis client."""
    return redis_client
