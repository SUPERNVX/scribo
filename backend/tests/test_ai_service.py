"""
Tests for AI Service with Rate Limiting and Optimization
"""

import asyncio
import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from ai_service import (
    AIService, 
    AIServiceConfig, 
    RateLimiter, 
    RateLimitConfig,
    RetryConfig,
    AIServiceError,
    RateLimitExceededError,
    AIServiceUnavailableError,
    AIModel
)

@pytest.fixture
def rate_limit_config():
    """Rate limit configuration for testing"""
    return RateLimitConfig(
        requests_per_minute=2,  # Allow 2 requests for easier testing
        burst_limit=2,
        window_size=60
    )

@pytest.fixture
def retry_config():
    """Retry configuration for testing"""
    return RetryConfig(
        max_retries=2,
        base_delay=0.1,  # Shorter delays for testing
        max_delay=1.0,
        exponential_base=2.0
    )

@pytest.fixture
def ai_service_config(rate_limit_config, retry_config):
    """AI service configuration for testing"""
    return AIServiceConfig(
        rate_limit=rate_limit_config,
        retry=retry_config,
        cache_ttl=300,
        fallback_enabled=True
    )

@pytest.fixture
def rate_limiter(rate_limit_config):
    """Rate limiter instance for testing"""
    return RateLimiter(rate_limit_config)

@pytest.fixture
def ai_service(ai_service_config):
    """AI service instance for testing"""
    return AIService(ai_service_config)

class TestRateLimiter:
    """Test rate limiting functionality"""
    
    @pytest.mark.asyncio
    async def test_rate_limiter_allows_requests_within_limit(self, rate_limiter):
        """Test that requests within limit are allowed"""
        user_id = "test_user"
        
        # First request should be allowed
        is_allowed, wait_time = await rate_limiter.is_allowed(user_id)
        assert is_allowed is True
        assert wait_time is None
        
        # Second request should be allowed (limit is 2)
        is_allowed, wait_time = await rate_limiter.is_allowed(user_id)
        assert is_allowed is True
        assert wait_time is None
    
    @pytest.mark.asyncio
    async def test_rate_limiter_blocks_requests_over_limit(self, rate_limiter):
        """Test that requests over limit are blocked"""
        user_id = "test_user"
        
        # Use up the limit (2 requests)
        await rate_limiter.is_allowed(user_id)
        await rate_limiter.is_allowed(user_id)
        
        # Third request should be blocked
        is_allowed, wait_time = await rate_limiter.is_allowed(user_id)
        assert is_allowed is False
        assert wait_time is not None
        assert wait_time > 0
    
    @pytest.mark.asyncio
    async def test_rate_limiter_different_users_independent(self, rate_limiter):
        """Test that different users have independent rate limits"""
        user1 = "user1"
        user2 = "user2"
        
        # Use up limit for user1
        await rate_limiter.is_allowed(user1)
        await rate_limiter.is_allowed(user1)
        
        # user1 should be blocked
        is_allowed, _ = await rate_limiter.is_allowed(user1)
        assert is_allowed is False
        
        # user2 should still be allowed
        is_allowed, _ = await rate_limiter.is_allowed(user2)
        assert is_allowed is True
    
    @pytest.mark.asyncio
    async def test_rate_limiter_status(self, rate_limiter):
        """Test rate limiter status reporting"""
        user_id = "test_user"
        
        # Initial status
        status = await rate_limiter.get_user_status(user_id)
        assert status["requests_made"] == 0
        assert status["requests_remaining"] == 2
        assert status["reset_time"] is None
        
        # After one request
        await rate_limiter.is_allowed(user_id)
        status = await rate_limiter.get_user_status(user_id)
        assert status["requests_made"] == 1
        assert status["requests_remaining"] == 1
        
        # After hitting limit
        await rate_limiter.is_allowed(user_id)
        status = await rate_limiter.get_user_status(user_id)
        assert status["requests_made"] == 2
        assert status["requests_remaining"] == 0
        assert status["reset_time"] is not None

