"""
Enhanced Deep Analysis System - Análise Profunda Aprimorada
Implements the two-phase analysis system as specified in PLANO_ANALISE_PROFUNDA_APRIMORADA.md

Phase 1: Multi-Model Initial Analysis (Kimi K2, Qwen3 235B, DeepSeek R1)
Phase 2: Synthesis and Final Feedback (Llama 49B)
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

from ai_service import AIService, AIServiceError, RateLimitExceededError
from cache import cache_manager, CacheKeys
from system_prompts import system_prompts_manager

logger = logging.getLogger(__name__)

@dataclass
class Phase1ModelResult:
    """Individual model analysis result from Phase 1"""
    model: str
    feedback: str
    score: Optional[float]
    processing_time: float
    timestamp: str
    error: Optional[str] = None
    success: bool = True
    raw_output: str = ""  # Store complete raw output for Phase 2

@dataclass
class Phase1Results:
    """Complete Phase 1 results from all primary models"""
    kimi_result: Optional[Phase1ModelResult] = None
    qwen_result: Optional[Phase1ModelResult] = None
    deepseek_result: Optional[Phase1ModelResult] = None
    processing_time: float = 0.0
    successful_models: int = 0
    
    def get_successful_results(self) -> List[Phase1ModelResult]:
        """Get all successful model results"""
        results = []
        for result in [self.kimi_result, self.qwen_result, self.deepseek_result]:
            if result and result.success:
                results.append(result)
        return results
    
    def get_raw_outputs_for_synthesis(self) -> Dict[str, str]:
        """Get raw outputs formatted for Llama 49B synthesis"""
        outputs = {}
        if self.kimi_result and self.kimi_result.success:
            outputs["kimi_k2"] = self.kimi_result.raw_output
        if self.qwen_result and self.qwen_result.success:
            outputs["qwen3_235b"] = self.qwen_result.raw_output
        if self.deepseek_result and self.deepseek_result.success:
            outputs["deepseek_r1"] = self.deepseek_result.raw_output
        return outputs

@dataclass
class Phase2Result:
    """Synthesis result from Llama 49B"""
    consolidated_feedback: str
    final_score: Optional[float]
    reliability_level: str
    processing_time: float
    timestamp: str
    error: Optional[str] = None
    success: bool = True

@dataclass
class EnhancedDeepAnalysisResult:
    """Complete enhanced deep analysis result"""
    content_hash: str
    theme: str
    analysis_type: str
    exam_type: str
    phase1_results: Phase1Results
    phase2_result: Phase2Result
    total_processing_time: float
    timestamp: str
    cache_key: str

class EnhancedDeepAnalysisService:
    """Enhanced Deep Analysis Service implementing the two-phase system"""
    
    def __init__(self, ai_service: AIService = None):
        self.ai_service = ai_service or AIService()
        
        # Configuration for enhanced deep analysis
        self.config = {
            "phase1_timeout_per_model": 120,  # 120 seconds timeout per Phase 1 model
            "phase2_timeout": 180,            # 180 seconds timeout for Phase 2 synthesis
            "cache_ttl": 7200,                # 2 hours cache for enhanced analysis
            "min_successful_models": 1,       # Minimum models needed to proceed to Phase 2
            "max_retries": 2                  # Maximum retries per model
        }
        
        # Phase 1 models (as specified in the plan)
        self.phase1_models = {
            "kimi_k2": "kimi_k2",
            "qwen3_235b": "qwen3_235b", 
            "deepseek_r1": "deepseek_r1"
        }
        
        # Phase 2 synthesis model
        self.phase2_model = "llama_49b"
    
    def _generate_enhanced_cache_key(self, content: str, theme: str, analysis_type: str) -> str:
        """Generate cache key for enhanced deep analysis results"""
        content_hash = hashlib.md5(f"{content}{theme}{analysis_type}enhanced".encode()).hexdigest()
        return f"enhanced_deep_analysis:{analysis_type}:{content_hash}"
    
    async def _check_enhanced_cache(self, cache_key: str) -> Optional[EnhancedDeepAnalysisResult]:
        """Check cache for existing enhanced deep analysis result"""
        try:
            cached_data = await cache_manager.get(cache_key)
            if cached_data:
                logger.info(f"Enhanced deep analysis cache hit: {cache_key}")
                return self._deserialize_enhanced_result(cached_data)
        except Exception as e:
            logger.error(f"Enhanced deep analysis cache check error: {str(e)}")
        return None
    
    async def _cache_enhanced_result(self, result: EnhancedDeepAnalysisResult) -> None:
        """Cache enhanced deep analysis result"""
        try:
            serialized_data = self._serialize_enhanced_result(result)
            await cache_manager.set(result.cache_key, serialized_data, expire=self.config["cache_ttl"])
            logger.info(f"Cached enhanced deep analysis result: {result.cache_key}")
        except Exception as e:
            logger.error(f"Enhanced deep analysis cache set error: {str(e)}")
    
    def _serialize_enhanced_result(self, result: EnhancedDeepAnalysisResult) -> Dict[str, Any]:
        """Serialize EnhancedDeepAnalysisResult for caching"""
        return {
            "content_hash": result.content_hash,
            "theme": result.theme,
            "analysis_type": result.analysis_type,
            "exam_type": result.exam_type,
            "phase1_results": {
                "kimi_result": self._serialize_model_result(result.phase1_results.kimi_result),
                "qwen_result": self._serialize_model_result(result.phase1_results.qwen_result),
                "deepseek_result": self._serialize_model_result(result.phase1_results.deepseek_result),
                "processing_time": result.phase1_results.processing_time,
                "successful_models": result.phase1_results.successful_models
            },
            "phase2_result": {
                "consolidated_feedback": result.phase2_result.consolidated_feedback,
                "final_score": result.phase2_result.final_score,
                "reliability_level": result.phase2_result.reliability_level,
                "processing_time": result.phase2_result.processing_time,
                "timestamp": result.phase2_result.timestamp,
                "error": result.phase2_result.error,
                "success": result.phase2_result.success
            },
            "total_processing_time": result.total_processing_time,
            "timestamp": result.timestamp,
            "cache_key": result.cache_key
        }
    
    def _serialize_model_result(self, model_result: Optional[Phase1ModelResult]) -> Optional[Dict[str, Any]]:
        """Serialize a Phase1ModelResult"""
        if not model_result:
            return None
        return {
            "model": model_result.model,
            "feedback": model_result.feedback,
            "score": model_result.score,
            "processing_time": model_result.processing_time,
            "timestamp": model_result.timestamp,
            "error": model_result.error,
            "success": model_result.success,
            "raw_output": model_result.raw_output
        }
    
    def _deserialize_enhanced_result(self, data: Dict[str, Any]) -> EnhancedDeepAnalysisResult:
        """Deserialize cached data to EnhancedDeepAnalysisResult"""
        phase1_data = data["phase1_results"]
        phase1_results = Phase1Results(
            kimi_result=self._deserialize_model_result(phase1_data.get("kimi_result")),
            qwen_result=self._deserialize_model_result(phase1_data.get("qwen_result")),
            deepseek_result=self._deserialize_model_result(phase1_data.get("deepseek_result")),
            processing_time=phase1_data["processing_time"],
            successful_models=phase1_data["successful_models"]
        )
        
        phase2_data = data["phase2_result"]
        phase2_result = Phase2Result(
            consolidated_feedback=phase2_data["consolidated_feedback"],
            final_score=phase2_data["final_score"],
            reliability_level=phase2_data["reliability_level"],
            processing_time=phase2_data["processing_time"],
            timestamp=phase2_data["timestamp"],
            error=phase2_data.get("error"),
            success=phase2_data["success"]
        )
        
        return EnhancedDeepAnalysisResult(
            content_hash=data["content_hash"],
            theme=data["theme"],
            analysis_type=data["analysis_type"],
            exam_type=data["exam_type"],
            phase1_results=phase1_results,
            phase2_result=phase2_result,
            total_processing_time=data["total_processing_time"],
            timestamp=data["timestamp"],
            cache_key=data["cache_key"]
        )
    
    def _deserialize_model_result(self, data: Optional[Dict[str, Any]]) -> Optional[Phase1ModelResult]:
        """Deserialize a Phase1ModelResult"""
        if not data:
            return None
        return Phase1ModelResult(
            model=data["model"],
            feedback=data["feedback"],
            score=data["score"],
            processing_time=data["processing_time"],
            timestamp=data["timestamp"],
            error=data.get("error"),
            success=data["success"],
            raw_output=data.get("raw_output", "")
        )
    
    async def _analyze_with_phase1_model(self, model_key: str, content: str, theme: str, analysis_type: str, exam_type: str) -> Phase1ModelResult:
        """Analyze content with a single Phase 1 model"""
        start_time = time.time()
        
        try:
            # Get personalized prompt for the specific exam type
            prompt = self._get_phase1_prompt(content, theme, analysis_type, exam_type)
            
            # Call the AI model with timeout
            result = await asyncio.wait_for(
                self.ai_service.correct_essay(
                    content=content,
                    theme=theme,
                    model_key=model_key,
                    user_id=None,  # Enhanced deep analysis bypasses user rate limiting
                    analysis_type=analysis_type
                ),
                timeout=self.config["phase1_timeout_per_model"]
            )
            
            return Phase1ModelResult(
                model=model_key,
                feedback=result["feedback"],
                score=result.get("score"),
                processing_time=time.time() - start_time,
                timestamp=datetime.utcnow().isoformat(),
                success=True,
                raw_output=result["feedback"]  # Store complete output for Phase 2
            )
            
        except asyncio.TimeoutError:
            error_msg = f"Phase 1 model {model_key} timed out after {self.config['phase1_timeout_per_model']}s"
            logger.warning(error_msg)
            return Phase1ModelResult(
                model=model_key,
                feedback="",
                score=None,
                processing_time=time.time() - start_time,
                timestamp=datetime.utcnow().isoformat(),
                error=error_msg,
                success=False
            )
            
        except Exception as e:
            error_msg = f"Phase 1 model {model_key} failed: {str(e)}"
            logger.error(error_msg)
            return Phase1ModelResult(
                model=model_key,
                feedback="",
                score=None,
                processing_time=time.time() - start_time,
                timestamp=datetime.utcnow().isoformat(),
                error=error_msg,
                success=False
            )
    
    def _get_phase1_prompt(self, content: str, theme: str, analysis_type: str, exam_type: str) -> str:
        """Get personalized prompt for Phase 1 analysis"""
        try:
            # Use the existing system prompts manager to get the appropriate prompt
            personalized_prompt = system_prompts_manager.get_prompt(
                faculdade=exam_type.lower(),
                analysis_type=analysis_type,
                content=content,
                theme=theme
            )
            return personalized_prompt
        except Exception as e:
            logger.error(f"Error getting Phase 1 prompt: {e}")
            # Fallback to basic prompt
            return f"""Analise esta redação sobre "{theme}" seguindo os critérios do {exam_type}:

{content}

Forneça uma análise completa incluindo:
1. Avaliação por critério/competência
2. Pontos fortes identificados
3. Pontos de melhoria
4. Nota final justificada
5. Sugestões específicas de aprimoramento"""
    
    async def _run_phase1_analysis(self, content: str, theme: str, analysis_type: str, exam_type: str) -> Phase1Results:
        """Run Phase 1 analysis with all three primary models concurrently"""
        start_time = time.time()
        
        logger.info(f"Starting Phase 1 analysis with models: {list(self.phase1_models.keys())}")
        
        # Create tasks for concurrent execution - CRITICAL SYNCHRONIZATION POINT
        tasks = {
            "kimi": self._analyze_with_phase1_model("kimi_k2", content, theme, analysis_type, exam_type),
            "qwen": self._analyze_with_phase1_model("qwen3_235b", content, theme, analysis_type, exam_type),
            "deepseek": self._analyze_with_phase1_model("deepseek_r1", content, theme, analysis_type, exam_type)
        }
        
        # Execute all models concurrently and wait for ALL to complete
        # This is the critical synchronization point mentioned in the plan
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        
        # Map results back to specific models
        kimi_result = results[0] if isinstance(results[0], Phase1ModelResult) else None
        qwen_result = results[1] if isinstance(results[1], Phase1ModelResult) else None
        deepseek_result = results[2] if isinstance(results[2], Phase1ModelResult) else None
        
        # Count successful models
        successful_models = sum(1 for result in [kimi_result, qwen_result, deepseek_result] 
                               if result and result.success)
        
        phase1_results = Phase1Results(
            kimi_result=kimi_result,
            qwen_result=qwen_result,
            deepseek_result=deepseek_result,
            processing_time=time.time() - start_time,
            successful_models=successful_models
        )
        
        logger.info(f"Phase 1 completed in {phase1_results.processing_time:.2f}s with {successful_models}/3 successful models")
        
        return phase1_results
    
    def _create_synthesis_prompt(self, content: str, theme: str, exam_type: str, phase1_outputs: Dict[str, str]) -> str:
        """Create synthesis prompt for Llama 49B based on sujestão análise.txt"""
        
        # Format the model analyses for the prompt
        model_analyses_text = ""
        for model_name, output in phase1_outputs.items():
            model_analyses_text += f"\n\n**ANÁLISE DO MODELO {model_name.upper()}:**\n{output}"
        
        # Load the synthesis prompt template from sujestão análise.txt
        synthesis_template = """Você é um especialista em consolidar análises de redações realizadas por múltiplos avaliadores.

