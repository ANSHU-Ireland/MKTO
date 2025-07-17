"""
Data Service - Market Data Collection

Polls Stooq, Yahoo Finance, and Financial Modeling Prep for market data.
Implements rate limiting and caching to stay within free tier limits.
"""

import asyncio
import aiohttp
import csv
import io
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from loguru import logger
import json

from app.core.config import settings
from app.core.redis_client import get_redis
from app.core.database import MarketData, async_session_maker


class RateLimiter:
    """Simple rate limiter for API calls."""
    
    def __init__(self, max_calls: int, window_seconds: int):
        self.max_calls = max_calls
        self.window_seconds = window_seconds
        self.calls = []
    
    async def acquire(self):
        """Wait if necessary to respect rate limits."""
        now = datetime.utcnow()
        # Remove old calls outside the window
        self.calls = [call_time for call_time in self.calls 
                     if (now - call_time).total_seconds() < self.window_seconds]
        
        if len(self.calls) >= self.max_calls:
            # Wait until the oldest call expires
            sleep_time = self.window_seconds - (now - self.calls[0]).total_seconds()
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
        
        self.calls.append(now)


class MarketDataClient:
    """Client for fetching market data from multiple sources."""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.redis_client = None
        
        # Rate limiters
        self.stooq_limiter = RateLimiter(
            settings.STOOQ_MAX_REQUESTS_PER_HOUR, 
            3600
        )
        self.yahoo_limiter = RateLimiter(
            settings.YAHOO_MAX_REQUESTS_PER_DAY, 
            86400
        )
        
        # Track last successful fetch times
        self.last_fetch = {}
    
    async def start(self):
        """Initialize the client."""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=10),
            headers={'User-Agent': 'MKTO/1.0'}
        )
        self.redis_client = await get_redis()
        logger.info("Market data client initialized")
    
    async def stop(self):
        """Clean up the client."""
        if self.session:
            await self.session.close()
    
    async def fetch_stooq_quote(self, symbol: str) -> Optional[Dict]:
        """
        Fetch last quote from Stooq.
        
        Example response:
        AAPL.US,20250716,209.11,209.59,209.64,42.3m
        """
        url = f"{settings.STOOQ_BASE_URL}/l/?s={symbol}"
        
        # Check cache first
        cache_key = f"stooq_quote:{symbol}"
        cached = await self.redis_client.get_cached_response(cache_key)
        if cached:
            return json.loads(cached)
        
        try:
            await self.stooq_limiter.acquire()
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    text = await response.text()
                    
                    # Parse CSV response
                    reader = csv.reader(io.StringIO(text))
                    row = next(reader, None)
                    
                    if row and len(row) >= 5:
                        data = {
                            "symbol": row[0],
                            "date": row[1],
                            "last_price": float(row[2]) if row[2] else None,
                            "high": float(row[3]) if row[3] else None,
                            "low": float(row[4]) if row[4] else None,
                            "volume": self._parse_volume(row[5]) if len(row) > 5 else None,
                            "timestamp": datetime.utcnow().isoformat(),
                            "source": "stooq"
                        }
                        
                        # Cache response
                        await self.redis_client.set_cached_response(
                            cache_key, 
                            json.dumps(data),
                            ttl=60
                        )
                        
                        self.last_fetch[f"stooq:{symbol}"] = datetime.utcnow()
                        return data
                
        except Exception as e:
            logger.error(f"Error fetching Stooq quote for {symbol}: {e}")
        
        return None
    
    async def fetch_stooq_bars(self, symbol: str, interval: int = 5) -> List[Dict]:
        """
        Fetch intraday bars from Stooq.
        
        Args:
            symbol: Stock symbol (e.g., "aapl.us")
            interval: Interval in minutes (5, 15, 30, 60)
        """
        url = f"{settings.STOOQ_BASE_URL}/d/l/?s={symbol}&i={interval}"
        
        # Check cache
        cache_key = f"stooq_bars:{symbol}:{interval}"
        cached = await self.redis_client.get_cached_response(cache_key)
        if cached:
            return json.loads(cached)
        
        try:
            await self.stooq_limiter.acquire()
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    text = await response.text()
                    
                    # Parse CSV response
                    reader = csv.DictReader(io.StringIO(text))
                    bars = []
                    
                    for row in reader:
                        if all(key in row for key in ['Date', 'Time', 'Open', 'High', 'Low', 'Close']):
                            try:
                                bar = {
                                    "symbol": symbol,
                                    "datetime": f"{row['Date']} {row['Time']}",
                                    "open": float(row['Open']),
                                    "high": float(row['High']),
                                    "low": float(row['Low']),
                                    "close": float(row['Close']),
                                    "volume": float(row.get('Volume', 0)),
                                    "source": "stooq"
                                }
                                bars.append(bar)
                            except (ValueError, KeyError):
                                continue
                    
                    # Cache bars
                    await self.redis_client.set_cached_response(
                        cache_key,
                        json.dumps(bars),
                        ttl=300  # 5 minutes for bars
                    )
                    
                    return bars
                
        except Exception as e:
            logger.error(f"Error fetching Stooq bars for {symbol}: {e}")
        
        return []
    
    async def fetch_yahoo_quote(self, symbol: str) -> Optional[Dict]:
        """
        Fetch quote from Yahoo Finance as fallback.
        
        Args:
            symbol: Yahoo symbol (e.g., "AAPL")
        """
        # Convert symbol format if needed
        yahoo_symbol = symbol.upper().replace('.US', '')
        
        url = f"{settings.YAHOO_BASE_URL}/quote?symbols={yahoo_symbol}"
        
        # Check cache
        cache_key = f"yahoo_quote:{yahoo_symbol}"
        cached = await self.redis_client.get_cached_response(cache_key)
        if cached:
            return json.loads(cached)
        
        try:
            await self.yahoo_limiter.acquire()
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if 'quoteResponse' in data and 'result' in data['quoteResponse']:
                        quotes = data['quoteResponse']['result']
                        if quotes:
                            quote = quotes[0]
                            
                            result = {
                                "symbol": quote.get('symbol'),
                                "last_price": quote.get('regularMarketPrice'),
                                "high": quote.get('regularMarketDayHigh'),
                                "low": quote.get('regularMarketDayLow'),
                                "volume": quote.get('regularMarketVolume'),
                                "timestamp": datetime.utcnow().isoformat(),
                                "source": "yahoo"
                            }
                            
                            # Cache response
                            await self.redis_client.set_cached_response(
                                cache_key,
                                json.dumps(result),
                                ttl=180  # 3 minutes for Yahoo
                            )
                            
                            return result
                
        except Exception as e:
            logger.error(f"Error fetching Yahoo quote for {yahoo_symbol}: {e}")
        
        return None
    
    async def fetch_fmp_profile(self, symbol: str) -> Optional[Dict]:
        """
        Fetch company profile from Financial Modeling Prep.
        
        Args:
            symbol: Stock symbol (e.g., "AAPL")
        """
        fmp_symbol = symbol.upper().replace('.US', '')
        url = f"{settings.FMP_BASE_URL}/profile/{fmp_symbol}?apikey={settings.FMP_API_KEY}"
        
        # Check cache (longer TTL for fundamentals)
        cache_key = f"fmp_profile:{fmp_symbol}"
        cached = await self.redis_client.get_cached_response(cache_key)
        if cached:
            return json.loads(cached)
        
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data and isinstance(data, list) and len(data) > 0:
                        profile = data[0]
                        
                        result = {
                            "symbol": profile.get('symbol'),
                            "company_name": profile.get('companyName'),
                            "sector": profile.get('sector'),
                            "industry": profile.get('industry'),
                            "market_cap": profile.get('mktCap'),
                            "beta": profile.get('beta'),
                            "timestamp": datetime.utcnow().isoformat(),
                            "source": "fmp"
                        }
                        
                        # Cache for 24 hours
                        await self.redis_client.set_cached_response(
                            cache_key,
                            json.dumps(result),
                            ttl=86400
                        )
                        
                        return result
                
        except Exception as e:
            logger.error(f"Error fetching FMP profile for {fmp_symbol}: {e}")
        
        return None
    
    def _parse_volume(self, volume_str: str) -> Optional[float]:
        """Parse volume string like '42.3m' to float."""
        if not volume_str:
            return None
        
        try:
            volume_str = volume_str.lower().strip()
            if volume_str.endswith('m'):
                return float(volume_str[:-1]) * 1_000_000
            elif volume_str.endswith('k'):
                return float(volume_str[:-1]) * 1_000
            elif volume_str.endswith('b'):
                return float(volume_str[:-1]) * 1_000_000_000
            else:
                return float(volume_str)
        except (ValueError, AttributeError):
            return None
    
    async def get_market_data(self, symbol: str) -> Optional[Dict]:
        """
        Get market data with fallback logic.
        
        Priority:
        1. Stooq (primary)
        2. Yahoo Finance (fallback)
        3. FMP (enrichment)
        """
        # Try Stooq first
        stooq_data = await self.fetch_stooq_quote(symbol)
        
        # Check if Stooq data is recent enough
        if stooq_data and self._is_data_fresh(stooq_data, max_age_minutes=3):
            return stooq_data
        
        # Fallback to Yahoo
        logger.info(f"Using Yahoo fallback for {symbol}")
        yahoo_data = await self.fetch_yahoo_quote(symbol)
        
        return yahoo_data or stooq_data
    
    def _is_data_fresh(self, data: Dict, max_age_minutes: int = 3) -> bool:
        """Check if data is fresh enough."""
        try:
            timestamp = datetime.fromisoformat(data.get('timestamp', ''))
            age = (datetime.utcnow() - timestamp).total_seconds() / 60
            return age <= max_age_minutes
        except (ValueError, TypeError):
            return False


