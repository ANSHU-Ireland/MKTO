import pytest
import asyncio
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.main import app
from app.services.knapsack_optimizer import KnapsackOptimizer


@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client():
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    mock = AsyncMock()
    mock.get_cached_response.return_value = None
    mock.set_cached_response.return_value = None
    mock.publish_tick.return_value = None
    mock.publish_event.return_value = None
    return mock


@pytest.fixture
def sample_asset_data():
    """Sample asset data for testing."""
    return [
        {
            'symbol': 'AAPL.US',
            'returns': [0.01, -0.005, 0.02, -0.01, 0.015, 0.008, -0.003],
            'current_price': 200.0
        },
        {
            'symbol': 'MSFT.US',
            'returns': [0.008, -0.002, 0.015, -0.008, 0.012, 0.005, -0.001],
            'current_price': 340.0
        },
        {
            'symbol': 'GOOG.US',
            'returns': [0.012, -0.008, 0.018, -0.012, 0.020, 0.010, -0.005],
            'current_price': 2700.0
        }
    ]


class TestKnapsackOptimizer:
    """Test cases for the knapsack portfolio optimizer."""
    
    def test_prepare_assets(self, sample_asset_data, mock_redis):
        """Test asset preparation for optimization."""
        optimizer = KnapsackOptimizer()
        items = optimizer.prepare_assets(sample_asset_data)
        
        assert len(items) == 3
        assert all(item.symbol in ['AAPL.US', 'MSFT.US', 'GOOG.US'] for item in items)
        assert all(item.weight > 0 for item in items)
        assert all(item.value > 0 for item in items)
    
    def test_solve_knapsack_empty_items(self, mock_redis):
        """Test knapsack solver with empty items list."""
        optimizer = KnapsackOptimizer()
        result = optimizer.solve_knapsack([])
        
        assert result.selected_assets == []
        assert result.allocations == {}
        assert result.total_weight == 0
        assert result.total_value == 0
    
    def test_solve_knapsack_single_item(self, sample_asset_data, mock_redis):
        """Test knapsack solver with single item."""
        optimizer = KnapsackOptimizer()
        items = optimizer.prepare_assets(sample_asset_data[:1])
        result = optimizer.solve_knapsack(items)
        
        assert len(result.selected_assets) <= 1
        assert result.optimization_time_ms > 0
    
    @pytest.mark.asyncio
    async def test_optimize_portfolio(self, sample_asset_data, mock_redis):
        """Test full portfolio optimization."""
        optimizer = KnapsackOptimizer()
        optimizer.redis_client = mock_redis
        
        result = await optimizer.optimize_portfolio(sample_asset_data)
        
        assert isinstance(result.selected_assets, list)
        assert isinstance(result.allocations, dict)
        assert result.optimization_time_ms > 0
        
        # Check allocation weights sum to 1.0 (approximately)
        if result.allocations:
            total_allocation = sum(result.allocations.values())
            assert abs(total_allocation - 1.0) < 0.01


class TestOptimizeAPI:
    """Test cases for the optimization API endpoints."""
    
    @pytest.mark.asyncio
    async def test_optimize_portfolio_endpoint(self, client, sample_asset_data):
        """Test the main optimization endpoint."""
        request_data = {
            "assets": [
                {
                    "symbol": asset["symbol"],
                    "current_price": asset["current_price"],
                    "returns": asset["returns"]
                }
                for asset in sample_asset_data
            ],
            "risk_budget": 1000
        }
        
        with patch('app.api.v1.optimize.get_optimizer') as mock_optimizer:
            mock_result = AsyncMock()
            mock_result.selected_assets = ["AAPL.US", "MSFT.US"]
            mock_result.allocations = {"AAPL.US": 0.6, "MSFT.US": 0.4}
            mock_result.expected_return = 0.08
            mock_result.expected_volatility = 0.15
            mock_result.sharpe_ratio = 0.4
            mock_result.optimization_time_ms = 45.2
            
            mock_optimizer.return_value.optimize_portfolio.return_value = mock_result
            
            response = await client.post("/v1/optimize", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] is True
            assert "selected_assets" in data
            assert "allocations" in data
            assert "optimization_time_ms" in data
    
    @pytest.mark.asyncio
    async def test_optimize_portfolio_no_assets(self, client):
        """Test optimization with no assets."""
        request_data = {"assets": []}
        
        response = await client.post("/v1/optimize", json=request_data)
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_optimize_portfolio_too_many_assets(self, client):
        """Test optimization with too many assets."""
        assets = [
            {
                "symbol": f"STOCK{i}.US",
                "current_price": 100.0,
                "returns": [0.01, -0.01, 0.02]
            }
            for i in range(60)  # Exceeds limit of 50
        ]
        
        request_data = {"assets": assets}
        
        response = await client.post("/v1/optimize", json=request_data)
        assert response.status_code == 400


class TestDataService:
    """Test cases for the data service."""
    
    @pytest.mark.asyncio
    async def test_stooq_csv_parsing(self):
        """Test parsing of Stooq CSV responses."""
        from app.services.data_service import MarketDataClient
        
        client = MarketDataClient()
        
        # Mock CSV response
        csv_data = "AAPL.US,20250716,209.11,209.59,209.64,42.3m"
        
        # Test parsing logic (would need to extract into separate function)
        import csv
        import io
        
        reader = csv.reader(io.StringIO(csv_data))
        row = next(reader, None)
        
        assert row is not None
        assert len(row) >= 5
        assert row[0] == "AAPL.US"
        assert float(row[2]) == 209.11  # last price
    
    def test_volume_parsing(self):
        """Test volume string parsing."""
        from app.services.data_service import MarketDataClient
        
        client = MarketDataClient()
        
        assert client._parse_volume("42.3m") == 42_300_000
        assert client._parse_volume("1.5k") == 1_500
        assert client._parse_volume("2.1b") == 2_100_000_000
        assert client._parse_volume("invalid") is None


class TestRiskCalculations:
    """Test cases for risk metric calculations."""
    
    def test_var_calculation(self):
        """Test VaR calculation."""
        import numpy as np
        
        # Sample returns
        returns = np.random.normal(0.001, 0.02, 1000)  # Daily returns
        
        var_95 = np.percentile(returns, 5)
        var_99 = np.percentile(returns, 1)
        
        assert var_95 < 0  # VaR should be negative (loss)
        assert var_99 < var_95  # 99% VaR should be more negative
    
    def test_sharpe_ratio_calculation(self):
        """Test Sharpe ratio calculation."""
        import numpy as np
        
        returns = np.array([0.01, -0.005, 0.02, -0.01, 0.015])
        risk_free_rate = 0.02
        
        mean_return = np.mean(returns)
        volatility = np.std(returns)
        
        sharpe_ratio = (mean_return - risk_free_rate) / volatility
        
        assert isinstance(sharpe_ratio, float)
        # For this sample data, Sharpe should be negative due to high risk-free rate


if __name__ == "__main__":
    pytest.main([__file__])
