from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from loguru import logger

from app.core.config import settings
from app.core.database import init_db
from app.core.redis_client import init_redis
from app.api.v1 import positions, orders, risk, forecast, optimize
from app.websockets import data_ws, events_ws, fills_ws
from app.services.data_service import start_data_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting MKTO Backend...")
    await init_db()
    await init_redis()
    
    # Start background data service
    await start_data_service()
    
    yield
    
    # Shutdown
    logger.info("Shutting down MKTO Backend...")


app = FastAPI(
    title="MKTO Trading Backend",
    description="Free-tier trading system with knapsack optimization",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(positions.router, prefix="/v1", tags=["positions"])
app.include_router(orders.router, prefix="/v1", tags=["orders"])
app.include_router(risk.router, prefix="/v1", tags=["risk"])
app.include_router(forecast.router, prefix="/v1", tags=["forecast"])
app.include_router(optimize.router, prefix="/v1", tags=["optimize"])

# Include WebSocket routes
app.include_router(data_ws.router, prefix="/ws", tags=["websockets"])
app.include_router(events_ws.router, prefix="/ws", tags=["websockets"])
app.include_router(fills_ws.router, prefix="/ws", tags=["websockets"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "healthy", "service": "MKTO Backend"}


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": "2025-07-16T00:00:00Z"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True if settings.ENVIRONMENT == "development" else False
    )
