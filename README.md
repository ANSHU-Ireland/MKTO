# MKTO Portfolio Optimization Platform

🚀 **AI-Powered Portfolio Optimization using Advanced Metaheuristic Algorithms**

A modern, full-stack portfolio optimization platform that combines cutting-edge financial algorithms with a sleek, responsive user interface.

## ✨ Features

### 🔬 **Advanced Optimization Algorithms**
- **Knapsack Algorithm** - Core portfolio selection optimization
- **Genetic Algorithm** - Evolutionary optimization approach
- **Simulated Annealing** - Probabilistic optimization technique
- **Particle Swarm Optimization** - Swarm intelligence-based approach
- **Tabu Search** - Memory-based local search
- **Hybrid Algorithm** - Combination of multiple techniques

### 🎨 **Modern User Interface**
- **React 18.2** with modern hooks and state management
- **Tailwind CSS** for responsive, utility-first styling
- **Vite** for lightning-fast development and building
- **Interactive Portfolio Cards** with flip animations
- **Real-time Risk Assessment** with visual indicators
- **Dynamic Asset Selection** with smart suggestions

### ⚡ **High-Performance Backend**
- **FastAPI** for blazing-fast API responses
- **Async/Await** for concurrent request handling
- **Pydantic** for robust data validation
- **CORS-enabled** for seamless frontend integration
- **RESTful API** with comprehensive documentation

## 🚀 Quick Start

### Method 1: Development Script (Recommended)
```bash
./start-dev.sh
```

### Method 2: Manual Setup

#### Backend Setup
```bash
# Create Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn httpx

# Start backend server
uvicorn app.simple_main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

## 🌐 Application URLs

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
    weight = scale_volatility(asset.volatility, max_risk=100)
    value = scale_return(asset.sharpe_ratio, max_value=100)

optimal_portfolio = knapsack_dp(assets, risk_budget)
```

### Why Knapsack for Portfolio Optimization?

1. **Discrete Selection**: Choose whole assets (vs. continuous weights)
2. **Risk Budgeting**: Hard constraint on total portfolio risk
3. **Scalability**: O(n*W) complexity, efficient for 30-50 assets
4. **Interpretability**: Clear trade-offs between risk and return

## 🚀 Quick Start

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ANSHU-Ireland/MKTO.git
cd MKTO

# Start with Docker Compose (recommended)
make dev

# Or run locally
pip install -r requirements.txt
make dev-local
```

### API Endpoints

#### Portfolio Optimization
```bash
# Optimize portfolio with knapsack algorithm
curl -X POST "http://localhost:8000/v1/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "assets": [
      {
        "symbol": "AAPL.US",
        "current_price": 209.50,
        "returns": [0.01, -0.005, 0.02, -0.01, 0.015]
      },
      {
        "symbol": "MSFT.US", 
        "current_price": 342.25,
        "returns": [0.008, -0.002, 0.015, -0.008, 0.012]
      }
    ],
    "risk_budget": 1000
  }'

# Response
{
  "success": true,
  "selected_assets": ["AAPL.US", "MSFT.US"],
  "allocations": {"AAPL.US": 0.6, "MSFT.US": 0.4},
  "expected_return": 0.085,
  "sharpe_ratio": 1.23,
  "optimization_time_ms": 45.2
}
```

#### Market Data
```bash
# Get current positions
curl "http://localhost:8000/v1/positions"

# Place order (paper trading)
curl -X POST "http://localhost:8000/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL.US",
    "side": "buy",
    "quantity": 100,
    "order_type": "market"
  }'

# Get risk metrics
curl "http://localhost:8000/v1/risk/snapshot"

# Get price forecast
curl "http://localhost:8000/v1/forecast?symbol=AAPL.US&horizon_days=5"
```

#### WebSocket Streams
```javascript
// Real-time market data
const ws = new WebSocket('ws://localhost:8000/ws/data?symbols=aapl.us,msft.us');

// Order fills
const fillsWs = new WebSocket('ws://localhost:8000/ws/fills');

// System events (optimization, alerts)
const eventsWs = new WebSocket('ws://localhost:8000/ws/events');
```

## 🎯 Market Data Sources

### Primary: Stooq (No API Key)
```
https://stooq.com/q/l/?s=aapl.us          # Last quote
https://stooq.com/q/d/l/?s=aapl.us&i=5    # 5-min bars
```
- Rate limit: 120 requests/hour per symbol
- Coverage: US stocks, indices, crypto
- Reliability: High, used by QuantStart

### Fallback: Yahoo Finance
```
https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL
```
- Rate limit: 200 requests/day total
- Backup when Stooq fails
- Server-side only (CORS blocked)

### Enrichment: Financial Modeling Prep
```
https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=demo
```
- Fundamentals and company data
- Demo key works without signup
- Cached for 24 hours

## 💾 Free Tier Infrastructure

| Service | Provider | Limit | Usage |
|---------|----------|-------|--------|
| **Compute** | Fly.io | 256MB shared CPU | FastAPI app |
| **Database** | Neon.tech | 1GB Postgres | Positions, orders, risk |
| **Cache** | Upstash | 10K requests/day | Market data, pub/sub |
| **CI/CD** | GitHub Actions | 2000 min/month | Tests, build, deploy |
| **Monitoring** | Fly.io Grafana | Free tier | Logs, metrics |
| **Registry** | GitHub Packages | 500MB | Docker images |

## 🧪 Testing

```bash
# Run all tests
make test

