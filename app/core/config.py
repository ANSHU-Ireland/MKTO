from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings."""
    
    # App
    APP_NAME: str = "MKTO Backend"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database (Neon.tech Postgres)
    DATABASE_URL: Optional[str] = os.getenv(
        "DATABASE_URL", 
        "postgresql://user:password@localhost:5432/mkto"
    )
    
    # Redis (Upstash)
    REDIS_URL: Optional[str] = os.getenv(
        "REDIS_URL",
        "redis://localhost:6379/0"
    )
    
    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 12
    
    # Data sources
    STOOQ_BASE_URL: str = "https://stooq.com/q"
    YAHOO_BASE_URL: str = "https://query1.finance.yahoo.com/v7/finance"
    FMP_BASE_URL: str = "https://financialmodelingprep.com/api/v3"
    FMP_API_KEY: str = "demo"
    
    # Rate limits
    STOOQ_MAX_REQUESTS_PER_HOUR: int = 120
    YAHOO_MAX_REQUESTS_PER_DAY: int = 200
    DATA_POLL_INTERVAL_SECONDS: int = 30
    
    # Cache settings
    REDIS_CACHE_TTL_SECONDS: int = 60
    REDIS_BARS_RETENTION_DAYS: int = 5
    
    # Trading
    DEFAULT_TICKERS: list[str] = ["aapl.us", "msft.us", "goog.us", "tsla.us"]
    MAX_TICKERS: int = 30
    
    # Security
    BCRYPT_ROUNDS: int = 12
    
    # Observability
    METRICS_PORT: int = 9090
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