class DataService:
    """Main data service orchestrator."""
    
    def __init__(self):
        self.client = MarketDataClient()
        self.running = False
        self.redis_client = None
    
    async def start(self):
        """Start the data service."""
        await self.client.start()
        self.redis_client = await get_redis()
        self.running = True
        
        # Start the polling loop
        asyncio.create_task(self._polling_loop())
        logger.info("Data service started")
    
    async def stop(self):
        """Stop the data service."""
        self.running = False
        await self.client.stop()
        logger.info("Data service stopped")
    
    async def _polling_loop(self):
        """Main polling loop for market data."""
        logger.info("Starting market data polling loop")
        
        while self.running:
            try:
                # Poll each ticker
                for symbol in settings.DEFAULT_TICKERS:
                    if not self.running:
                        break
                    
                    data = await self.client.get_market_data(symbol)
                    if data:
                        # Publish to Redis streams
                        await self.redis_client.publish_tick(symbol, data)
                        
                        # Store in database (optional, for historical analysis)
                        await self._store_market_data(data)
                
                # Wait before next poll
                await asyncio.sleep(settings.DATA_POLL_INTERVAL_SECONDS)
                
            except Exception as e:
                logger.error(f"Error in polling loop: {e}")
                await asyncio.sleep(5)  # Short sleep on error
    
    async def _store_market_data(self, data: Dict):
        """Store market data in database."""
        try:
            async with async_session_maker() as session:
                market_data = MarketData(
                    symbol=data.get('symbol'),
                    timestamp=datetime.utcnow(),
                    open_price=data.get('last_price', 0),  # Simplified for quotes
                    high_price=data.get('high', 0),
                    low_price=data.get('low', 0),
                    close_price=data.get('last_price', 0),
                    volume=data.get('volume', 0),
                    source=data.get('source', 'unknown')
                )
                session.add(market_data)
                await session.commit()
        except Exception as e:
            logger.error(f"Error storing market data: {e}")


# Global data service instance
data_service = DataService()


async def start_data_service():
    """Start the global data service."""
    await data_service.start()


async def stop_data_service():
    """Stop the global data service."""
    await data_service.stop()


async def get_data_service() -> DataService:
    """Dependency to get data service."""
    return data_service
