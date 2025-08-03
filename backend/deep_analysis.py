"""
Deep Analysis System with Multiple AI Models
Implements multi-model analysis, consensus algorithms, and reliability assessment
"""

import asyncio
import hashlib
import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import statistics

from ai_service import AIService, AIModel, AIServiceError, RateLimitExceededError
from cache import cache_manager, CacheKeys

logger = logging.getLogger(__name__)

class AnalysisReliability(Enum):
    """Analysis reliability levels based on model consensus"""
    VERY_HIGH = "very_high"  # 90%+ agreement
    HIGH = "high"           # 75-89% agreement
    MEDIUM = "medium"       # 60-74% agreement
    LOW = "low"            # 40-59% agreement
    VERY_LOW = "very_low"  # <40% agreement

@dataclass
class ModelResult:
    """Individual model analysis result"""
    model: str
    feedback: str
    score: Optional[float]
    processing_time: float
    timestamp: str
    error: Optional[str] = None
    success: bool = True

@dataclass
class ConsensusMetrics:
    """Metrics for model consensus analysis"""
    score_variance: float
    score_std_dev: float
    agreement_percentage: float
    reliability_level: AnalysisReliability
    outlier_models: List[str]
    consensus_score: Optional[float]

@dataclass
class DeepAnalysisResult:
    """Complete deep analysis result with multiple models"""
    content_hash: str
    theme: str
    analysis_type: str
    model_results: List[ModelResult]
    consensus_metrics: ConsensusMetrics
    final_score: Optional[float]
    final_feedback: str
    reliability_report: Dict[str, Any]
    processing_time: float
    timestamp: str
    cache_key: str