**IMPORTANTE: RESPONDA SEMPRE EM PORTUGUÊS BRASILEIRO.**

## DADOS RECEBIDOS
**TEXTO ORIGINAL DA REDAÇÃO:**
{original_text}

**TEMA:** {theme}

**TIPO DE ANÁLISE:** {exam_type} (ENEM/FUVEST/PUC-RJ/UNIFESP/ITA/UNESP)

**ANÁLISES DOS MODELOS:** {model_analyses}

## OBJETIVO
Consolidar as análises individuais em um feedback único, identificando:
1. Pontos de consenso entre avaliadores
2. Divergências significativas
3. Insights complementares
4. Nota final mais apropriada

## PROCESSO DE CONSOLIDAÇÃO

### 1. ANÁLISE DE CONSENSO
- Identifique aspectos onde há concordância entre os modelos
- Destaque avaliações unânimes (positivas ou negativas)
- Valorize pontos mencionados por múltiplos avaliadores

### 2. ANÁLISE DE DIVERGÊNCIAS
- Identifique discrepâncias significativas nas notas
- Analise diferentes interpretações do mesmo aspecto
- Pondere qual visão é mais fundamentada

### 3. SÍNTESE INTEGRATIVA
- Combine insights complementares
- Elimine redundâncias
- Mantenha apenas o mais relevante e pedagógico

