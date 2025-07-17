"""
Forecast API

Handles XGBoost model training and price forecasting.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import json
import pickle
import base64

from app.core.database import get_db, ForecastModel, MarketData
from app.services.data_service import get_data_service
from app.core.redis_client import get_redis


router = APIRouter()


class ForecastRequest(BaseModel):
    """Request for price forecast."""
    symbol: str = Field(..., description="Symbol to forecast")
    horizon_days: int = Field(5, description="Forecast horizon in days")
    confidence_level: float = Field(0.95, description="Confidence level for intervals")


class ForecastResponse(BaseModel):
    """Price forecast response."""
    symbol: str
    current_price: float
    forecast_prices: List[float]
    forecast_dates: List[str]
    confidence_intervals: List[Dict[str, float]]
    model_accuracy: Optional[float]
    forecast_direction: str  # "up", "down", "neutral"
    forecast_magnitude: float  # Expected price change percentage
    model_last_trained: Optional[datetime]
    timestamp: datetime


class ModelTrainingStatus(BaseModel):
    """Model training status."""
    symbol: str
    status: str  # "training", "completed", "failed"
    accuracy: Optional[float]
    training_start: datetime
    training_end: Optional[datetime]
    data_points_used: Optional[int]
    features_used: List[str]


@router.get("/forecast", response_model=ForecastResponse)
async def get_forecast(
    symbol: str,
    horizon_days: int = 5,
    confidence_level: float = 0.95,
    db: AsyncSession = Depends(get_db),
    data_service = Depends(get_data_service),
    redis_client = Depends(get_redis)
):
    """
    Get price forecast for a symbol.
    
    Uses trained XGBoost model to predict future prices based on
    technical indicators and historical patterns.
    """
    try:
        # Check for cached forecast first
        cache_key = f"forecast:{symbol}:{horizon_days}"
        cached_forecast = await redis_client.get_cached_response(cache_key)
        
        if cached_forecast:
            return ForecastResponse(**json.loads(cached_forecast))
        
        # Get current market data
        market_data = await data_service.client.get_market_data(symbol)
        if not market_data:
            raise HTTPException(
                status_code=404,
                detail=f"No market data available for {symbol}"
            )
        
        current_price = market_data.get('last_price')
        if not current_price:
            raise HTTPException(
                status_code=404,
                detail=f"No current price available for {symbol}"
            )
        
        # Get trained model from database
        result = await db.execute(
            select(ForecastModel).where(
                ForecastModel.symbol == symbol,
                ForecastModel.is_active == True
            ).order_by(ForecastModel.trained_at.desc())
        )
        model_record = result.scalar_one_or_none()
        
        if not model_record:
            # No trained model available, return simple forecast
            return _generate_simple_forecast(
                symbol, current_price, horizon_days, confidence_level
            )
        
        # Load the trained model
        try:
            model_data = base64.b64decode(model_record.model_data)
            model = pickle.loads(model_data)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load model: {str(e)}"
            )
        
        # Prepare features for prediction
        features = await _prepare_forecast_features(symbol, data_service)
        if not features:
            return _generate_simple_forecast(
                symbol, current_price, horizon_days, confidence_level
            )
        
        # Generate predictions
        predictions = []
        confidence_intervals = []
        forecast_dates = []
        
        for i in range(horizon_days):
            # Use the model to predict next price
            try:
                import numpy as np
                feature_array = np.array(features).reshape(1, -1)
                prediction = model.predict(feature_array)[0]
                predictions.append(float(prediction))
                
                # Simple confidence interval calculation
                volatility = 0.02  # 2% daily volatility assumption
                confidence_margin = volatility * (1.96 if confidence_level == 0.95 else 2.58)
                
                confidence_intervals.append({
                    "lower": prediction * (1 - confidence_margin),
                    "upper": prediction * (1 + confidence_margin)
                })
                
                # Generate forecast date
                forecast_date = datetime.utcnow() + timedelta(days=i+1)
                forecast_dates.append(forecast_date.strftime("%Y-%m-%d"))
                
                # Update features for next prediction (simplified)
                features[-1] = prediction  # Use prediction as next input
                
            except Exception as e:
                # Fallback to simple prediction
                trend = 0.001 * i  # 0.1% daily trend
                prediction = current_price * (1 + trend)
                predictions.append(prediction)
                
                confidence_intervals.append({
                    "lower": prediction * 0.98,
                    "upper": prediction * 1.02
                })
                
                forecast_date = datetime.utcnow() + timedelta(days=i+1)
                forecast_dates.append(forecast_date.strftime("%Y-%m-%d"))
        
        # Determine forecast direction and magnitude
        final_price = predictions[-1] if predictions else current_price
        price_change_pct = ((final_price - current_price) / current_price * 100) if current_price > 0 else 0
        
        if price_change_pct > 1:
            direction = "up"
        elif price_change_pct < -1:
            direction = "down"
        else:
            direction = "neutral"
        
        response = ForecastResponse(
            symbol=symbol,
            current_price=current_price,
            forecast_prices=predictions,
            forecast_dates=forecast_dates,
            confidence_intervals=confidence_intervals,
            model_accuracy=model_record.accuracy,
            forecast_direction=direction,
            forecast_magnitude=abs(price_change_pct),
            model_last_trained=model_record.trained_at,
            timestamp=datetime.utcnow()
        )
        
        # Cache the forecast
        await redis_client.set_cached_response(
            cache_key,
            json.dumps(response.dict(), default=str),
            ttl=3600  # 1 hour cache
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forecast/train/{symbol}")
async def train_forecast_model(
    symbol: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    redis_client = Depends(get_redis)
):
    """
    Trigger model training for a symbol.
    
    Starts background training of XGBoost model using historical data.
    """
    try:
        # Check if training is already in progress
        training_status = await redis_client.get_cached_response(f"training:{symbol}")
        if training_status:
            status_data = json.loads(training_status)
            if status_data.get("status") == "training":
                return {
                    "message": f"Training already in progress for {symbol}",
                    "status": "training",
                    "estimated_completion": "5-10 minutes"
                }
        
        # Start training in background
        background_tasks.add_task(
            _train_model_async,
            symbol,
            db,
            redis_client
        )
        
        # Mark training as started
        training_info = {
            "symbol": symbol,
            "status": "training",
            "training_start": datetime.utcnow().isoformat(),
            "estimated_completion": (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        }
        
        await redis_client.set_cached_response(
            f"training:{symbol}",
            json.dumps(training_info),
            ttl=3600
        )
        
        return {
            "message": f"Model training started for {symbol}",
            "status": "training",
            "training_id": f"training_{symbol}_{int(datetime.utcnow().timestamp())}",
            "estimated_completion": "5-10 minutes"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast/models")
async def list_forecast_models(
    db: AsyncSession = Depends(get_db)
):
    """List all trained forecast models."""
    try:
        result = await db.execute(
            select(ForecastModel).where(ForecastModel.is_active == True)
            .order_by(ForecastModel.trained_at.desc())
        )
        models = result.scalars().all()
        
        return [
            {
                "symbol": model.symbol,
                "model_type": model.model_type,
                "accuracy": model.accuracy,
                "trained_at": model.trained_at,
                "is_active": model.is_active
            }
            for model in models
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast/training-status/{symbol}")
async def get_training_status(
    symbol: str,
    redis_client = Depends(get_redis)
):
    """Get model training status for a symbol."""
    try:
        training_status = await redis_client.get_cached_response(f"training:{symbol}")
        
        if training_status:
            return json.loads(training_status)
        else:
            return {
                "symbol": symbol,
                "status": "not_found",
                "message": "No training in progress or completed recently"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _generate_simple_forecast(
    symbol: str, 
    current_price: float, 
    horizon_days: int, 
    confidence_level: float
) -> ForecastResponse:
    """Generate simple forecast when no trained model is available."""
    # Simple random walk with slight upward bias
    import numpy as np
    
    predictions = []
    confidence_intervals = []
    forecast_dates = []
    
    np.random.seed(42)  # For reproducible results
    
    price = current_price
    for i in range(horizon_days):
        # Random walk with small positive drift
        change = np.random.normal(0.001, 0.02)  # 0.1% drift, 2% volatility
        price *= (1 + change)
        predictions.append(price)
        
        # Confidence intervals
        volatility = 0.02 * np.sqrt(i + 1)  # Increasing uncertainty
        margin = volatility * (1.96 if confidence_level == 0.95 else 2.58)
        
        confidence_intervals.append({
            "lower": price * (1 - margin),
            "upper": price * (1 + margin)
        })
        
        forecast_date = datetime.utcnow() + timedelta(days=i+1)
        forecast_dates.append(forecast_date.strftime("%Y-%m-%d"))
    
    # Determine direction
    final_price = predictions[-1]
    price_change_pct = ((final_price - current_price) / current_price * 100)
    
    if price_change_pct > 0.5:
        direction = "up"
    elif price_change_pct < -0.5:
        direction = "down"
    else:
        direction = "neutral"
    
    return ForecastResponse(
        symbol=symbol,
        current_price=current_price,
        forecast_prices=predictions,
        forecast_dates=forecast_dates,
        confidence_intervals=confidence_intervals,
        model_accuracy=None,
        forecast_direction=direction,
        forecast_magnitude=abs(price_change_pct),
        model_last_trained=None,
        timestamp=datetime.utcnow()
    )


async def _prepare_forecast_features(symbol: str, data_service) -> Optional[List[float]]:
    """Prepare features for forecasting model."""
    try:
        # Get historical bars
        bars = await data_service.client.fetch_stooq_bars(symbol, interval=5)
        
        if len(bars) < 20:  # Need minimum data
            return None
        
        # Calculate technical indicators
        closes = [bar['close'] for bar in bars[-20:]]  # Last 20 periods
        
        # Simple moving averages
        sma_5 = sum(closes[-5:]) / 5
        sma_10 = sum(closes[-10:]) / 10
        sma_20 = sum(closes) / 20
        
        # Price ratios
        current_price = closes[-1]
        price_to_sma5 = current_price / sma_5 if sma_5 > 0 else 1
        price_to_sma10 = current_price / sma_10 if sma_10 > 0 else 1
        price_to_sma20 = current_price / sma_20 if sma_20 > 0 else 1
        
        # Volatility (simplified)
        import numpy as np
        returns = []
        for i in range(1, len(closes)):
            returns.append((closes[i] - closes[i-1]) / closes[i-1])
        
        volatility = np.std(returns) if returns else 0
        
        # Volume indicators (if available)
        volumes = [bar.get('volume', 0) for bar in bars[-10:]]
        avg_volume = sum(volumes) / len(volumes) if volumes else 0
        current_volume = bars[-1].get('volume', 0)
        volume_ratio = current_volume / avg_volume if avg_volume > 0 else 1
        
        # Return feature vector
        features = [
            current_price,
            price_to_sma5,
            price_to_sma10,
            price_to_sma20,
            volatility,
            volume_ratio,
            len(closes)  # Data recency indicator
        ]
        
        return features
        
    except Exception as e:
        print(f"Error preparing features: {e}")
        return None


async def _train_model_async(symbol: str, db: AsyncSession, redis_client):
    """Train XGBoost model asynchronously."""
    try:
        import numpy as np
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import mean_squared_error, r2_score
        
        # Try to import xgboost
        try:
            import xgboost as xgb
        except ImportError:
            # Fallback to sklearn if xgboost not available
            from sklearn.ensemble import RandomForestRegressor as ModelClass
            use_xgboost = False
        else:
            ModelClass = xgb.XGBRegressor
            use_xgboost = True
        
        # Update training status
        await redis_client.set_cached_response(
            f"training:{symbol}",
            json.dumps({
                "symbol": symbol,
                "status": "training",
                "progress": "Fetching historical data"
            }),
            ttl=3600
        )
        
        # Get historical market data from database
        async with async_session_maker() as session:
            result = await session.execute(
                select(MarketData).where(MarketData.symbol == symbol)
                .order_by(MarketData.timestamp.desc())
                .limit(1000)  # Last 1000 data points
            )
            market_data = result.scalars().all()
        
        if len(market_data) < 50:
            # Not enough data for training
            await redis_client.set_cached_response(
                f"training:{symbol}",
                json.dumps({
                    "symbol": symbol,
                    "status": "failed",
                    "error": "Insufficient historical data"
                }),
                ttl=3600
            )
            return
        
        # Prepare training data
        features = []
        targets = []
        
        # Sort by timestamp
        market_data.sort(key=lambda x: x.timestamp)
        
        for i in range(10, len(market_data) - 1):  # Need lookback and forward data
            # Create features from last 10 periods
            lookback_data = market_data[i-10:i]
            
            # Simple features: OHLC ratios, moving averages, etc.
            closes = [d.close_price for d in lookback_data]
            volumes = [d.volume for d in lookback_data]
            
            # Technical indicators
            sma_5 = sum(closes[-5:]) / 5
            sma_10 = sum(closes) / 10
            
            current_price = closes[-1]
            price_to_sma5 = current_price / sma_5 if sma_5 > 0 else 1
            price_to_sma10 = current_price / sma_10 if sma_10 > 0 else 1
            
            # Volatility
            returns = [(closes[j] - closes[j-1]) / closes[j-1] 
                      for j in range(1, len(closes))]
            volatility = np.std(returns) if returns else 0
            
            # Volume
            avg_volume = sum(volumes) / len(volumes) if volumes else 0
            volume_ratio = volumes[-1] / avg_volume if avg_volume > 0 else 1
            
            feature_vector = [
                current_price,
                price_to_sma5,
                price_to_sma10,
                volatility,
                volume_ratio
            ]
            
            # Target: next period's close price
            target = market_data[i + 1].close_price
            
            features.append(feature_vector)
            targets.append(target)
        
        if len(features) < 20:
            await redis_client.set_cached_response(
                f"training:{symbol}",
                json.dumps({
                    "symbol": symbol,
                    "status": "failed",
                    "error": "Insufficient features for training"
                }),
                ttl=3600
            )
            return
        
        # Convert to numpy arrays
        X = np.array(features)
        y = np.array(targets)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Update status
        await redis_client.set_cached_response(
            f"training:{symbol}",
            json.dumps({
                "symbol": symbol,
                "status": "training",
                "progress": "Training model",
                "data_points": len(features)
            }),
            ttl=3600
        )
        
        # Train model
        if use_xgboost:
            model = ModelClass(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42
            )
        else:
            model = ModelClass(
                n_estimators=100,
                max_depth=6,
                random_state=42
            )
        
        model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        accuracy = max(0, r2)  # Use R² as accuracy metric
        
        # Serialize model
        model_data = base64.b64encode(pickle.dumps(model)).decode('utf-8')
        
        # Save to database
        async with async_session_maker() as session:
            # Deactivate old models
            await session.execute(
                update(ForecastModel)
                .where(ForecastModel.symbol == symbol)
                .values(is_active=False)
            )
            
            # Create new model record
            new_model = ForecastModel(
                symbol=symbol,
                model_type="xgboost" if use_xgboost else "random_forest",
                model_data=model_data,
                accuracy=accuracy,
                is_active=True
            )
            
            session.add(new_model)
            await session.commit()
        
        # Update training status
        await redis_client.set_cached_response(
            f"training:{symbol}",
            json.dumps({
                "symbol": symbol,
                "status": "completed",
                "accuracy": accuracy,
                "training_end": datetime.utcnow().isoformat(),
                "data_points_used": len(features),
                "features_used": ["price", "sma_ratios", "volatility", "volume_ratio"]
            }),
            ttl=3600
        )
        
        # Publish training completion event
        await redis_client.publish_event("model_training_completed", {
            "symbol": symbol,
            "accuracy": accuracy,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        # Update status with error
        await redis_client.set_cached_response(
            f"training:{symbol}",
            json.dumps({
                "symbol": symbol,
                "status": "failed",
                "error": str(e),
                "training_end": datetime.utcnow().isoformat()
            }),
            ttl=3600
        )
        
        print(f"Model training failed for {symbol}: {e}")