class TestAIService:
    """Test AI service functionality"""
    
    @pytest.mark.asyncio
    async def test_ai_service_initialization(self, ai_service):
        """Test AI service initializes correctly"""
        assert ai_service.config is not None
        assert ai_service.rate_limiter is not None
        assert len(ai_service.ai_models) == 4  # Updated to include llama33
        assert AIModel.DEEPSEEK.value in ai_service.ai_models
        assert AIModel.LLAMA.value in ai_service.ai_models
        assert AIModel.GPT4O.value in ai_service.ai_models
        assert "llama33" in ai_service.ai_models  # New model for paragraph analysis
    
    @pytest.mark.asyncio
    async def test_cache_key_generation(self, ai_service):
        """Test cache key generation"""
        content = "Test essay content"
        theme = "Test theme"
        model = "deepseek"
        
        key1 = ai_service._generate_cache_key(content, theme, model, "full")
        key2 = ai_service._generate_cache_key(content, theme, model, "full")
        key3 = ai_service._generate_cache_key(content, theme, model, "paragraph")
        
        # Same inputs should generate same key
        assert key1 == key2
        
        # Different analysis type should generate different key
        assert key1 != key3
    
    @pytest.mark.asyncio
    async def test_optimized_prompt_generation(self, ai_service):
        """Test optimized prompt generation"""
        content = "Test essay content"
        theme = "Test theme"
        
        # Full analysis prompt
        full_prompt = ai_service._get_optimized_prompt(content, theme, "full")
        assert "COMPETÊNCIA 1" in full_prompt
        assert "COMPETÊNCIA 5" in full_prompt
        assert theme in full_prompt
        assert content in full_prompt
        
        # Paragraph analysis prompt (should be shorter)
        paragraph_prompt = ai_service._get_optimized_prompt(content, theme, "paragraph")
        assert len(paragraph_prompt) < len(full_prompt)
        assert theme in paragraph_prompt
        assert content in paragraph_prompt
    
    @pytest.mark.asyncio
    async def test_score_extraction_full_analysis(self, ai_service):
        """Test score extraction from full analysis feedback"""
        feedback_with_score = """
        COMPETÊNCIA 1: 160/200
        COMPETÊNCIA 2: 180/200
        COMPETÊNCIA 3: 140/200
        COMPETÊNCIA 4: 160/200
        COMPETÊNCIA 5: 120/200
        
        NOTA FINAL: 760/1000
        """
        
        score = ai_service._extract_score(feedback_with_score, "full")
        assert score == 760.0
    
    @pytest.mark.asyncio
    async def test_score_extraction_paragraph_analysis(self, ai_service):
        """Test score extraction from paragraph analysis feedback"""
        feedback_with_score = """
        Análise do parágrafo:
        NOTA: 120/160
        Feedback detalhado...
        """
        
        score = ai_service._extract_score(feedback_with_score, "paragraph")
        # Should convert 120/160 to 1000 scale: (120/160) * 1000 = 750
        assert score == 750.0
    
    @pytest.mark.asyncio
    async def test_score_extraction_no_score(self, ai_service):
        """Test score extraction when no score is found"""
        feedback_without_score = "This is feedback without any score"
        
        score = ai_service._extract_score(feedback_without_score, "full")
        assert score is None
    
    @pytest.mark.asyncio
    async def test_input_validation(self, ai_service):
        """Test input validation"""
        user_id = "test_user"
        theme = "Test theme"
        
        # Empty content should raise error
        with pytest.raises(AIServiceError, match="cannot be empty"):
            await ai_service.correct_essay("", theme, user_id=user_id)
        
        # Content too long should raise error
        long_content = "x" * 10001
        with pytest.raises(AIServiceError, match="too long"):
            await ai_service.correct_essay(long_content, theme, user_id=user_id)
    
    @pytest.mark.asyncio
    async def test_rate_limiting_integration(self, ai_service):
        """Test rate limiting integration with AI service"""
        user_id = "test_user"
        content = "Test essay content for rate limiting"
        theme = "Test theme"
        
        # Mock the AI call to avoid actual API calls
        with patch.object(ai_service, '_call_ai_model', new_callable=AsyncMock) as mock_ai:
            mock_ai.return_value = "NOTA FINAL: 800/1000\nFeedback here"
            
            # Mock cache to avoid caching
            with patch.object(ai_service, '_check_cache', new_callable=AsyncMock) as mock_cache:
                mock_cache.return_value = None
                
                # First two requests should succeed (limit is 2)
                result1 = await ai_service.correct_essay(content, theme, user_id=user_id)
                assert result1["is_fallback"] is False
                
                result2 = await ai_service.correct_essay(content + "2", theme, user_id=user_id)
                assert result2["is_fallback"] is False
                
                # Third request should be rate limited
                with pytest.raises(RateLimitExceededError):
                    await ai_service.correct_essay(content + "3", theme, user_id=user_id)
    
    @pytest.mark.asyncio
    async def test_cache_hit(self, ai_service):
        """Test cache hit scenario"""
        user_id = "test_user"
        content = "Test essay content"
        theme = "Test theme"
        
        cached_result = {
            "feedback": "Cached feedback",
            "score": 750.0,
            "model": "deepseek",
            "is_fallback": False
        }
        
        with patch.object(ai_service, '_check_cache', new_callable=AsyncMock) as mock_cache:
            mock_cache.return_value = cached_result
            
            result = await ai_service.correct_essay(content, theme, user_id=user_id)
            assert result == cached_result
            mock_cache.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_retry_mechanism(self, ai_service):
        """Test retry mechanism with exponential backoff"""
        user_id = "test_user"
        content = "Test essay content"
        theme = "Test theme"
        
        # Mock cache miss
        with patch.object(ai_service, '_check_cache', new_callable=AsyncMock) as mock_cache:
            mock_cache.return_value = None
            
            # Mock AI call to fail twice then succeed
            with patch.object(ai_service, '_call_ai_model', new_callable=AsyncMock) as mock_ai:
                mock_ai.side_effect = [
                    Exception("First failure"),
                    Exception("Second failure"),
                    "NOTA FINAL: 800/1000\nSuccess feedback"
                ]
                
                result = await ai_service.correct_essay(content, theme, user_id=user_id)
                
                # Should have retried 3 times total (initial + 2 retries)
                assert mock_ai.call_count == 3
                assert result["feedback"] == "NOTA FINAL: 800/1000\nSuccess feedback"
                assert result["score"] == 800.0
    
    @pytest.mark.asyncio
    async def test_fallback_model(self, ai_service):
        """Test fallback to different model when primary fails"""
        user_id = "test_user"
        content = "Test essay content"
        theme = "Test theme"
        primary_model = "deepseek"
        
        with patch.object(ai_service, '_check_cache', new_callable=AsyncMock) as mock_cache:
            mock_cache.return_value = None
            
            with patch.object(ai_service, '_call_ai_model', new_callable=AsyncMock) as mock_ai:
                # Primary model fails, fallback succeeds
                def side_effect(model_key, prompt):
                    if model_key == primary_model:
                        raise AIServiceUnavailableError(f"Model {model_key} unavailable")
                    else:
                        return "NOTA FINAL: 750/1000\nFallback feedback"
                
                mock_ai.side_effect = side_effect
                
                result = await ai_service.correct_essay(
                    content, theme, model_key=primary_model, user_id=user_id
                )
                
                assert result["is_fallback"] is True
                assert result["model"] != primary_model
                assert result["score"] == 750.0
    
    @pytest.mark.asyncio
    async def test_fallback_response_when_all_models_fail(self, ai_service):
        """Test fallback response when all AI models fail"""
        user_id = "test_user"
        content = "Test essay content"
        theme = "Test theme"
        
        with patch.object(ai_service, '_check_cache', new_callable=AsyncMock) as mock_cache:
            mock_cache.return_value = None
            
            with patch.object(ai_service, '_call_ai_model', new_callable=AsyncMock) as mock_ai:
                mock_ai.side_effect = AIServiceUnavailableError("All models unavailable")
                
                result = await ai_service.correct_essay(content, theme, user_id=user_id)
                
                assert result["is_fallback"] is True
                assert result["score"] is None
                assert "SERVIÇO TEMPORARIAMENTE INDISPONÍVEL" in result["feedback"]
    
    @pytest.mark.asyncio
    async def test_service_health_check(self, ai_service):
        """Test service health check"""
        health = await ai_service.get_service_health()
        
        assert "status" in health
        assert "models" in health
        assert "cache_connected" in health
        assert "rate_limiting" in health
        
        # Check model information
        for model_key in [AIModel.DEEPSEEK.value, AIModel.LLAMA.value, AIModel.GPT4O.value]:
            assert model_key in health["models"]
            assert "name" in health["models"][model_key]
            assert "available" in health["models"][model_key]
    
    @pytest.mark.asyncio
    async def test_model_availability_reset(self, ai_service):
        """Test that model availability is reset after failure"""
        model_key = "deepseek"
        
        # Mark model as unavailable
        ai_service.ai_models[model_key]["available"] = False
        
        # Reset availability (with very short delay for testing)
        await ai_service._reset_model_availability(model_key, 0.1)
        
        # Model should be available again
        assert ai_service.ai_models[model_key]["available"] is True