### 4. NOTA FINAL
- Se houver consenso: use a média
- Se houver divergência significativa (>20%): use mediana
- Justifique ajustes quando necessário

## FORMATO DE SAÍDA

**ANÁLISE CONSOLIDADA - {exam_type}**

**Consensos Identificados**
[Listar principais pontos de concordância entre avaliadores]

**Divergências Relevantes**
[Apenas se houver discrepâncias significativas que mereçam atenção]

**Avaliação Final por Critério**
[Para cada critério da faculdade específica, apresentar nota consolidada e justificativa breve]

**Nota Total Consolidada:** [X]/[Total]

**Pontos Fortes - Síntese**
[3 principais qualidades identificadas pela maioria dos avaliadores]

**Pontos de Melhoria - Síntese**
[3 principais aspectos a desenvolver segundo consenso dos avaliadores]

**Orientações Prioritárias**
[5 sugestões mais relevantes compiladas das análises, ordenadas por importância]

**Observação sobre a Análise**
[Se houver alguma divergência muito significativa ou aspecto que mereça atenção especial]"""
        
        return synthesis_template.format(
            original_text=content,
            theme=theme,
            exam_type=exam_type,
            model_analyses=model_analyses_text
        )
    
    async def _run_phase2_synthesis(self, content: str, theme: str, exam_type: str, phase1_results: Phase1Results) -> Phase2Result:
        """Run Phase 2 synthesis with Llama 49B"""
        start_time = time.time()
        
        # Check if we have enough successful models to proceed
        if phase1_results.successful_models < self.config["min_successful_models"]:
            error_msg = f"Insufficient successful Phase 1 models ({phase1_results.successful_models}) for synthesis"
            logger.error(error_msg)
            return Phase2Result(
                consolidated_feedback="**ANÁLISE PROFUNDA INDISPONÍVEL**\n\nNão foi possível obter análises suficientes dos modelos primários para realizar a síntese.",
                final_score=None,
                reliability_level="very_low",
                processing_time=time.time() - start_time,
                timestamp=datetime.utcnow().isoformat(),
                error=error_msg,
                success=False
            )
        
        try:
            # Get raw outputs from Phase 1 for synthesis
            phase1_outputs = phase1_results.get_raw_outputs_for_synthesis()
            
            # Create synthesis prompt
            synthesis_prompt = self._create_synthesis_prompt(content, theme, exam_type, phase1_outputs)
            
            logger.info(f"Starting Phase 2 synthesis with Llama 49B")
            
            # Call Llama 49B for synthesis
            result = await asyncio.wait_for(
                self.ai_service.correct_essay(
                    content=synthesis_prompt,  # The synthesis prompt contains everything
                    theme=f"Síntese de análises para: {theme}",
                    model_key=self.phase2_model,
                    user_id=None,  # Enhanced deep analysis bypasses user rate limiting
                    analysis_type="synthesis"
                ),
                timeout=self.config["phase2_timeout"]
            )
            
            # Extract final score from synthesis
            final_score = self._extract_synthesis_score(result["feedback"])
            
            # Determine reliability level based on Phase 1 success rate
            reliability_level = self._calculate_reliability_level(phase1_results)
            
            return Phase2Result(
                consolidated_feedback=result["feedback"],
                final_score=final_score,
                reliability_level=reliability_level,
                processing_time=time.time() - start_time,
                timestamp=datetime.utcnow().isoformat(),
                success=True
            )
            
        except asyncio.TimeoutError:
            error_msg = f"Phase 2 synthesis timed out after {self.config['phase2_timeout']}s"
            logger.error(error_msg)
            return Phase2Result(
                consolidated_feedback="**ANÁLISE PROFUNDA INDISPONÍVEL**\n\nO processo de síntese das análises excedeu o tempo limite.",
                final_score=None,
                reliability_level="low",
                processing_time=time.time() - start_time,
                timestamp=datetime.utcnow().isoformat(),
                error=error_msg,
                success=False
            )
            
        except Exception as e:
            error_msg = f"Phase 2 synthesis failed: {str(e)}"
            logger.error(error_msg)
            return Phase2Result(
                consolidated_feedback="**ANÁLISE PROFUNDA INDISPONÍVEL**\n\nOcorreu um erro durante o processo de síntese das análises.",
                final_score=None,
                reliability_level="very_low",
                processing_time=time.time() - start_time,
                timestamp=datetime.utcnow().isoformat(),
                error=error_msg,
                success=False
            )
    
    def _extract_synthesis_score(self, synthesis_feedback: str) -> Optional[float]:
        """Extract final score from synthesis feedback"""
        try:
            import re
            
            # Look for consolidated score patterns
            patterns = [
                r"Nota Total Consolidada:\s*(\d+)/(\d+)",
                r"NOTA TOTAL CONSOLIDADA:\s*(\d+)/(\d+)",
                r"Nota Final:\s*(\d+)/(\d+)",
                r"NOTA FINAL:\s*(\d+)/(\d+)"
            ]
            
            for pattern in patterns:
                match = re.search(pattern, synthesis_feedback, re.IGNORECASE)
                if match:
                    score = float(match.group(1))
                    total = float(match.group(2))
                    # Normalize to 1000 if needed
                    if total != 1000:
                        score = (score / total) * 1000
                    return score
            
            logger.warning("Could not extract synthesis score from feedback")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting synthesis score: {str(e)}")
            return None
    
    def _calculate_reliability_level(self, phase1_results: Phase1Results) -> str:
        """Calculate reliability level based on Phase 1 results"""
        success_rate = phase1_results.successful_models / 3.0  # 3 total models
        
        if success_rate >= 1.0:  # All 3 models successful
            return "very_high"
        elif success_rate >= 0.67:  # 2 out of 3 models successful
            return "high"
        elif success_rate >= 0.33:  # 1 out of 3 models successful
            return "medium"
        else:  # No models successful
            return "very_low"
    
    def _detect_exam_type(self, theme: str, theme_data: dict = None) -> str:
        """Detect exam type from theme data or theme string"""
        try:
            if theme_data:
                return system_prompts_manager.detect_faculdade_from_theme(theme_data).upper()
            else:
                return system_prompts_manager.detect_faculdade_from_theme(theme).upper()
        except Exception:
            return "ENEM"  # Default fallback
    
    async def analyze_enhanced_deep(
        self,
        content: str,
        theme: str,
        analysis_type: str = "full",
        user_id: str = None,
        theme_data: dict = None
    ) -> EnhancedDeepAnalysisResult:
        """
        Perform enhanced deep analysis using the two-phase system
        
        Args:
            content: Essay content to analyze
            theme: Essay theme
            analysis_type: Type of analysis ("full" or "paragraph")
            user_id: User ID for rate limiting (optional for enhanced deep analysis)
            theme_data: Optional theme data for exam type detection
        
        Returns:
            EnhancedDeepAnalysisResult with consolidated analysis
        """
        start_time = time.time()
        
        # Validate inputs
        if not content or not content.strip():
            raise AIServiceError("Content cannot be empty for enhanced deep analysis")
        
        if not theme or not theme.strip():
            raise AIServiceError("Theme cannot be empty for enhanced deep analysis")
        
        # Detect exam type
        exam_type = self._detect_exam_type(theme, theme_data)
        
        # Generate content hash and cache key
        content_hash = hashlib.md5(f"{content}{theme}{analysis_type}enhanced".encode()).hexdigest()
        cache_key = self._generate_enhanced_cache_key(content, theme, analysis_type)
        
        # Check cache first
        cached_result = await self._check_enhanced_cache(cache_key)
        if cached_result:
            return cached_result
        
        # Apply rate limiting for enhanced deep analysis (more lenient than regular analysis)
        if user_id:
            # Enhanced deep analysis gets special rate limiting - allow one every 5 minutes
            is_allowed, wait_time = await self.ai_service.rate_limiter.is_allowed(f"enhanced_deep_{user_id}")
            if not is_allowed:
                raise RateLimitExceededError(wait_time)
        
        logger.info(f"Starting enhanced deep analysis for content hash: {content_hash}, exam type: {exam_type}")
        
        # PHASE 1: Run analysis with multiple models (CRITICAL SYNCHRONIZATION POINT)
        phase1_results = await self._run_phase1_analysis(content, theme, analysis_type, exam_type)
        
        # PHASE 2: Synthesis with Llama 49B (BLOCKING - waits for all Phase 1 results)
        phase2_result = await self._run_phase2_synthesis(content, theme, exam_type, phase1_results)
        
        # Create final result
        result = EnhancedDeepAnalysisResult(
            content_hash=content_hash,
            theme=theme,
            analysis_type=analysis_type,
            exam_type=exam_type,
            phase1_results=phase1_results,
            phase2_result=phase2_result,
            total_processing_time=time.time() - start_time,
            timestamp=datetime.utcnow().isoformat(),
            cache_key=cache_key
        )
        
        # Cache the result
        await self._cache_enhanced_result(result)
        
        logger.info(f"Enhanced deep analysis completed in {result.total_processing_time:.2f}s")
        
        return result

# Global enhanced deep analysis service instance
enhanced_deep_analysis_service = EnhancedDeepAnalysisService()