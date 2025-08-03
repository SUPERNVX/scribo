"""
Integration tests for the Deep Analysis system
Tests the complete flow from API endpoint to deep analysis service
"""

import pytest
import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime

# Import the FastAPI app and dependencies
from server import app, get_current_user
from deep_analysis import deep_analysis_service, DeepAnalysisResult, ConsensusMetrics, ModelResult, AnalysisReliability
from auth import UserAuth

# Create test client
client = TestClient(app)

# Mock user for authentication
def mock_get_current_user():
    return UserAuth(
        email="test@example.com",
        name="Test User",
        picture="https://example.com/pic.jpg",
        google_id="test_google_id_123"
    )

# Override the dependency
app.dependency_overrides[get_current_user] = mock_get_current_user

class TestDeepAnalysisIntegration:
    """Integration tests for deep analysis functionality"""
    
    @pytest.fixture
    def sample_essay_content(self):
        """Sample essay content for testing"""
        return """
        A educação é um dos pilares fundamentais para o desenvolvimento de uma sociedade justa e igualitária. 
        No Brasil, apesar dos avanços conquistados nas últimas décadas, ainda enfrentamos desafios significativos 
        para garantir o acesso universal e a qualidade do ensino em todos os níveis educacionais.
        
        Um dos principais problemas é a desigualdade no acesso à educação de qualidade. Enquanto estudantes de 
        classes sociais mais altas têm acesso a escolas bem estruturadas e professores qualificados, aqueles 
        provenientes de famílias de baixa renda frequentemente estudam em instituições com infraestrutura 
        precária e recursos limitados. Essa disparidade perpetua o ciclo de desigualdade social.
        
        Além disso, a formação e valorização dos professores representa outro desafio crucial. Muitos 
        profissionais da educação trabalham em condições inadequadas, com salários baixos e falta de 
        reconhecimento social. Isso resulta na desmotivação dos educadores e, consequentemente, na 
        diminuição da qualidade do ensino oferecido aos estudantes.
        
        Para enfrentar esses desafios, é necessário implementar políticas públicas efetivas que promovam 
        a equidade educacional. O governo deve investir massivamente na melhoria da infraestrutura escolar, 
        na formação continuada dos professores e na criação de programas de apoio aos estudantes em 
        situação de vulnerabilidade social. Somente através de um esforço conjunto entre poder público, 
        sociedade civil e família será possível construir um sistema educacional verdadeiramente inclusivo 
        e transformador.
        """
    
    @pytest.fixture
    def sample_theme(self):
        """Sample theme for testing"""
        return "Os desafios da educação no Brasil"
    
    def test_deep_analysis_endpoint_success(self, sample_essay_content, sample_theme):
        """Test successful deep analysis request"""
        
        # Mock the deep analysis service
        mock_result = DeepAnalysisResult(
            content_hash="test_hash_123",
            theme=sample_theme,
            analysis_type="full",
            model_results=[
                ModelResult(
                    model="deepseek",
                    feedback="Excelente redação com boa estrutura argumentativa.",
                    score=850.0,
                    processing_time=2.5,
                    timestamp=datetime.utcnow().isoformat(),
                    success=True
                ),
                ModelResult(
                    model="llama",
                    feedback="Redação bem desenvolvida com argumentos consistentes.",
                    score=820.0,
                    processing_time=3.1,
                    timestamp=datetime.utcnow().isoformat(),
                    success=True
                )
            ],
            consensus_metrics=ConsensusMetrics(
                score_variance=225.0,
                score_std_dev=15.0,
                agreement_percentage=85.5,
                reliability_level=AnalysisReliability.HIGH,
                outlier_models=[],
                consensus_score=835.0
            ),
            final_score=835.0,
            final_feedback="**ANÁLISE PROFUNDA COM MÚLTIPLOS MODELOS DE IA**\n\nRedação bem estruturada com argumentos sólidos.",
            reliability_report={
                "total_models_attempted": 2,
                "successful_models": 2,
                "success_rate": 100.0
            },
            processing_time=5.6,
            timestamp=datetime.utcnow().isoformat(),
            cache_key="deep_analysis:full:test_hash_123"
        )
        
        with patch.object(deep_analysis_service, 'analyze_deep', new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = mock_result
            
            # Make the request
            response = client.post("/api/deep-analysis", json={
                "content": sample_essay_content,
                "theme": sample_theme,
                "analysis_type": "full"
            })
            
            # Verify response
            assert response.status_code == 200
            data = response.json()
            
            # Check response structure
            assert "content_hash" in data
            assert "theme" in data
            assert "analysis_type" in data
            assert "model_results" in data
            assert "consensus_metrics" in data
            assert "final_score" in data
            assert "final_feedback" in data
            assert "reliability_report" in data
            assert "processing_time" in data
            assert "timestamp" in data
            
            # Check specific values
            assert data["theme"] == sample_theme
            assert data["analysis_type"] == "full"
            assert data["final_score"] == 835.0
            assert len(data["model_results"]) == 2
            assert data["consensus_metrics"]["reliability_level"] == "high"
            assert data["consensus_metrics"]["agreement_percentage"] == 85.5
            
            # Verify the service was called correctly
            mock_analyze.assert_called_once()
            call_args = mock_analyze.call_args
            assert call_args[1]["content"] == sample_essay_content
            assert call_args[1]["theme"] == sample_theme
            assert call_args[1]["analysis_type"] == "full"
            assert call_args[1]["user_id"] == "test@example.com"
    
    def test_deep_analysis_endpoint_validation_errors(self):
        """Test validation errors in deep analysis endpoint"""
        
        # Test empty content
        response = client.post("/api/deep-analysis", json={
            "content": "",
            "theme": "Test theme",
            "analysis_type": "full"
        })
        assert response.status_code == 400
        assert "não pode estar vazio" in response.json()["detail"]
        
        # Test content too short
        response = client.post("/api/deep-analysis", json={
            "content": "Very short content",
            "theme": "Test theme",
            "analysis_type": "full"
        })
        assert response.status_code == 400
        assert "muito curto" in response.json()["detail"]
        
        # Test content too long
        long_content = "A" * 16000  # Exceeds 15000 character limit
        response = client.post("/api/deep-analysis", json={
            "content": long_content,
            "theme": "Test theme",
            "analysis_type": "full"
        })
        assert response.status_code == 400
        assert "muito longo" in response.json()["detail"]
        
        # Test invalid competency focus
        response = client.post("/api/deep-analysis", json={
            "content": "A" * 1000,
            "theme": "Test theme",
            "analysis_type": "competency",
            "competency_focus": "invalid_competency"
        })
        assert response.status_code == 400
        assert "inválida" in response.json()["detail"]
    
    def test_deep_analysis_endpoint_rate_limiting(self, sample_essay_content, sample_theme):
        """Test rate limiting in deep analysis endpoint"""
        
        from ai_service import RateLimitExceededError
        
        with patch.object(deep_analysis_service, 'analyze_deep', new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = RateLimitExceededError(wait_time=120)
            
            response = client.post("/api/deep-analysis", json={
                "content": sample_essay_content,
                "theme": sample_theme,
                "analysis_type": "full"
            })
            
            assert response.status_code == 429
            assert "120 segundos" in response.json()["detail"]
    
    def test_deep_analysis_endpoint_service_unavailable(self, sample_essay_content, sample_theme):
        """Test service unavailable error in deep analysis endpoint"""
        
        from ai_service import AIServiceUnavailableError
        
        with patch.object(deep_analysis_service, 'analyze_deep', new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AIServiceUnavailableError("Service temporarily unavailable")
            
            response = client.post("/api/deep-analysis", json={
                "content": sample_essay_content,
                "theme": sample_theme,
                "analysis_type": "full"
            })
            
            assert response.status_code == 503
            assert "temporariamente indisponível" in response.json()["detail"]
    
    def test_deep_analysis_competency_focus(self, sample_essay_content, sample_theme):
        """Test deep analysis with competency focus"""
        
        mock_result = DeepAnalysisResult(
            content_hash="test_hash_comp",
            theme=sample_theme,
            analysis_type="competency",
            model_results=[
                ModelResult(
                    model="deepseek",
                    feedback="Análise focada na competência 1: Domínio da norma culta.",
                    score=800.0,
                    processing_time=2.0,
                    timestamp=datetime.utcnow().isoformat(),
                    success=True
                )
            ],
            consensus_metrics=ConsensusMetrics(
                score_variance=0.0,
                score_std_dev=0.0,
                agreement_percentage=100.0,
                reliability_level=AnalysisReliability.VERY_HIGH,
                outlier_models=[],
                consensus_score=800.0
            ),
            final_score=800.0,
            final_feedback="Análise focada na competência 1 concluída.",
            reliability_report={"total_models_attempted": 1, "successful_models": 1},
            processing_time=2.0,
            timestamp=datetime.utcnow().isoformat(),
            cache_key="deep_analysis:competency:test_hash_comp"
        )
        
        with patch.object(deep_analysis_service, 'analyze_deep', new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = mock_result
            
            response = client.post("/api/deep-analysis", json={
                "content": sample_essay_content,
                "theme": sample_theme,
                "analysis_type": "competency",
                "competency_focus": "competency1"
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["analysis_type"] == "competency"
            assert data["final_score"] == 800.0
            
            # Verify the service was called with competency focus
            mock_analyze.assert_called_once()
            # Note: The current implementation doesn't pass competency_focus to the service
            # This would need to be implemented in the actual service
    
    def test_deep_analysis_comparison_endpoint(self):
        """Test deep analysis comparison endpoint (currently returns 501)"""
        
        response = client.get("/api/deep-analysis/comparison?content_hash=test_hash")
        
        assert response.status_code == 501
        assert "será implementada" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_deep_analysis_service_integration(self, sample_essay_content, sample_theme):
        """Test the deep analysis service directly"""
        
        # Mock the AI service methods
        with patch.object(deep_analysis_service.ai_service, 'correct_essay', new_callable=AsyncMock) as mock_correct:
            # Mock successful responses from different models
            mock_correct.side_effect = [
                {
                    "feedback": "Excelente redação com estrutura bem definida.",
                    "score": 850.0,
                    "model": "deepseek",
                    "processing_time": 2.5,
                    "timestamp": datetime.utcnow().isoformat()
                },
                {
                    "feedback": "Redação bem argumentada com boa coesão.",
                    "score": 820.0,
                    "model": "llama",
                    "processing_time": 3.0,
                    "timestamp": datetime.utcnow().isoformat()
                }
            ]
            
            # Mock the AI models available
            deep_analysis_service.ai_service.ai_models = {
                "deepseek": {"available": True},
                "llama": {"available": True}
            }
            
            # Perform deep analysis
            result = await deep_analysis_service.analyze_deep(
                content=sample_essay_content,
                theme=sample_theme,
                analysis_type="full",
                user_id="test@example.com"
            )
            
            # Verify result structure
            assert isinstance(result, DeepAnalysisResult)
            assert result.theme == sample_theme
            assert result.analysis_type == "full"
            assert len(result.model_results) == 2
            assert result.final_score is not None
            assert result.final_feedback is not None
            assert result.consensus_metrics is not None
            
            # Verify consensus metrics
            assert result.consensus_metrics.agreement_percentage > 0
            assert result.consensus_metrics.reliability_level in [
                AnalysisReliability.VERY_HIGH,
                AnalysisReliability.HIGH,
                AnalysisReliability.MEDIUM,
                AnalysisReliability.LOW,
                AnalysisReliability.VERY_LOW
            ]
            
            # Verify model results
            successful_results = [r for r in result.model_results if r.success]
            assert len(successful_results) == 2
            assert all(r.score is not None for r in successful_results)
            assert all(r.feedback for r in successful_results)
    
    def test_deep_analysis_caching(self, sample_essay_content, sample_theme):
        """Test that deep analysis results are properly cached"""
        
        # This test would require mocking the cache manager
        # For now, we'll test that the cache key is generated correctly
        cache_key = deep_analysis_service._generate_deep_cache_key(
            sample_essay_content, 
            sample_theme, 
            "full"
        )
        
        assert cache_key.startswith("deep_analysis:full:")
        assert len(cache_key.split(":")) == 3
        
        # Test that the same content generates the same cache key
        cache_key2 = deep_analysis_service._generate_deep_cache_key(
            sample_essay_content, 
            sample_theme, 
            "full"
        )
        
        assert cache_key == cache_key2
        
        # Test that different content generates different cache keys
        cache_key3 = deep_analysis_service._generate_deep_cache_key(
            sample_essay_content + " additional text", 
            sample_theme, 
            "full"
        )
        
        assert cache_key != cache_key3

if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])