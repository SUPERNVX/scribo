"""
AI Service with Rate Limiting and Optimization
Implements intelligent rate limiting, caching, fallbacks, and retry mechanisms for AI APIs
"""

import asyncio
import hashlib
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from dataclasses import dataclass, field
from enum import Enum

import httpx
from openai import OpenAI
from fastapi import HTTPException

from cache import cache_manager, CacheKeys
from system_prompts import system_prompts_manager

logger = logging.getLogger(__name__)

class AIModel(Enum):
    """Available AI models"""
    DEEPSEEK = "deepseek"
    LLAMA = "llama"
    # GPT4O removed due to low API request limits

@dataclass
class RateLimitConfig:
    """Rate limiting configuration"""
    requests_per_minute: int = 1  # One request per minute regardless of analysis type
    burst_limit: int = 1  # No burst allowed
    window_size: int = 60  # 60 seconds window

@dataclass
class RetryConfig:
    """Retry configuration with exponential backoff"""
    max_retries: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0

@dataclass
class AIServiceConfig:
    """AI Service configuration"""
    rate_limit: RateLimitConfig = field(default_factory=RateLimitConfig)
    retry: RetryConfig = field(default_factory=RetryConfig)
    cache_ttl: int = 86400  # 24 hours for AI results
    fallback_enabled: bool = True

class RateLimiter:
    """Intelligent rate limiter for AI APIs"""
    
    def __init__(self, config: RateLimitConfig):
        self.config = config
        self.requests: Dict[str, list] = {}  # user_id -> list of timestamps
        self.lock = asyncio.Lock()
    
    async def is_allowed(self, user_id: str) -> tuple[bool, Optional[float]]:
        """
        Check if request is allowed for user
        Returns (is_allowed, wait_time_seconds)
        """
        async with self.lock:
            now = time.time()
            window_start = now - self.config.window_size
            
            # Initialize user requests if not exists
            if user_id not in self.requests:
                self.requests[user_id] = []
            
            # Clean old requests outside window
            self.requests[user_id] = [
                req_time for req_time in self.requests[user_id] 
                if req_time > window_start
            ]
            
            # Check if under limit
            if len(self.requests[user_id]) < self.config.requests_per_minute:
                self.requests[user_id].append(now)
                return True, None
            
            # Calculate wait time until oldest request expires
            oldest_request = min(self.requests[user_id])
            wait_time = oldest_request + self.config.window_size - now
            
            return False, max(0, wait_time)
    
    async def get_user_status(self, user_id: str) -> Dict[str, Any]:
        """Get rate limit status for user"""
        async with self.lock:
            now = time.time()
            window_start = now - self.config.window_size
            
            if user_id not in self.requests:
                return {
                    "requests_made": 0,
                    "requests_remaining": self.config.requests_per_minute,
                    "reset_time": None
                }
            
            # Clean old requests
            valid_requests = [
                req_time for req_time in self.requests[user_id] 
                if req_time > window_start
            ]
            
            requests_made = len(valid_requests)
            requests_remaining = max(0, self.config.requests_per_minute - requests_made)
            
            reset_time = None
            if valid_requests and requests_remaining == 0:
                oldest_request = min(valid_requests)
                reset_time = oldest_request + self.config.window_size
            
            return {
                "requests_made": requests_made,
                "requests_remaining": requests_remaining,
                "reset_time": reset_time,
                "window_size": self.config.window_size
            }

class AIServiceError(Exception):
    """Base exception for AI service errors"""
    pass

class RateLimitExceededError(AIServiceError):
    """Raised when rate limit is exceeded"""
    def __init__(self, wait_time: float):
        self.wait_time = wait_time
        super().__init__(f"Rate limit exceeded. Try again in {wait_time:.1f} seconds")

class AIServiceUnavailableError(AIServiceError):
    """Raised when AI service is unavailable"""
    pass

