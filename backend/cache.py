"""
Redis Cache Manager for Scribo Backend
Provides caching functionality for improved performance
"""

import json
import redis.asyncio as redis
from typing import Any, Optional, Union
import logging
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

class CacheManager:
    """Async Redis cache manager"""
    
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.redis_client: Optional[redis.Redis] = None
        self.is_connected = False
    
    async def connect(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Test connection
            await self.redis_client.ping()
            self.is_connected = True
            logger.info("Redis connection established successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            self.is_connected = False
            # Don't raise exception - allow graceful degradation
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            self.is_connected = False
            logger.info("Redis connection closed")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.is_connected or not self.redis_client:
            return None
        
        try:
            value = await self.redis_client.get(key)
            if value is None:
                return None
            
            # Try to parse as JSON, fallback to string
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
                
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {str(e)}")
            return None
    
    async def set(self, key: str, value: Any, expire: int = 300) -> bool:
        """Set value in cache with TTL"""
        if not self.is_connected or not self.redis_client:
            return False
        
        try:
            # Serialize value to JSON if it's not a string
            if isinstance(value, (dict, list, tuple)):
                value = json.dumps(value, default=str)
            elif not isinstance(value, str):
                value = str(value)
            
            await self.redis_client.setex(key, expire, value)
            return True
            
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {str(e)}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.is_connected or not self.redis_client:
            return False
        
        try:
            result = await self.redis_client.delete(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {str(e)}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.is_connected or not self.redis_client:
            return False
        
        try:
            result = await self.redis_client.exists(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {str(e)}")
            return False
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.is_connected or not self.redis_client:
            return 0
        
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                return await self.redis_client.delete(*keys)
            return 0
            
        except Exception as e:
            logger.error(f"Cache invalidate pattern error for {pattern}: {str(e)}")
            return 0
    
    async def get_stats(self) -> dict:
        """Get cache statistics"""
        if not self.is_connected or not self.redis_client:
            return {"status": "disconnected"}
        
        try:
            info = await self.redis_client.info()
            return {
                "status": "connected",
                "used_memory": info.get("used_memory_human", "N/A"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "hit_rate": self._calculate_hit_rate(
                    info.get("keyspace_hits", 0),
                    info.get("keyspace_misses", 0)
                )
            }
            
        except Exception as e:
            logger.error(f"Cache stats error: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _calculate_hit_rate(self, hits: int, misses: int) -> float:
        """Calculate cache hit rate percentage"""
        total = hits + misses
        if total == 0:
            return 0.0
        return round((hits / total) * 100, 2)

# Cache key generators
class CacheKeys:
    """Cache key generators for consistent naming"""
    
    @staticmethod
    def user_profile(user_id: str) -> str:
        return f"user:profile:{user_id}"
    
    @staticmethod
    def user_essays(user_id: str, page: int = 1, size: int = 10) -> str:
        return f"user:essays:{user_id}:page:{page}:size:{size}"
    
    @staticmethod
    def essay_detail(essay_id: str) -> str:
        return f"essay:detail:{essay_id}"
    
    @staticmethod
    def essay_correction(essay_id: str, model: str) -> str:
        return f"essay:correction:{essay_id}:{model}"
    
    @staticmethod
    def themes_list() -> str:
        return "themes:list"
    
    @staticmethod
    def user_themes(user_id: str) -> str:
        return f"user:themes:{user_id}"
    
    @staticmethod
    def ai_result(content_hash: str, model: str) -> str:
        return f"ai:result:{model}:{content_hash}"
    
    @staticmethod
    def user_session(session_token: str) -> str:
        return f"session:{session_token}"

# Global cache instance
cache_manager = CacheManager()

# Cache decorators
def cache_result(key_func, expire: int = 300):
    """Decorator to cache function results"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = key_func(*args, **kwargs)
            
            # Try to get from cache
            cached_result = await cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for key: {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            if result is not None:
                await cache_manager.set(cache_key, result, expire)
                logger.debug(f"Cache set for key: {cache_key}")
            
            return result
        return wrapper
    return decorator