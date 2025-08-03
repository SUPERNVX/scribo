"""
Tests for cache functionality
"""

import pytest
import json
from unittest.mock import AsyncMock, patch
from cache import CacheManager, CacheKeys

class TestCacheManager:
    """Test CacheManager functionality"""
    
    @pytest.fixture
    def cache_manager(self, mock_redis):
        """Create cache manager with mock Redis"""
        manager = CacheManager()
        manager.redis_client = mock_redis
        manager.is_connected = True
        return manager
    
    @pytest.mark.asyncio
    async def test_cache_set_and_get_string(self, cache_manager):
        """Test setting and getting string values"""
        key = "test:string"
        value = "test_value"
        
        # Set value
        result = await cache_manager.set(key, value, expire=300)
        assert result is True
        
        # Get value
        retrieved = await cache_manager.get(key)
        assert retrieved == value
    
    @pytest.mark.asyncio
    async def test_cache_set_and_get_dict(self, cache_manager):
        """Test setting and getting dictionary values"""
        key = "test:dict"
        value = {"name": "test", "count": 42}
        
        # Set value
        result = await cache_manager.set(key, value, expire=300)
        assert result is True
        
        # Get value
        retrieved = await cache_manager.get(key)
        assert retrieved == value
    
    @pytest.mark.asyncio
    async def test_cache_set_and_get_list(self, cache_manager):
        """Test setting and getting list values"""
        key = "test:list"
        value = [1, 2, 3, "test"]
        
        # Set value
        result = await cache_manager.set(key, value, expire=300)
        assert result is True
        
        # Get value
        retrieved = await cache_manager.get(key)
        assert retrieved == value
    
    @pytest.mark.asyncio
    async def test_cache_get_nonexistent(self, cache_manager):
        """Test getting non-existent key"""
        result = await cache_manager.get("nonexistent:key")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_delete(self, cache_manager):
        """Test deleting cache keys"""
        key = "test:delete"
        value = "to_be_deleted"
        
        # Set value
        await cache_manager.set(key, value)
        
        # Verify it exists
        retrieved = await cache_manager.get(key)
        assert retrieved == value
        
        # Delete it
        result = await cache_manager.delete(key)
        assert result is True
        
        # Verify it's gone
        retrieved = await cache_manager.get(key)
        assert retrieved is None
    
    @pytest.mark.asyncio
    async def test_cache_exists(self, cache_manager):
        """Test checking if key exists"""
        key = "test:exists"
        
        # Should not exist initially
        exists = await cache_manager.exists(key)
        assert exists is False
        
        # Set value
        await cache_manager.set(key, "test_value")
        
        # Should exist now
        exists = await cache_manager.exists(key)
        assert exists is True
    
    @pytest.mark.asyncio
    async def test_cache_disconnected_graceful_degradation(self):
        """Test graceful degradation when Redis is disconnected"""
        manager = CacheManager()
        manager.is_connected = False
        manager.redis_client = None
        
        # All operations should return safe defaults
        assert await manager.get("test") is None
        assert await manager.set("test", "value") is False
        assert await manager.delete("test") is False
        assert await manager.exists("test") is False
        assert await manager.invalidate_pattern("test:*") == 0

class TestCacheKeys:
    """Test cache key generators"""
    
    def test_user_profile_key(self):
        """Test user profile cache key generation"""
        user_id = "user-123"
        expected = "user:profile:user-123"
        assert CacheKeys.user_profile(user_id) == expected
    
    def test_user_essays_key(self):
        """Test user essays cache key generation"""
        user_id = "user-123"
        page = 2
        expected = "user:essays:user-123:page:2"
        assert CacheKeys.user_essays(user_id, page) == expected
    
    def test_essay_detail_key(self):
        """Test essay detail cache key generation"""
        essay_id = "essay-456"
        expected = "essay:detail:essay-456"
        assert CacheKeys.essay_detail(essay_id) == expected
    
    def test_essay_correction_key(self):
        """Test essay correction cache key generation"""
        essay_id = "essay-456"
        model = "deepseek"
        expected = "essay:correction:essay-456:deepseek"
        assert CacheKeys.essay_correction(essay_id, model) == expected
    
    def test_themes_list_key(self):
        """Test themes list cache key generation"""
        expected = "themes:list"
        assert CacheKeys.themes_list() == expected
    
    def test_user_themes_key(self):
        """Test user themes cache key generation"""
        user_id = "user-123"
        expected = "user:themes:user-123"
        assert CacheKeys.user_themes(user_id) == expected
    
    def test_ai_result_key(self):
        """Test AI result cache key generation"""
        content_hash = "abc123"
        model = "deepseek"
        expected = "ai:result:deepseek:abc123"
        assert CacheKeys.ai_result(content_hash, model) == expected
    
    def test_user_session_key(self):
        """Test user session cache key generation"""
        session_token = "token-xyz"
        expected = "session:token-xyz"
        assert CacheKeys.user_session(session_token) == expected