class AIService:
    """
    Optimized AI Service with rate limiting, caching, fallbacks, and retry mechanisms
    """
    
    def __init__(self, config: AIServiceConfig = None):
        self.config = config or AIServiceConfig()
        self.rate_limiter = RateLimiter(self.config.rate_limit)
        
        # Import AI Models from config file to avoid circular imports
        from ai_models_config import AI_MODELS
        
        # Convert server AI_MODELS to ai_service format
        self.ai_models = {}
        for key, config in AI_MODELS.items():
            self.ai_models[key] = {
                "name": config["name"],
                "client": config["client"],
                "model": config["model"],
                "available": True,
                "usage": config.get("usage", "general"),
                "temperature": config.get("temperature", 0.6),
                "top_p": config.get("top_p", 0.7),
                "max_tokens": config.get("max_tokens", 4096),
                "system_message": config.get("system_message"),
                "extra_body": config.get("extra_body")
            }
    
    def _generate_cache_key(self, content: str, theme: str, model: str, analysis_type: str = "full") -> str:
        """Generate cache key for AI results"""
        content_hash = hashlib.md5(f"{content}{theme}{analysis_type}".encode()).hexdigest()
        return CacheKeys.ai_result(content_hash, model)
    
    async def _check_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Check cache for existing AI result"""
        try:
            cached_result = await cache_manager.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for AI result: {cache_key}")
                return cached_result
        except Exception as e:
            logger.error(f"Cache check error: {str(e)}")
        return None
    
    async def _cache_result(self, cache_key: str, result: Dict[str, Any]) -> None:
        """Cache AI result"""
        try:
            await cache_manager.set(cache_key, result, expire=self.config.cache_ttl)
            logger.info(f"Cached AI result: {cache_key}")
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
    
    async def _retry_with_backoff(self, func, *args, **kwargs):
        """Execute function with exponential backoff retry"""
        last_exception = None
        
        for attempt in range(self.config.retry.max_retries + 1):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                
                if attempt == self.config.retry.max_retries:
                    break
                
                # Calculate delay with exponential backoff
                delay = min(
                    self.config.retry.base_delay * (self.config.retry.exponential_base ** attempt),
                    self.config.retry.max_delay
                )
                
                logger.warning(f"AI request failed (attempt {attempt + 1}), retrying in {delay}s: {str(e)}")
                await asyncio.sleep(delay)
        
        raise last_exception
    
    def _get_optimized_prompt(self, content: str, theme: str, analysis_type: str = "full", theme_data: dict = None, metadata: dict = None) -> str:
        """
        Generate optimized prompt using personalized system prompts by university
        """
        try:
            # Detectar faculdade baseada nos dados do tema
            if theme_data:
                print(f"[DEBUG] Theme data recebido: {theme_data}")
                faculdade = system_prompts_manager.detect_faculdade_from_theme(theme_data)
            else:
                # Fallback: tentar detectar pela string do tema
                print(f"[DEBUG] Sem theme_data, usando string do tema: {theme}")
                faculdade = system_prompts_manager.detect_faculdade_from_theme(theme)
            
            # Obter prompt personalizado com metadados
            personalized_prompt = system_prompts_manager.get_prompt(
                faculdade=faculdade,
                analysis_type=analysis_type,
                content=content,
                theme=theme,
                metadata=metadata
            )
            
            logger.info(f"Using personalized prompt for {faculdade}/{analysis_type}")
            return personalized_prompt
            
        except Exception as e:
            logger.error(f"Error getting personalized prompt: {e}")
            # Fallback para prompt padrão ENEM
            return self._get_fallback_prompt(content, theme, analysis_type)
    
    def _get_fallback_prompt(self, content: str, theme: str, analysis_type: str = "full") -> str:
        """
        Fallback prompt when personalized prompts fail
        """
        if analysis_type == "paragraph":
            return f"""Analise este parágrafo de redação sobre "{theme}":

{content}

Avalie considerando:
1. **Adequação ao tema** - Desenvolve o tema proposto?
2. **Argumentação** - Argumentos consistentes e fundamentados?
3. **Coesão** - Unidade e conectivos adequados?
4. **Linguagem** - Norma culta e vocabulário adequado?

