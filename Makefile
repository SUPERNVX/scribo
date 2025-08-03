# Scribo Development Makefile

.PHONY: help setup start stop test clean lint format docker-build docker-up docker-down

# Default target
help:
	@echo "Scribo Development Commands:"
	@echo "  setup       - Set up development environment"
	@echo "  start       - Start development server"
	@echo "  stop        - Stop all services"
	@echo "  test        - Run tests"
	@echo "  lint        - Run linting checks"
	@echo "  format      - Format code"
	@echo "  clean       - Clean up temporary files"
	@echo "  docker-up   - Start Docker services"
	@echo "  docker-down - Stop Docker services"
	@echo "  docker-build- Build Docker images"

# Development setup
setup:
	@echo "Setting up development environment..."
	cd backend && python dev-setup.py

# Start development server
start:
	@echo "Starting development server..."
	cd backend && uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Stop services
stop:
	@echo "Stopping services..."
	docker-compose down

# Run tests
test:
	@echo "Running tests..."
	cd backend && python -m pytest tests/ -v --cov=. --cov-report=term-missing

# Run linting
lint:
	@echo "Running linting checks..."
	cd backend && flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	cd backend && flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
	cd backend && mypy . --ignore-missing-imports || true

# Format code
format:
	@echo "Formatting code..."
	cd backend && black .
	cd backend && isort .

# Clean temporary files
clean:
	@echo "Cleaning temporary files..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type f -name ".coverage" -delete
	find . -type d -name "htmlcov" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +

# Docker commands
docker-up:
	@echo "Starting Docker services..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down

docker-build:
	@echo "Building Docker images..."
	docker-compose build

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd backend && pip install -r requirements.txt
	cd backend && pip install -r test_requirements.txt

# Database commands
db-init:
	@echo "Initializing database..."
	docker-compose exec postgres psql -U scribo_user -d scribo_dev -f /docker-entrypoint-initdb.d/init.sql

db-reset:
	@echo "Resetting database..."
	docker-compose down -v
	docker-compose up -d postgres
	sleep 5
	make db-init

# Development workflow
dev: docker-up
	@echo "Waiting for services to start..."
	sleep 10
	make start

# Full setup and test
full-setup: setup docker-up test
	@echo "Full setup completed successfully!"