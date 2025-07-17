# Makefile for MKTO Backend

.PHONY: help dev build test lint format clean install deps docker-build docker-run

# Default target
help:
	@echo "MKTO Backend Development Commands"
	@echo "================================="
	@echo "dev          Start development environment with Docker Compose"
	@echo "dev-new      Start on new ports (Backend: 8001, Frontend: 3001)"
	@echo "build        Build the Docker image"
	@echo "test         Run tests"
	@echo "lint         Run linting (ruff + mypy)"
	@echo "format       Format code (black + ruff)"
	@echo "clean        Clean up containers and volumes"
	@echo "install      Install Python dependencies"
	@echo "deps         Update dependencies"
	@echo "docker-build Build Docker image"
	@echo "docker-run   Run Docker container"
	@echo "deploy       Deploy to Fly.io"

# Development environment with new ports
dev-new:
	@echo "Starting MKTO on new ports..."
	@echo "Backend: http://localhost:8001"
	@echo "Frontend: http://localhost:3001"
	./start-new-ports.sh

# Development environment
dev:
	@echo "Starting MKTO development environment..."
	docker-compose up --build

# Build Docker image
build:
	docker build -t mkto-backend .

# Run tests
test:
	@echo "Running tests..."
	python -m pytest -v --cov=app --cov-report=html --cov-report=term

# Linting
lint:
	@echo "Running linting..."
	ruff check app/
	mypy app/

# Format code
format:
	@echo "Formatting code..."
	black app/
	ruff --fix app/

# Clean up
clean:
	@echo "Cleaning up..."
	docker-compose down -v
	docker system prune -f

# Install dependencies
install:
	pip install -r requirements.txt

# Update dependencies
deps:
	pip freeze > requirements.txt

# Docker build
docker-build:
	docker build -t mkto-backend:latest .

# Docker run
docker-run:
	docker run -p 8000:8000 \
		-e DATABASE_URL=postgresql://user:pass@host:5432/mkto \
		-e REDIS_URL=redis://host:6379/0 \
		mkto-backend:latest

# Deploy to Fly.io
deploy:
	@echo "Deploying to Fly.io..."
	flyctl deploy

# Run development server locally
dev-local:
	@echo "Starting local development server..."
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run migrations (Alembic)
migrate:
	@echo "Running database migrations..."
	alembic upgrade head

# Generate new migration
migration:
	@echo "Generating new migration..."
	alembic revision --autogenerate -m "$(name)"

# Seed database with test data
seed:
	@echo "Seeding database with test data..."
	python -c "import asyncio; from app.scripts.seed_db import seed_database; asyncio.run(seed_database())"

# Generate API documentation
docs:
	@echo "Generating API documentation..."
	python -c "import json; from app.main import app; print(json.dumps(app.openapi(), indent=2))" > docs/openapi.json

# Security scan
security:
	@echo "Running security scan..."
	bandit -r app/
	safety check

# Performance test
perf:
	@echo "Running performance tests..."
	locust -f tests/performance/locustfile.py --host=http://localhost:8000

# Backup database
backup:
	@echo "Creating database backup..."
	pg_dump $(DATABASE_URL) > backups/mkto_$(shell date +%Y%m%d_%H%M%S).sql

# Monitor logs
logs:
	docker-compose logs -f app

# Check health
health:
	curl -f http://localhost:8000/health || echo "Service is down"

# Generate test coverage report
coverage:
	pytest --cov=app --cov-report=html
	open htmlcov/index.html

# Load test data from external APIs
load-data:
	@echo "Loading market data..."
	python -c "import asyncio; from app.scripts.load_market_data import load_data; asyncio.run(load_data())"