# Run with coverage
make coverage

# Performance testing
make perf

# Security scan
make security
```

### Test Categories

- **Unit Tests**: Knapsack algorithm, risk calculations
- **Integration Tests**: API endpoints, database operations  
- **Performance Tests**: Optimization latency, WebSocket throughput
- **E2E Tests**: Full trading workflow simulation

## 📊 API Documentation

Interactive docs available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🔒 Security & Compliance

### MVP Security Features
- Hashed passwords (bcrypt, cost 12)
- JWT tokens (12-hour expiry)
- Weekly secret rotation
- GDPR-lite user deletion
- Paper trading only (no real money)

### Rate Limiting
```python
# Built-in rate limiting
STOOQ_MAX_REQUESTS_PER_HOUR = 120
YAHOO_MAX_REQUESTS_PER_DAY = 200
REDIS_CACHE_TTL_SECONDS = 60
```

## 📈 Observability

### Structured Logging
```python
from loguru import logger

logger.info("METRICS optimization_time_ms={time}", time=45.2)
logger.info("METRICS portfolio_sharpe_ratio={sharpe}", sharpe=1.23)
```

### Prometheus Metrics
```
# Optimization performance
optim_latency_ms 23.7
optim_selections_count 4
portfolio_sharpe_ratio 1.23

# Data ingestion
market_data_requests_total{source="stooq"} 1250
market_data_errors_total{source="yahoo"} 5
```

### Alerting
```python
# Auto-create GitHub issues for critical alerts
if optimization_latency_p95 > 100:
    create_github_issue("Optimization latency breach")
```

## 🚢 Deployment

### Local Development
```bash
make dev              # Docker Compose stack
make dev-local        # Local Python server
```

### Production Deployment
```bash
# Deploy to Fly.io
flyctl deploy

# Or via GitHub Actions (automatic)
git push origin main
```

### Environment Variables
```bash
# Required
DATABASE_URL="postgresql://user:pass@host:5432/mkto"
REDIS_URL="redis://host:6379/0"
JWT_SECRET_KEY="your-secret-key"

# Optional
STOOQ_MAX_REQUESTS_PER_HOUR=120
YAHOO_MAX_REQUESTS_PER_DAY=200
DATA_POLL_INTERVAL_SECONDS=30
```

## 🎪 Sample Data & Demo

### Seeded Test Data
- 3 sample positions (AAPL, MSFT, GOOG)
- Historical market data
- Risk metrics baseline
- Order history

### Demo Workflow
1. **Portfolio View**: GET `/v1/positions`
2. **Optimization**: POST `/v1/optimize` 
3. **Order Placement**: POST `/v1/orders`
4. **Risk Analysis**: GET `/v1/risk/snapshot`
5. **Price Forecast**: GET `/v1/forecast?symbol=AAPL.US`

## 🔧 Configuration

### Knapsack Optimizer Settings
```python
KNAPSACK_MAX_WEIGHT = 1000        # Risk budget scale
KNAPSACK_RISK_FREE_RATE = 0.02    # 2% risk-free rate
MAX_ASSET_ALLOCATION = 0.25       # 25% max per asset
OPTIMIZATION_TIMEOUT_MS = 5000    # 5 second timeout
```

### Data Service Settings
```python
DEFAULT_TICKERS = ["aapl.us", "msft.us", "goog.us", "tsla.us"]
MAX_TICKERS = 30
DATA_POLL_INTERVAL_SECONDS = 30
REDIS_BARS_RETENTION_DAYS = 5
```

## 🐛 Troubleshooting

### Common Issues

**"No market data available"**
```bash
# Check data service status
curl http://localhost:8000/health
# Check Redis connection
redis-cli ping
```

**"Optimization timeout"**
```bash
# Check if too many assets (max 50)
# Reduce risk_budget parameter
# Check system resources
```

**"WebSocket connection failed"**
```bash
# Check Redis pub/sub
# Verify WebSocket endpoint URL
# Check browser dev tools for errors
```

### Debug Mode
```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
make dev-local
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `make test`
4. Lint code: `make lint`
5. Submit pull request

### Development Guidelines
- Follow Python type hints
- Add tests for new features
- Update documentation
- Keep Docker image size minimal
- Maintain free-tier compatibility

## 📋 Roadmap

### Phase 1: MVP (Current)
- [x] Knapsack portfolio optimization
- [x] Free market data integration
- [x] Paper trading simulation
- [x] Basic risk metrics
- [x] WebSocket real-time streams

### Phase 2: Enhanced Features
- [ ] Advanced risk models (Monte Carlo)
- [ ] Multi-objective optimization
- [ ] Options pricing models
- [ ] Backtesting engine
- [ ] Strategy templates

### Phase 3: Production Ready
- [ ] User authentication system
- [ ] Multi-tenant architecture
- [ ] Advanced alerting
- [ ] Performance analytics
- [ ] Mobile API optimizations

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stooq**: Free market data provider
- **QuantStart**: Data source validation
- **Fly.io**: Free-tier hosting
- **Neon.tech**: Postgres database
- **Upstash**: Redis service

---

**Built with ❤️ for the trading community**

For questions or support, create an issue or reach out to the team.

🔗 **Live Demo**: https://mkto-backend.fly.dev/docs