**FORMATO DE RESPOSTA:**
**AVALIAÇÃO GERAL:** [Insuficiente/Regular/Bom/Muito Bom/Excelente]
**PONTOS FORTES:** [2-3 aspectos positivos]
**PONTOS A MELHORAR:** [2-3 sugestões específicas]
**FEEDBACK:** [análise objetiva em até 200 palavras]"""
        
        return f"""Analise esta redação sobre "{theme}":

{content}

Forneça:
1. **Nota geral** (0-1000)
2. **Pontos fortes** (2-3 aspectos)
3. **Pontos a melhorar** (2-3 sugestões)
4. **Comentário geral** (até 150 palavras)"""
    
    async def _call_ai_model(self, model_key: str, prompt: str, analysis_type: str = "full", user_id: str = None) -> str:
        """Call AI model with error handling and usage tracking"""
        if model_key not in self.ai_models:
            raise AIServiceError(f"Model {model_key} not available")
        
        model_config = self.ai_models[model_key]
        
        if not model_config.get("available", True):
            raise AIServiceUnavailableError(f"Model {model_key} is currently unavailable")
        
        start_time = time.time()
        success = False
        error_message = None
        
        try:
            client = model_config["client"]
            
            # Use model-specific configurations from the new setup
            messages = [{"role": "user", "content": prompt}]
            
            # Add system message if specified
            if model_config.get("system_message"):
                messages.insert(0, {"role": "system", "content": model_config["system_message"]})
            
            # Prepare completion parameters
            completion_params = {
                "model": model_config["model"],
                "messages": messages,
                "temperature": model_config.get("temperature", 0.6),
                "top_p": model_config.get("top_p", 0.7),
                "max_tokens": model_config.get("max_tokens", 4096),
                "timeout": 120.0 if model_config.get("usage") == "full_analysis" else 90.0
            }
            
            # Add extra_body if specified (for Qwen3)
            if model_config.get("extra_body"):
                completion_params["extra_body"] = model_config["extra_body"]
            
            completion = client.chat.completions.create(**completion_params)
            
            response_time = time.time() - start_time
            success = True
            
            # Log successful API usage
            if user_id:
                try:
                    from database_adapter import db_adapter
                    await db_adapter.log_api_usage(
                        model_name=model_key,
                        user_id=user_id,
                        request_type=analysis_type,
                        response_time=response_time,
                        success=True
                    )
                except Exception as log_error:
                    logger.warning(f"Failed to log API usage: {log_error}")
            
            return completion.choices[0].message.content
            
        except Exception as e:
            response_time = time.time() - start_time
            error_message = str(e)
            
            # Log failed API usage
            if user_id:
                try:
                    from database_adapter import db_adapter
                    await db_adapter.log_api_usage(
                        model_name=model_key,
                        user_id=user_id,
                        request_type=analysis_type,
                        response_time=response_time,
                        success=False,
                        error_message=error_message
                    )
                except Exception as log_error:
                    logger.warning(f"Failed to log API usage: {log_error}")
            
            logger.error(f"AI model {model_key} error: {str(e)}")
            # Mark model as temporarily unavailable
            model_config["available"] = False
            # Reset availability after 5 minutes
            asyncio.create_task(self._reset_model_availability(model_key, 300))
            raise AIServiceUnavailableError(f"Model {model_key} temporarily unavailable: {str(e)}")
    
    async def _reset_model_availability(self, model_key: str, delay: int):
        """Reset model availability after delay"""
        await asyncio.sleep(delay)
        if model_key in self.ai_models:
            self.ai_models[model_key]["available"] = True
            logger.info(f"Model {model_key} marked as available again")
    
    async def _get_fallback_response(self, theme: str, analysis_type: str = "full") -> Dict[str, Any]:
        """Generate fallback response when AI services are unavailable"""
        if not self.config.fallback_enabled:
            raise AIServiceUnavailableError("AI services unavailable and fallback disabled")
        
        logger.warning("Using fallback response for AI analysis")
        
        if analysis_type == "paragraph":
            return {
                "feedback": f"""**ANÁLISE INDISPONÍVEL**

O serviço de correção está temporariamente indisponível. 

