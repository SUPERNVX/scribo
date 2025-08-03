"""
Pytest configuration and fixtures for Scribo backend tests
"""

import pytest
import asyncio
import os
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock
import fakeredis.aioredis
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Set test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def mock_redis():
    """Mock Redis client for testing"""
    fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    return fake_redis

@pytest.fixture
def mock_database():
    """Mock database for testing"""
    db_mock = MagicMock()
    
    # Mock async methods
    db_mock.get_user_essays = AsyncMock(return_value=[])
    db_mock.find_essay = AsyncMock(return_value=None)
    db_mock.insert_essay = AsyncMock(return_value=True)
    db_mock.update_essay = AsyncMock(return_value=True)
    db_mock.delete_essay = AsyncMock(return_value=True)
    db_mock.find_user_themes = AsyncMock(return_value=[])
    db_mock.insert_custom_theme = AsyncMock(return_value=True)
    
    return db_mock

@pytest.fixture
def mock_auth_user():
    """Mock authenticated user"""
    class MockUser:
        def __init__(self):
            self.id = "test-user-123"
            self.email = "test@example.com"
            self.name = "Test User"
    
    return MockUser()

@pytest.fixture
def sample_essay_data():
    """Sample essay data for testing"""
    return {
        "id": "essay-123",
        "user_id": "test-user-123",
        "theme_id": "1",
        "theme_title": "Test Theme",
        "content": "This is a test essay content.",
        "ai_model": "deepseek",
        "created_at": "2024-01-01T00:00:00",
        "score": None,
        "feedback": None,
        "grammar_errors": []
    }

@pytest.fixture
def sample_theme_data():
    """Sample theme data for testing"""
    return {
        "id": "theme-123",
        "user_id": "test-user-123",
        "title": "Test Custom Theme",
        "description": "A test theme for unit testing",
        "keywords": ["test", "theme"],
        "created_at": "2024-01-01T00:00:00"
    }

@pytest.fixture
async def test_client():
    """Test client for FastAPI app"""
    # Import here to avoid circular imports
    from server import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_ai_service():
    """Mock AI service for testing"""
    ai_mock = MagicMock()
    ai_mock.correct_essay = AsyncMock(return_value="Mocked AI correction response")
    return ai_mock

@pytest.fixture
def mock_external_apis():
    """Mock external API responses"""
    return {
        "grammar_check": {
            "matches": [
                {
                    "message": "Test grammar error",
                    "offset": 0,
                    "length": 4,
                    "replacements": [{"value": "Test"}]
                }
            ]
        },
        "wikipedia": {
            "title": "Test Topic",
            "extract": "Test Wikipedia extract",
            "thumbnail": None
        },
        "quote": {
            "content": "Test motivational quote",
            "author": "Test Author"
        }
    }