class TestIntegration:
    """Integration tests for AI service"""
    
    @pytest.mark.asyncio
    async def test_paragraph_vs_full_analysis(self, ai_service):
        """Test that paragraph and full analysis produce different results"""
        user_id = "test_user"
        content = "Test essay content"
        theme = "Test theme"
        
        with patch.object(ai_service, '_call_ai_model', new_callable=AsyncMock) as mock_ai:
            mock_ai.return_value = "NOTA: 120/160\nParagraph feedback"
            
            with patch.object(ai_service, '_check_cache', new_callable=AsyncMock) as mock_cache:
                mock_cache.return_value = None
                
                # Test paragraph analysis
                paragraph_result = await ai_service.correct_essay(
                    content, theme, user_id=user_id, analysis_type="paragraph"
                )
                
                # Test full analysis
                mock_ai.return_value = "NOTA FINAL: 800/1000\nFull feedback"
                full_result = await ai_service.correct_essay(
                    content + "different", theme, user_id=user_id + "2", analysis_type="full"
                )
                
                # Should have different prompts and results
                assert paragraph_result["analysis_type"] == "paragraph"
                assert full_result["analysis_type"] == "full"
                
                # Verify different prompts were used
                calls = mock_ai.call_args_list
                paragraph_prompt = calls[0][0][1]  # Second argument is prompt
                full_prompt = calls[1][0][1]
                
                assert len(paragraph_prompt) < len(full_prompt)
                assert "COMPETÊNCIA 1" not in paragraph_prompt
                assert "COMPETÊNCIA 1" in full_prompt