**DICAS GERAIS PARA O TEMA "{theme}":**
- Desenvolva uma tese clara na introdução
- Use argumentos consistentes e bem fundamentados
- Conecte ideias com conectivos apropriados
- Proponha intervenção específica e detalhada
- Revise gramática e ortografia

**NOTA:** Análise não disponível
**STATUS:** Tente novamente em alguns minutos""",
                "score": None,
                "is_fallback": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        return {
            "feedback": f"""**SERVIÇO TEMPORARIAMENTE INDISPONÍVEL**

A correção automática está em manutenção. Aqui estão dicas gerais para o tema "{theme}":

**ESTRUTURA RECOMENDADA:**
1. **Introdução:** Contextualize o tema e apresente sua tese
2. **Desenvolvimento:** 2 parágrafos com argumentos distintos e bem fundamentados
3. **Conclusão:** Retome a tese e proponha intervenção detalhada

**CRITÉRIOS ENEM:**
- **Norma Culta:** Revise gramática, ortografia e concordância
- **Tema:** Mantenha-se dentro do tema proposto
- **Argumentação:** Use dados, exemplos e referências
- **Coesão:** Conecte ideias com conectivos adequados
- **Proposta:** Seja específico (agente, ação, meio, finalidade)

**NOTA:** Análise detalhada indisponível
**STATUS:** Tente novamente em alguns minutos""",
            "score": None,
            "is_fallback": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def correct_essay(
        self, 
        content: str, 
        theme: str, 
        model_key: str = "deepseek",
        user_id: str = None,
        analysis_type: str = "full",
        theme_data: dict = None,
        metadata: dict = None
    ) -> Dict[str, Any]:
        """
        Correct essay with rate limiting, caching, and fallbacks
        
        Args:
            content: Essay content
            theme: Essay theme
            model_key: AI model to use (auto-selected for paragraph analysis)
            user_id: User ID for rate limiting
            analysis_type: "full" or "paragraph" analysis
            theme_data: Optional theme data for personalized prompts
            metadata: Optional metadata for paragraph analysis
        """
        start_time = time.time()
        
        # Auto-select optimal model based on analysis type
        if analysis_type == "paragraph":
            # Use DeepSeek 14B for paragraph analysis (primary)
            model_key = "deepseek_14b"
            # Validate paragraph content length (smaller limit)
            if len(content) > 2000:
                raise AIServiceError("Paragraph content too long (max 2,000 characters)")
        else:
            # Use Llama 253B for full analysis (primary)
            model_key = "llama_253b"
            # Validate full essay content length
            if len(content) > 10000:
                raise AIServiceError("Essay content too long (max 10,000 characters)")
        
        # Validate inputs
        if not content or not content.strip():
            raise AIServiceError("Essay content cannot be empty")
        
        # Check rate limiting
        if user_id:
            is_allowed, wait_time = await self.rate_limiter.is_allowed(user_id)
            if not is_allowed:
                raise RateLimitExceededError(wait_time)
        
        # Check cache first
        cache_key = self._generate_cache_key(content, theme, model_key, analysis_type)
        cached_result = await self._check_cache(cache_key)
        if cached_result:
            return cached_result
        
        # Generate optimized prompt with theme data and metadata
        prompt = self._get_optimized_prompt(content, theme, analysis_type, theme_data, metadata)
        
        try:
            # Try primary model with retry
            feedback = await self._retry_with_backoff(
                self._call_ai_model, 
                model_key, 
                prompt,
                analysis_type,
                user_id
            )
            
            # Parse score from feedback
            score = self._extract_score(feedback, analysis_type)
            
            result = {
                "feedback": feedback,
                "score": score,
                "model": model_key,
                "analysis_type": analysis_type,
                "processing_time": time.time() - start_time,
                "is_fallback": False,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Cache successful result
            await self._cache_result(cache_key, result)
            
            return result
            
        except (AIServiceUnavailableError, AIServiceError) as e:
            logger.error(f"AI service error: {str(e)}")
            
            # Try fallback models if primary fails
            fallback_models = [m for m in self.ai_models.keys() if m != model_key]
            
            for fallback_model in fallback_models:
                try:
                    logger.info(f"Trying fallback model: {fallback_model}")
                    feedback = await self._retry_with_backoff(
                        self._call_ai_model,
                        fallback_model,
                        prompt,
                        analysis_type,
                        user_id
                    )
                    
                    score = self._extract_score(feedback, analysis_type)
                    
                    result = {
                        "feedback": feedback,
                        "score": score,
                        "model": fallback_model,
                        "analysis_type": analysis_type,
                        "processing_time": time.time() - start_time,
                        "is_fallback": True,
                        "fallback_reason": f"Primary model {model_key} failed",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
                    await self._cache_result(cache_key, result)
                    return result
                    
                except Exception as fallback_error:
                    logger.error(f"Fallback model {fallback_model} failed: {str(fallback_error)}")
                    continue
            
            # All models failed, return fallback response
            return await self._get_fallback_response(theme, analysis_type)
    
    def _extract_score(self, feedback: str, analysis_type: str = "full") -> Optional[float]:
        """Extract score from AI feedback"""
        if not feedback:
            return None
        
        try:
            import re
            
            if analysis_type == "paragraph":
                # For paragraph analysis, convert qualitative assessment to numeric score
                # Look for overall assessment
                patterns = [
                    r"AVALIAÇÃO GERAL:\s*(Insuficiente|Regular|Bom|Muito Bom|Excelente)",
                    r"AVALIAÇÃO:\s*(Insuficiente|Regular|Bom|Muito Bom|Excelente)",
                    r"GERAL:\s*(Insuficiente|Regular|Bom|Muito Bom|Excelente)"
                ]
                
                # Mapping qualitative to numeric (out of 1000 for consistency)
                quality_scores = {
                    "Insuficiente": 200,
                    "Regular": 400, 
                    "Bom": 600,
                    "Muito Bom": 800,
                    "Excelente": 1000
                }
                
                for pattern in patterns:
                    match = re.search(pattern, feedback, re.IGNORECASE)
                    if match:
                        quality = match.group(1)
                        return float(quality_scores.get(quality, 400))  # Default to Regular if not found
                
                # If no overall assessment found, try to average individual assessments
                individual_assessments = re.findall(r"AVALIAÇÃO:\s*(Insuficiente|Regular|Bom|Muito Bom|Excelente)", feedback, re.IGNORECASE)
                if individual_assessments:
                    scores = [quality_scores.get(assessment, 400) for assessment in individual_assessments]
                    return float(sum(scores) / len(scores))
                
                # Default score for paragraph if nothing found
                return 400.0  # Regular level
            else:
                # Look for full score out of 1000
                patterns = [
                    r"NOTA FINAL:\s*(\d+)/1000",
                    r"NOTA FINAL:\s*(\d+)\s*/\s*1000",
                    r"TOTAL:\s*(\d+)/1000",
                    r"(\d+)/1000"
                ]
                
                for pattern in patterns:
                    match = re.search(pattern, feedback, re.IGNORECASE)
                    if match:
                        return float(match.group(1))
            
            logger.warning("Could not extract score from feedback")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting score: {str(e)}")
            return None
    
    async def get_rate_limit_status(self, user_id: str) -> Dict[str, Any]:
        """Get rate limit status for user"""
        return await self.rate_limiter.get_user_status(user_id)
    
    async def get_service_health(self) -> Dict[str, Any]:
        """Get AI service health status"""
        health = {
            "status": "healthy",
            "models": {},
            "cache_connected": cache_manager.is_connected,
            "rate_limiting": {
                "requests_per_minute": self.config.rate_limit.requests_per_minute,
                "window_size": self.config.rate_limit.window_size
            }
        }
        
        # Check each model availability
        for model_key, model_config in self.ai_models.items():
            health["models"][model_key] = {
                "name": model_config["name"],
                "available": model_config.get("available", True),
                "model": model_config["model"]
            }
        
        # Overall status
        available_models = sum(1 for m in health["models"].values() if m["available"])
        if available_models == 0:
            health["status"] = "unhealthy"
        elif available_models < len(self.ai_models):
            health["status"] = "degraded"
        
        return health

# Global AI service instance
ai_service = AIService()