class DeepAnalysisService:
    """Service for deep analysis using multiple AI models simultaneously"""
    
    def __init__(self, ai_service: AIService = None):
        self.ai_service = ai_service or AIService()
        
        # Configuration for deep analysis
        self.config = {
            "max_concurrent_models": 4,  # Maximum models to run simultaneously
            "consensus_threshold": 0.75,  # 75% agreement threshold for high reliability
            "outlier_threshold": 2.0,     # Standard deviations for outlier detection
            "cache_ttl": 7200,           # 2 hours cache for deep analysis
            "timeout_per_model": 90,     # 90 seconds timeout per model
            "min_models_for_consensus": 2  # Minimum models needed for consensus
        }
    
    def _generate_deep_cache_key(self, content: str, theme: str, analysis_type: str) -> str:
        """Generate cache key for deep analysis results"""
        content_hash = hashlib.md5(f"{content}{theme}{analysis_type}deep".encode()).hexdigest()
        return f"deep_analysis:{analysis_type}:{content_hash}"
    
    async def _check_deep_cache(self, cache_key: str) -> Optional[DeepAnalysisResult]:
        """Check cache for existing deep analysis result"""
        try:
            cached_data = await cache_manager.get(cache_key)
            if cached_data:
                logger.info(f"Deep analysis cache hit: {cache_key}")
                # Reconstruct DeepAnalysisResult from cached data
                return self._deserialize_deep_result(cached_data)
        except Exception as e:
            logger.error(f"Deep analysis cache check error: {str(e)}")
        return None
    
    async def _cache_deep_result(self, result: DeepAnalysisResult) -> None:
        """Cache deep analysis result"""
        try:
            serialized_data = self._serialize_deep_result(result)
            await cache_manager.set(result.cache_key, serialized_data, expire=self.config["cache_ttl"])
            logger.info(f"Cached deep analysis result: {result.cache_key}")
        except Exception as e:
            logger.error(f"Deep analysis cache set error: {str(e)}")
    
    def _serialize_deep_result(self, result: DeepAnalysisResult) -> Dict[str, Any]:
        """Serialize DeepAnalysisResult for caching"""
        return {
            "content_hash": result.content_hash,
            "theme": result.theme,
            "analysis_type": result.analysis_type,
            "model_results": [
                {
                    "model": mr.model,
                    "feedback": mr.feedback,
                    "score": mr.score,
                    "processing_time": mr.processing_time,
                    "timestamp": mr.timestamp,
                    "error": mr.error,
                    "success": mr.success
                } for mr in result.model_results
            ],
            "consensus_metrics": {
                "score_variance": result.consensus_metrics.score_variance,
                "score_std_dev": result.consensus_metrics.score_std_dev,
                "agreement_percentage": result.consensus_metrics.agreement_percentage,
                "reliability_level": result.consensus_metrics.reliability_level.value,
                "outlier_models": result.consensus_metrics.outlier_models,
                "consensus_score": result.consensus_metrics.consensus_score
            },
            "final_score": result.final_score,
            "final_feedback": result.final_feedback,
            "reliability_report": result.reliability_report,
            "processing_time": result.processing_time,
            "timestamp": result.timestamp,
            "cache_key": result.cache_key
        }
    
    def _deserialize_deep_result(self, data: Dict[str, Any]) -> DeepAnalysisResult:
        """Deserialize cached data to DeepAnalysisResult"""
        model_results = [
            ModelResult(
                model=mr["model"],
                feedback=mr["feedback"],
                score=mr["score"],
                processing_time=mr["processing_time"],
                timestamp=mr["timestamp"],
                error=mr.get("error"),
                success=mr.get("success", True)
            ) for mr in data["model_results"]
        ]
        
        consensus_metrics = ConsensusMetrics(
            score_variance=data["consensus_metrics"]["score_variance"],
            score_std_dev=data["consensus_metrics"]["score_std_dev"],
            agreement_percentage=data["consensus_metrics"]["agreement_percentage"],
            reliability_level=AnalysisReliability(data["consensus_metrics"]["reliability_level"]),
            outlier_models=data["consensus_metrics"]["outlier_models"],
            consensus_score=data["consensus_metrics"]["consensus_score"]
        )
        
        return DeepAnalysisResult(
            content_hash=data["content_hash"],
            theme=data["theme"],
            analysis_type=data["analysis_type"],
            model_results=model_results,
            consensus_metrics=consensus_metrics,
            final_score=data["final_score"],
            final_feedback=data["final_feedback"],
            reliability_report=data["reliability_report"],
            processing_time=data["processing_time"],
            timestamp=data["timestamp"],
            cache_key=data["cache_key"]
        )
    
    async def _analyze_with_model(self, model_key: str, content: str, theme: str, analysis_type: str) -> ModelResult:
        """Analyze content with a single model"""
        start_time = time.time()
        
        try:
            # Use the existing AI service to analyze with specific model
            result = await asyncio.wait_for(
                self.ai_service.correct_essay(
                    content=content,
                    theme=theme,
                    model_key=model_key,
                    user_id=None,  # Deep analysis bypasses user rate limiting
                    analysis_type=analysis_type,
                    theme_data={"title": theme, "faculdade": "ENEM"}  # Ensure theme_data is passed
                ),
                timeout=self.config["timeout_per_model"]
            )
            
            return ModelResult(
                model=model_key,
                feedback=result["feedback"],
                score=result.get("score"),
                processing_time=time.time() - start_time,
                timestamp=datetime.utcnow().isoformat(),
                success=True
            )
            
        except asyncio.TimeoutError:
            error_msg = f"Model {model_key} timed out after {self.config['timeout_per_model']}s"
            logger.warning(error_msg)
            return ModelResult(
                model=model_key,
                feedback="",
                score=None,
                processing_time=time.time() - start_time,
                timestamp=datetime.utcnow().isoformat(),
                error=error_msg,
                success=False
            )
            
        except Exception as e:
            error_msg = f"Model {model_key} failed: {str(e)}"
            logger.error(error_msg)
            return ModelResult(
                model=model_key,
                feedback="",
                score=None,
                processing_time=time.time() - start_time,
                timestamp=datetime.utcnow().isoformat(),
                error=error_msg,
                success=False
            )
    
    async def _run_multiple_models(self, content: str, theme: str, analysis_type: str) -> List[ModelResult]:
        """Run analysis with multiple models concurrently"""
        # Get available models from AI service
        available_models = [
            model_key for model_key, model_config in self.ai_service.ai_models.items()
            if model_config.get("available", True)
        ]
        
        if not available_models:
            raise AIServiceError("No AI models available for deep analysis")
        
        # Limit concurrent models
        models_to_use = available_models[:self.config["max_concurrent_models"]]
        logger.info(f"Running deep analysis with models: {models_to_use}")
        
        # Create tasks for concurrent execution
        tasks = [
            self._analyze_with_model(model_key, content, theme, analysis_type)
            for model_key in models_to_use
        ]
        
        # Execute all models concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and return valid results
        model_results = []
        for result in results:
            if isinstance(result, ModelResult):
                model_results.append(result)
            else:
                logger.error(f"Unexpected result type in deep analysis: {type(result)}")
        
        return model_results
    
    def _calculate_consensus_metrics(self, model_results: List[ModelResult]) -> ConsensusMetrics:
        """Calculate consensus metrics from model results"""
        # Get successful results with scores
        successful_results = [r for r in model_results if r.success and r.score is not None]
        
        if len(successful_results) < self.config["min_models_for_consensus"]:
            return ConsensusMetrics(
                score_variance=0.0,
                score_std_dev=0.0,
                agreement_percentage=0.0,
                reliability_level=AnalysisReliability.VERY_LOW,
                outlier_models=[],
                consensus_score=None
            )
        
        scores = [r.score for r in successful_results]
        
        # Calculate statistical metrics
        mean_score = statistics.mean(scores)
        variance = statistics.variance(scores) if len(scores) > 1 else 0.0
        std_dev = statistics.stdev(scores) if len(scores) > 1 else 0.0
        
        # Identify outliers (scores beyond 2 standard deviations)
        outlier_models = []
        if std_dev > 0:
            for result in successful_results:
                z_score = abs(result.score - mean_score) / std_dev
                if z_score > self.config["outlier_threshold"]:
                    outlier_models.append(result.model)
        
        # Calculate agreement percentage (inverse of coefficient of variation)
        if mean_score > 0:
            cv = std_dev / mean_score  # Coefficient of variation
            agreement_percentage = max(0, (1 - cv) * 100)
        else:
            agreement_percentage = 0.0
        
        # Determine reliability level
        if agreement_percentage >= 90:
            reliability_level = AnalysisReliability.VERY_HIGH
        elif agreement_percentage >= 75:
            reliability_level = AnalysisReliability.HIGH
        elif agreement_percentage >= 60:
            reliability_level = AnalysisReliability.MEDIUM
        elif agreement_percentage >= 40:
            reliability_level = AnalysisReliability.LOW
        else:
            reliability_level = AnalysisReliability.VERY_LOW
        
        # Calculate consensus score (median of non-outlier scores)
        non_outlier_scores = [
            r.score for r in successful_results 
            if r.model not in outlier_models
        ]
        consensus_score = statistics.median(non_outlier_scores) if non_outlier_scores else mean_score
        
        return ConsensusMetrics(
            score_variance=variance,
            score_std_dev=std_dev,
            agreement_percentage=agreement_percentage,
            reliability_level=reliability_level,
            outlier_models=outlier_models,
            consensus_score=consensus_score
        )
    
    def _generate_consensus_feedback(self, model_results: List[ModelResult], consensus_metrics: ConsensusMetrics) -> str:
        """Generate consolidated feedback based on model consensus"""
        successful_results = [r for r in model_results if r.success and r.feedback]
        
        if not successful_results:
            return "**ANÁLISE PROFUNDA INDISPONÍVEL**\n\nNão foi possível obter análises dos modelos de IA."
        
        # Extract common themes and feedback points
        feedback_sections = {
            "strengths": [],
            "improvements": [],
            "scores": [],
            "general_comments": []
        }
        
        for result in successful_results:
            feedback = result.feedback
            
            # Extract strengths (pontos fortes, fortes, positivos)
            if "fortes:" in feedback.lower() or "positivos:" in feedback.lower():
                lines = feedback.split('\n')
                for i, line in enumerate(lines):
                    if "fortes:" in line.lower() or "positivos:" in line.lower():
                        if i + 1 < len(lines):
                            feedback_sections["strengths"].append(lines[i + 1].strip())
            
            # Extract improvements (melhorar, sugestões)
            if "melhorar:" in feedback.lower() or "sugestões:" in feedback.lower():
                lines = feedback.split('\n')
                for i, line in enumerate(lines):
                    if "melhorar:" in line.lower() or "sugestões:" in line.lower():
                        if i + 1 < len(lines):
                            feedback_sections["improvements"].append(lines[i + 1].strip())
            
            # Extract scores if available
            if result.score:
                feedback_sections["scores"].append(f"{result.model}: {result.score}")
        
        # Build consensus feedback
        consensus_feedback = f"""**ANÁLISE PROFUNDA COM MÚLTIPLOS MODELOS DE IA**

**CONFIABILIDADE DA ANÁLISE:** {consensus_metrics.reliability_level.value.upper().replace('_', ' ')}
**CONCORDÂNCIA ENTRE MODELOS:** {consensus_metrics.agreement_percentage:.1f}%
**MODELOS ANALISADOS:** {len(successful_results)} de {len(model_results)}

"""
        
        if consensus_metrics.consensus_score:
            consensus_feedback += f"**PONTUAÇÃO CONSENSUAL:** {consensus_metrics.consensus_score:.0f}/1000\n\n"
        
        # Add reliability assessment
        if consensus_metrics.reliability_level in [AnalysisReliability.VERY_HIGH, AnalysisReliability.HIGH]:
            consensus_feedback += "✅ **ALTA CONFIABILIDADE:** Os modelos apresentaram alta concordância na avaliação.\n\n"
        elif consensus_metrics.reliability_level == AnalysisReliability.MEDIUM:
            consensus_feedback += "⚠️ **CONFIABILIDADE MODERADA:** Há algumas divergências entre os modelos.\n\n"
        else:
            consensus_feedback += "❌ **BAIXA CONFIABILIDADE:** Significativas divergências entre os modelos foram detectadas.\n\n"
        
        # Add outlier information
        if consensus_metrics.outlier_models:
            consensus_feedback += f"**MODELOS COM AVALIAÇÕES DIVERGENTES:** {', '.join(consensus_metrics.outlier_models)}\n\n"
        
        # Add consolidated strengths
        if feedback_sections["strengths"]:
            unique_strengths = list(set(feedback_sections["strengths"]))[:3]
            consensus_feedback += "**PONTOS FORTES IDENTIFICADOS:**\n"
            for strength in unique_strengths:
                if strength:
                    consensus_feedback += f"• {strength}\n"
            consensus_feedback += "\n"
        
        # Add consolidated improvements
        if feedback_sections["improvements"]:
            unique_improvements = list(set(feedback_sections["improvements"]))[:3]
            consensus_feedback += "**PRINCIPAIS SUGESTÕES DE MELHORIA:**\n"
            for improvement in unique_improvements:
                if improvement:
                    consensus_feedback += f"• {improvement}\n"
            consensus_feedback += "\n"
        
        # Add individual model scores
        if feedback_sections["scores"]:
            consensus_feedback += "**PONTUAÇÕES INDIVIDUAIS:**\n"
            for score in feedback_sections["scores"]:
                consensus_feedback += f"• {score}\n"
            consensus_feedback += "\n"
        
        # Add statistical information
        consensus_feedback += f"""**MÉTRICAS ESTATÍSTICAS:**
• Desvio Padrão: {consensus_metrics.score_std_dev:.1f}
• Variância: {consensus_metrics.score_variance:.1f}
• Modelos Bem-sucedidos: {len(successful_results)}/{len(model_results)}

**NOTA:** Esta análise profunda utiliza múltiplos modelos de IA para fornecer uma avaliação mais robusta e confiável."""
        
        return consensus_feedback
    
    def _generate_reliability_report(self, model_results: List[ModelResult], consensus_metrics: ConsensusMetrics) -> Dict[str, Any]:
        """Generate detailed reliability report"""
        successful_models = [r.model for r in model_results if r.success]
        failed_models = [r.model for r in model_results if not r.success]
        
        return {
            "total_models_attempted": len(model_results),
            "successful_models": len(successful_models),
            "failed_models": len(failed_models),
            "success_rate": len(successful_models) / len(model_results) * 100 if model_results else 0,
            "model_performance": {
                "successful": successful_models,
                "failed": failed_models,
                "outliers": consensus_metrics.outlier_models
            },
            "consensus_quality": {
                "agreement_percentage": consensus_metrics.agreement_percentage,
                "reliability_level": consensus_metrics.reliability_level.value,
                "score_consistency": {
                    "variance": consensus_metrics.score_variance,
                    "std_dev": consensus_metrics.score_std_dev
                }
            },
            "recommendations": self._generate_reliability_recommendations(consensus_metrics)
        }
    
    def _generate_reliability_recommendations(self, consensus_metrics: ConsensusMetrics) -> List[str]:
        """Generate recommendations based on reliability metrics"""
        recommendations = []
        
        if consensus_metrics.reliability_level == AnalysisReliability.VERY_HIGH:
            recommendations.append("Análise altamente confiável - pode ser usada com segurança")
        elif consensus_metrics.reliability_level == AnalysisReliability.HIGH:
            recommendations.append("Análise confiável - pequenas variações são normais")
        elif consensus_metrics.reliability_level == AnalysisReliability.MEDIUM:
            recommendations.append("Considere solicitar nova análise para maior precisão")
        else:
            recommendations.append("Baixa confiabilidade - recomenda-se análise manual adicional")
        
        if consensus_metrics.outlier_models:
            recommendations.append(f"Modelos {', '.join(consensus_metrics.outlier_models)} apresentaram avaliações divergentes")
        
        if consensus_metrics.score_std_dev > 100:
            recommendations.append("Alta variação nas pontuações - considere fatores contextuais")
        
        return recommendations
    
    async def analyze_deep(
        self,
        content: str,
        theme: str,
        analysis_type: str = "full",
        user_id: str = None
    ) -> DeepAnalysisResult:
        """
        Perform deep analysis using multiple AI models
        
        Args:
            content: Essay content to analyze
            theme: Essay theme
            analysis_type: Type of analysis ("full" or "paragraph")
            user_id: User ID for rate limiting (optional for deep analysis)
        
        Returns:
            DeepAnalysisResult with consensus analysis
        """
        start_time = time.time()
        
        # Validate inputs
        if not content or not content.strip():
            raise AIServiceError("Content cannot be empty for deep analysis")
        
        if not theme or not theme.strip():
            raise AIServiceError("Theme cannot be empty for deep analysis")
        
        # Generate content hash and cache key
        content_hash = hashlib.md5(f"{content}{theme}{analysis_type}".encode()).hexdigest()
        cache_key = self._generate_deep_cache_key(content, theme, analysis_type)
        
        # Check cache first
        cached_result = await self._check_deep_cache(cache_key)
        if cached_result:
            return cached_result
        
        # Apply rate limiting for deep analysis (more lenient than regular analysis)
        if user_id:
            # Deep analysis gets special rate limiting - allow one every 2 minutes
            is_allowed, wait_time = await self.ai_service.rate_limiter.is_allowed(f"deep_{user_id}")
            if not is_allowed:
                raise RateLimitExceededError(wait_time)
        
        logger.info(f"Starting deep analysis for content hash: {content_hash}")
        
        # Run analysis with multiple models
        model_results = await self._run_multiple_models(content, theme, analysis_type)
        
        if not model_results:
            raise AIServiceError("No models were able to complete the analysis")
        
        # Calculate consensus metrics
        consensus_metrics = self._calculate_consensus_metrics(model_results)
        
        # Generate consensus feedback
        final_feedback = self._generate_consensus_feedback(model_results, consensus_metrics)
        
        # Generate reliability report
        reliability_report = self._generate_reliability_report(model_results, consensus_metrics)
        
        # Create final result
        result = DeepAnalysisResult(
            content_hash=content_hash,
            theme=theme,
            analysis_type=analysis_type,
            model_results=model_results,
            consensus_metrics=consensus_metrics,
            final_score=consensus_metrics.consensus_score,
            final_feedback=final_feedback,
            reliability_report=reliability_report,
            processing_time=time.time() - start_time,
            timestamp=datetime.utcnow().isoformat(),
            cache_key=cache_key
        )
        
        # Cache the result
        await self._cache_deep_result(result)
        
        logger.info(f"Deep analysis completed in {result.processing_time:.2f}s with {len([r for r in model_results if r.success])} successful models")
        
        return result
    
    async def get_analysis_comparison(self, content: str, theme: str, analysis_type: str = "full") -> Dict[str, Any]:
        """Get detailed comparison between individual model results"""
        cache_key = self._generate_deep_cache_key(content, theme, analysis_type)
        cached_result = await self._check_deep_cache(cache_key)
        
        if not cached_result:
            # Run fresh analysis if not cached
            cached_result = await self.analyze_deep(content, theme, analysis_type)
        
        # Generate detailed comparison
        comparison = {
            "summary": {
                "total_models": len(cached_result.model_results),
                "successful_models": len([r for r in cached_result.model_results if r.success]),
                "consensus_score": cached_result.consensus_metrics.consensus_score,
                "reliability": cached_result.consensus_metrics.reliability_level.value
            },
            "individual_results": [],
            "score_analysis": {
                "mean": None,
                "median": None,
                "min": None,
                "max": None,
                "std_dev": cached_result.consensus_metrics.score_std_dev
            },
            "agreement_matrix": {}
        }
        
        # Add individual results
        successful_results = [r for r in cached_result.model_results if r.success]
        for result in cached_result.model_results:
            comparison["individual_results"].append({
                "model": result.model,
                "score": result.score,
                "success": result.success,
                "processing_time": result.processing_time,
                "error": result.error,
                "is_outlier": result.model in cached_result.consensus_metrics.outlier_models
            })
        
        # Calculate score statistics
        if successful_results:
            scores = [r.score for r in successful_results if r.score is not None]
            if scores:
                comparison["score_analysis"].update({
                    "mean": statistics.mean(scores),
                    "median": statistics.median(scores),
                    "min": min(scores),
                    "max": max(scores)
                })
        
        return comparison

# Global deep analysis service instance
deep_analysis_service = DeepAnalysisService()