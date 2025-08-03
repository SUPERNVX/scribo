from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
import requests
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import sqlite3
import json
import asyncio
import os
os.environ['GOOGLE_CLIENT_ID'] = '3208095428-1um39vq2u873ick597j0j686h0j8ic7n.apps.googleusercontent.com'
os.environ['GOOGLE_CLIENT_SECRET'] = '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'
print("CORRECAO: Variaveis Google carregadas")
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime
import httpx
from openai import OpenAI

# Import authentication modules
from auth import (
    AuthHandler, 
    UserAuth, 
    GoogleTokenRequest, 
    TokenResponse, 
    UserResponse,
    create_get_current_user_dependency
)

# Import cache modules
from cache import CacheManager, CacheKeys, cache_manager

# Import database adapter
from database_adapter import db_adapter

# Import AI service
from ai_service import ai_service, AIServiceError, RateLimitExceededError, AIServiceUnavailableError

# Import deep analysis service
from deep_analysis import deep_analysis_service, DeepAnalysisResult

# Import enhanced deep analysis service
from enhanced_deep_analysis import enhanced_deep_analysis_service, EnhancedDeepAnalysisResult

# Import task queue system
from task_queue import task_queue
from task_handlers import register_task_handlers
from task_api import router as task_router

# Import geolocation service
from geolocation_service import geolocation_service

# Import tier management API
from tier_api import router as tier_router

# Import tier-based rate limiter
from tier_rate_limiter import tier_rate_limiter, AnalysisType

# Import achievement service
from achievements import AchievementService


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Setup templates
templates = Jinja2Templates(directory=str(ROOT_DIR / "templates"))

# SQLite connection (simpler for development)
DB_PATH = ROOT_DIR / 'database.db'

async def init_db():
    """Initialize database with required tables (async)"""
    # Database initialization is now handled by the database adapter
    # This ensures proper async initialization for both SQLite and PostgreSQL
    await db_adapter.init()

# Database initialization will be called in startup event

# Use database adapter instead of direct Database class
db = db_adapter

# Create the main app without a prefix
app = FastAPI()

# Middleware para capturar dados de geolocalização
@app.middleware("http")
async def geolocation_middleware(request: Request, call_next):
    # Capturar IP do cliente
    client_ip = request.client.host
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
    elif "x-real-ip" in request.headers:
        client_ip = request.headers["x-real-ip"]
    
    # Capturar User-Agent
    user_agent = request.headers.get("user-agent", "")
    
    # Processar a requisição
    response = await call_next(request)
    
    # Registrar o acesso (apenas para endpoints relevantes)
    endpoint = str(request.url.path)
    method = request.method
    
    # Filtrar endpoints que queremos rastrear
    if not endpoint.startswith("/static") and not endpoint.endswith(".ico"):
        try:
            geolocation_service.log_access(client_ip, user_agent, endpoint, method)
        except Exception as e:
            # Log do erro mas não interromper a requisição
            print(f"Erro ao registrar acesso: {e}")
    
    return response

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize auth handler
auth_handler = AuthHandler(db)

# Initialize achievement service
achievement_service = AchievementService(db)

# Create auth dependency
get_current_user = create_get_current_user_dependency(db)

# Import AI Models from separate config file to avoid circular imports
from ai_models_config import AI_MODELS

# Temas ENEM predefinidos
ENEM_THEMES = [
    {
        "id": "1",
        "title": "Democratização do acesso ao cinema no Brasil",
        "description": "Analise os desafios e possíveis soluções para democratizar o acesso ao cinema brasileiro.",
        "keywords": ["cinema", "cultura", "democratização", "acesso"]
    },
    {
        "id": "2", 
        "title": "Desafios da saúde mental no Brasil",
        "description": "Discuta os principais desafios relacionados à saúde mental no país e propostas de intervenção.",
        "keywords": ["saúde mental", "prevenção", "tratamento", "políticas públicas"]
    },
    {
        "id": "3",
        "title": "Educação financeira como instrumento de transformação social",
        "description": "Analise a importância da educação financeira na formação cidadã e transformação social.",
        "keywords": ["educação financeira", "cidadania", "transformação social"]
    },
    {
        "id": "4",
        "title": "O papel da tecnologia na educação brasileira",
        "description": "Discuta como a tecnologia pode contribuir para melhorias na educação no Brasil.",
        "keywords": ["tecnologia", "educação", "inovação", "aprendizagem"]
    },
    {
        "id": "5",
        "title": "Sustentabilidade e preservação ambiental no século XXI",
        "description": "Analise os desafios ambientais atuais e a importância da sustentabilidade.",
        "keywords": ["sustentabilidade", "meio ambiente", "preservação", "futuro"]
    }
]

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_essays: int = 0
    average_score: float = 0.0
    level: str = "Iniciante"

class Essay(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    theme_id: str
    theme_title: str
    content: str
    ai_model: str
    score: Optional[float] = None
    feedback: Optional[str] = None
    grammar_errors: Optional[List[Dict]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    corrected_at: Optional[datetime] = None

class CustomTheme(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    keywords: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EssayCorrection(BaseModel):
    essay_id: str
    ai_model: str

# UserCreate removido - agora usamos Google OAuth

from typing import Union

class EssayCreate(BaseModel):
    theme_id: Union[str, int]  # Aceitar tanto string quanto int
    theme_title: str
    content: str
    ai_model: str = "deepseek"
    
    class Config:
        # Permitir campos extras para debug
        extra = "allow"
        
    def __init__(self, **data):
        # Converter theme_id para string se for int
        if 'theme_id' in data and isinstance(data['theme_id'], int):
            data['theme_id'] = str(data['theme_id'])
        super().__init__(**data)

class CustomThemeCreate(BaseModel):
    title: str
    description: str
    keywords: List[str]

# External APIs
async def check_grammar(text: str):
    """Verifica gramática usando LanguageTool"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.languagetool.org/v2/check',
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                data={'text': text, 'language': 'pt-BR'},
                timeout=5.0
            )
            return response.json()
    except Exception as e:
        return {"matches": []}

async def get_wikipedia_info(query: str):
    """Busca informações na Wikipedia"""
    async with httpx.AsyncClient() as client:
        url = f"https://pt.wikipedia.org/api/rest_v1/page/summary/{query}"
        response = await client.get(url)
        return response.json()

async def get_quotable_quote(tags: str = None):
    """Busca citações motivacionais"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = "https://api.quotable.io/random"
            if tags:
                url += f"?tags={tags}"
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            print(f"DEBUG: Citação obtida com sucesso: {data.get('author', 'Autor desconhecido')}")
            return data
    except Exception as e:
        print(f"Erro ao buscar citação: {e}")
        # Citações de fallback educacionais
        fallback_quotes = [
            {"content": "A educação é a arma mais poderosa que você pode usar para mudar o mundo.", "author": "Nelson Mandela"},
            {"content": "O conhecimento é poder.", "author": "Francis Bacon"},
            {"content": "Investir em conhecimento rende sempre os melhores juros.", "author": "Benjamin Franklin"},
            {"content": "A educação é o passaporte para o futuro, pois o amanhã pertence àqueles que se preparam hoje.", "author": "Malcolm X"},
            {"content": "Não há escola igual à vida.", "author": "Provérbio"}
        ]
        import random
        return random.choice(fallback_quotes)

async def get_wikipedia_summary(query: str):
    """Busca informações na Wikipedia"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"https://pt.wikipedia.org/api/rest_v1/page/summary/{query}"
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            print(f"DEBUG: Informação da Wikipedia obtida para: {query}")
            return data
    except Exception as e:
        print(f"Erro ao buscar informação da Wikipedia: {e}")
        return {
            "title": query,
            "extract": "Informação não disponível no momento. Tente novamente mais tarde.",
            "thumbnail": None,
            "content_urls": None
        }

# Old AI correction function removed - now using ai_service module

# Authentication Routes
@api_router.post("/auth/google", response_model=TokenResponse)
async def google_login(token_request: GoogleTokenRequest):
    """Login com Google OAuth"""
    try:
        # Log para debug
        print(f"Recebido token Google: {token_request.token[:20]}...")
        
        # Timeout mais curto para evitar travamentos
        import asyncio
        result = await asyncio.wait_for(
            auth_handler.google_login(token_request),
            timeout=10.0
        )
        return result
    except asyncio.TimeoutError:
        # Se demorar muito, retornar erro específico
        raise HTTPException(
            status_code=504,
            detail="Timeout ao verificar token do Google. Tente novamente."
        )
    except Exception as e:
        # Log do erro
        print(f"Erro no login Google: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail=f"Erro de autenticação: {str(e)}"
        )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: UserAuth = Depends(get_current_user)
):
    """Retorna perfil do usuário autenticado"""
    # Try to get from cache first
    cache_key = CacheKeys.user_profile(current_user.id)
    cached_profile = await cache_manager.get(cache_key)
    
    if cached_profile is not None:
        return UserResponse(**cached_profile)
    
    # Get from auth handler and cache for 15 minutes
    profile = await auth_handler.get_user_profile(current_user)
    await cache_manager.set(cache_key, profile.dict(), expire=900)
    
    return profile

@api_router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_access_token(
    current_user: UserAuth = Depends(get_current_user)
):
    """Gera novo token de acesso"""
    return await auth_handler.refresh_token(current_user)

@api_router.post("/auth/logout")
async def logout():
    """Logout (client-side apenas)"""
    return {"message": "Logout realizado com sucesso"}

@api_router.get("/auth/check-username/{username}")
async def check_username_availability(username: str):
    """Verifica se o nome de usuário está disponível"""
    try:
        if not username or len(username.strip()) < 3:
            raise HTTPException(status_code=400, detail="Nome de usuário deve ter pelo menos 3 caracteres")
        
        # Validar caracteres permitidos (letras, números, underscore, hífen)
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            raise HTTPException(status_code=400, detail="Nome de usuário pode conter apenas letras, números, _ e -")
        
        is_available = await db.check_username_availability(username.strip().lower())
        return {"available": is_available, "username": username.strip().lower()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar disponibilidade do username: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@api_router.put("/auth/username")
async def update_username(
    username_data: dict,
    current_user: UserAuth = Depends(get_current_user)
):
    """Atualiza o nome de usuário do usuário autenticado"""
    try:
        username = username_data.get("username", "").strip().lower()
        
        if not username or len(username) < 3:
            raise HTTPException(status_code=400, detail="Nome de usuário deve ter pelo menos 3 caracteres")
        
        # Validar caracteres permitidos
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            raise HTTPException(status_code=400, detail="Nome de usuário pode conter apenas letras, números, _ e -")
        
        # Verificar disponibilidade
        is_available = await db.check_username_availability(username)
        if not is_available:
            raise HTTPException(status_code=409, detail="Este nome de usuário já está em uso")
        
        # Atualizar username
        success = await db.update_user_username(current_user.id, username)
        if not success:
            raise HTTPException(status_code=500, detail="Erro ao atualizar nome de usuário")
        
        return {"success": True, "username": username, "message": "Nome de usuário atualizado com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar username: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@api_router.get("/auth/test")
async def test_auth_endpoint():
    """Endpoint de teste para verificar se a autenticação está funcionando"""
    return {"message": "Endpoint de autenticação funcionando", "status": "ok"}


# Routes
@api_router.get("/")
async def root():
    return {"message": "Scribo - Plataforma Inteligente de Escrita"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint for monitoring and CI/CD"""
    try:
        # Check database connection using adapter
        db_health = await db.health_check()
        
        # Check if we can import required modules
        import_status = "ok"
        try:
            import fastapi
            import uvicorn
            import sqlite3
        except Exception as e:
            import_status = f"error: {str(e)}"
        
        return {
            "status": "healthy" if db_health.get("status") == "healthy" else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "database": db_health,
            "imports": import_status,
            "environment": os.getenv("ENVIRONMENT", "development")
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

@api_router.get("/models")
async def get_ai_models():
    """Lista modelos de IA disponíveis"""
    return {
        key: {"name": config["name"], "model": config["model"]} 
        for key, config in AI_MODELS.items()
    }

@api_router.get("/ai/health")
async def get_ai_service_health():
    """Get AI service health status"""
    return await ai_service.get_service_health()

@api_router.get("/ai/rate-limit/{user_id}")
async def get_user_rate_limit_status(
    user_id: str,
    current_user: UserAuth = Depends(get_current_user)
):
    """Get rate limit status for user based on tier"""
    # Only allow users to check their own rate limit status
    if user_id != current_user.email and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Você só pode verificar seu próprio status de rate limit")
    
    return await tier_rate_limiter.get_user_status(current_user.email)

# Pydantic models for paragraph analysis
class ParagraphAnalysisRequest(BaseModel):
    content: str
    theme: str
    ai_model: str = "deepseek"
    theme_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None  # Adicionado para dados extras como a posição

# Pydantic models for deep analysis
class DeepAnalysisRequest(BaseModel):
    content: str
    theme: str
    analysis_type: str = "full"
    competency_focus: Optional[str] = None

@api_router.post("/ai/analyze-paragraph")
async def analyze_paragraph(
    request: ParagraphAnalysisRequest,
    current_user: UserAuth = Depends(get_current_user)
):
    """Analyze a paragraph with AI using personalized prompts by university"""
    try:
        # Validate input
        if not request.content or not request.content.strip():
            raise HTTPException(status_code=400, detail="Conteúdo do parágrafo não pode estar vazio")
        
        if len(request.content) > 2000:  # Smaller limit for paragraphs
            raise HTTPException(status_code=400, detail="Parágrafo muito longo (máximo 2.000 caracteres)")
        
        # Try to get theme data for personalized prompts
        theme_data = None
        try:
            # If theme contains theme data (from frontend), parse it
            if isinstance(request.theme, str) and request.theme.startswith('{'):
                import json
                theme_data = json.loads(request.theme)
            elif hasattr(request, 'theme_data') and request.theme_data:
                theme_data = request.theme_data
            else:
                # Construir theme_data básico
                theme_data = {"title": request.theme}
                
            # Garantir que theme_data tenha as informações necessárias
            if not theme_data.get("faculdade"):
                # Tentar detectar faculdade pelo título ou outros campos
                title = theme_data.get("title", request.theme).upper()
                if 'ITA' in title:
                    theme_data["faculdade"] = "ITA"
                elif 'FUVEST' in title:
                    theme_data["faculdade"] = "FUVEST"
                elif 'UNESP' in title:
                    theme_data["faculdade"] = "UNESP"
                elif 'UNIFESP' in title:
                    theme_data["faculdade"] = "UNIFESP"
                elif 'PUC' in title:
                    theme_data["faculdade"] = "PUC-RJ"
                else:
                    theme_data["faculdade"] = "ENEM"
                    
            print(f"[DEBUG] Theme data para análise de parágrafo: {theme_data}")
        except Exception as e:
            print(f"[DEBUG] Erro ao processar theme_data: {e}")
            # If parsing fails, use theme as string
            theme_data = {"title": request.theme, "faculdade": "ENEM"}
        
        # Use the AI service with paragraph analysis type and theme data
        try:
            result = await ai_service.correct_essay(
                content=request.content,
                theme=request.theme if isinstance(request.theme, str) else request.theme.get('title', 'Tema'),
                model_key=request.ai_model,
                user_id=current_user.email,
                analysis_type="paragraph",
                theme_data=theme_data,
                metadata=request.metadata  # Passar metadados para o serviço
            )
            
            return {
                "feedback": result["feedback"],
                "score": result["score"],
                "model": result["model"],
                "processing_time": result["processing_time"],
                "is_fallback": result.get("is_fallback", False),
                "analysis_type": "paragraph"
            }
            
        except RateLimitExceededError as e:
            raise HTTPException(
                status_code=429, 
                detail=f"Limite de análises excedido. Tente novamente em {e.wait_time:.0f} segundos."
            )
        except AIServiceUnavailableError as e:
            raise HTTPException(
                status_code=503,
                detail="Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos."
            )
        except AIServiceError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in paragraph analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno na análise: {str(e)}")

@api_router.post("/deep-analysis")
async def perform_deep_analysis(
    request: dict,  # Changed to dict to accept theme_data
    current_user: UserAuth = Depends(get_current_user)
):
    """Perform deep analysis using multiple AI models for maximum accuracy"""
    try:
        # Extract data from request
        content = request.get("content", "").strip()
        theme = request.get("theme", "")
        analysis_type = request.get("analysis_type", "full")
        competency_focus = request.get("competency_focus")
        theme_data = request.get("theme_data", {})
        
        # Validate input
        if not content:
            raise HTTPException(status_code=400, detail="Conteúdo da redação não pode estar vazio")
        
        if len(content) < 500:
            raise HTTPException(status_code=400, detail="Conteúdo muito curto para análise profunda (mínimo 500 caracteres)")
        
        if len(content) > 15000:
            raise HTTPException(status_code=400, detail="Conteúdo muito longo para análise profunda (máximo 15.000 caracteres)")
        
        # Validate competency focus if provided
        valid_competencies = ['competency1', 'competency2', 'competency3', 'competency4', 'competency5']
        if competency_focus and competency_focus not in valid_competencies:
            raise HTTPException(status_code=400, detail="Competência especificada inválida")
        
        # Ensure theme_data has faculdade information
        if not theme_data.get("faculdade"):
            theme_data["faculdade"] = "ENEM"
            
        print(f"[DEBUG] Deep analysis request - theme_data: {theme_data}")
        
        # Use the deep analysis service
        try:
            result = await deep_analysis_service.analyze_deep(
                content=content,
                theme=theme,
                analysis_type=analysis_type,
                user_id=current_user.email
            )
            
            # Convert the result to a JSON-serializable format
            response_data = {
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
            
            return response_data
            
        except RateLimitExceededError as e:
            raise HTTPException(
                status_code=429, 
                detail=f"Limite de análises profundas excedido. Tente novamente em {e.wait_time:.0f} segundos."
            )
        except AIServiceUnavailableError as e:
            raise HTTPException(
                status_code=503,
                detail="Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos."
            )
        except AIServiceError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in deep analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno na análise profunda: {str(e)}")

@api_router.get("/deep-analysis/comparison")
async def get_deep_analysis_comparison(
    content_hash: str,
    current_user: UserAuth = Depends(get_current_user)
):
    """Get detailed comparison between individual model results for a deep analysis"""
    try:
        # This would require storing the content hash or having the content
        # For now, we'll return a placeholder response
        raise HTTPException(
            status_code=501, 
            detail="Comparação detalhada será implementada em versão futura"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in deep analysis comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno na comparação: {str(e)}")

@api_router.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics and health"""
    return await cache_manager.get_stats()

@api_router.post("/cache/clear")
async def clear_cache():
    """Temporarily added endpoint to clear the entire cache."""
    try:
        # Use invalidate_pattern with a wildcard to clear all keys
        cleared_count = await cache_manager.invalidate_pattern('*')
        return {"message": "Cache cleared successfully.", "keys_removed": cleared_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")

@app.get("/dashboard/tasks", response_class=HTMLResponse)
async def task_dashboard(request: Request):
    """Serve the task dashboard HTML page"""
    return templates.TemplateResponse("task_dashboard.html", {"request": request})

@api_router.get("/themes")
async def get_themes():
    """Lista temas predefinidos do ENEM"""
    # Try to get from cache first
    cache_key = CacheKeys.themes_list()
    cached_themes = await cache_manager.get(cache_key)
    
    if cached_themes is not None:
        return cached_themes
    
    # Cache the themes for 1 hour (3600 seconds)
    await cache_manager.set(cache_key, ENEM_THEMES, expire=3600)
    return ENEM_THEMES

# Rotas de usuários removidas - agora usamos autenticação

@api_router.post("/themes/custom", response_model=CustomTheme)
async def create_custom_theme(
    theme: CustomThemeCreate,
    current_user: UserAuth = Depends(get_current_user)
):
    """Cria tema personalizado"""
    theme_obj = CustomTheme(user_id=current_user.id, **theme.dict())
    await db.insert_custom_theme(theme_obj.dict())
    
    # Invalidate user themes cache
    cache_key = CacheKeys.user_themes(current_user.id)
    await cache_manager.delete(cache_key)
    
    return theme_obj

@api_router.get("/themes/custom")
async def get_user_themes(
    current_user: UserAuth = Depends(get_current_user)
):
    """Lista temas personalizados do usuário"""
    # Try to get from cache first
    cache_key = CacheKeys.user_themes(current_user.id)
    cached_themes = await cache_manager.get(cache_key)
    
    if cached_themes is not None:
        return [CustomTheme(**theme) for theme in cached_themes]
    
    # Get from database and cache for 30 minutes
    themes = await db.find_user_themes(current_user.id)
    await cache_manager.set(cache_key, themes, expire=1800)
    return [CustomTheme(**theme) for theme in themes]

@api_router.get("/analytics/theme-comparison/{theme_title}")
async def get_theme_comparison(
    theme_title: str,
    current_user: UserAuth = Depends(get_current_user)
):
    """Obtém dados de comparação para um tema específico"""
    try:
        # Decode URL-encoded theme title
        import urllib.parse
        decoded_theme = urllib.parse.unquote(theme_title)
        
        comparison_data = await db.get_theme_comparison_data(current_user.id, decoded_theme)
        
        if not comparison_data['user_data']['essay_count']:
            raise HTTPException(
                status_code=404, 
                detail=f"Você ainda não escreveu redações sobre o tema '{decoded_theme}'"
            )
        
        # Generate insights for this theme
        insights = []
        user_data = comparison_data['user_data']
        theme_data = comparison_data['theme_data']
        
        # Performance insight
        if user_data['avg_score'] > theme_data['avg_score']:
            difference = user_data['avg_score'] - theme_data['avg_score']
            insights.append({
                'type': 'strength',
                'title': f'Você está {difference:.1f} pontos acima da média neste tema',
                'description': f'Sua pontuação média de {user_data["avg_score"]:.1f} supera a média de {theme_data["avg_score"]:.1f} dos outros usuários.'
            })
        elif theme_data['avg_score'] > user_data['avg_score']:
            difference = theme_data['avg_score'] - user_data['avg_score']
            insights.append({
                'type': 'improvement',
                'title': f'Oportunidade de melhoria de {difference:.1f} pontos',
                'description': f'A média dos outros usuários é {theme_data["avg_score"]:.1f}, enquanto a sua é {user_data["avg_score"]:.1f}.'
            })
        
        # Percentile insight
        if user_data['percentile'] >= 75:
            insights.append({
                'type': 'strength',
                'title': f'Você está no top {100 - user_data["percentile"]}% neste tema',
                'description': f'Sua performance supera {user_data["percentile"]}% dos usuários que escreveram sobre este tema.'
            })
        elif user_data['percentile'] <= 25:
            insights.append({
                'type': 'improvement',
                'title': 'Há espaço para crescimento neste tema',
                'description': f'Você está no percentil {user_data["percentile"]}. Com mais prática, pode melhorar significativamente.'
            })
        
        # Experience insight
        if user_data['essay_count'] >= 3:
            insights.append({
                'type': 'info',
                'title': f'Você tem experiência sólida neste tema',
                'description': f'Com {user_data["essay_count"]} redações escritas, você já desenvolveu familiaridade com este assunto.'
            })
        elif user_data['essay_count'] == 1:
            insights.append({
                'type': 'info',
                'title': 'Primeira experiência com este tema',
                'description': 'Continue praticando este tema para desenvolver maior domínio e consistência.'
            })
        
        # Competency insights
        if user_data['competencies'] and theme_data['competencies']:
            best_competency = max(user_data['competencies'].items(), key=lambda x: x[1] - theme_data['competencies'].get(x[0], 0), default=None)
            if best_competency and best_competency[0] in theme_data['competencies']:
                comp_name = best_competency[0].replace('competency', 'Competência ')
                difference = best_competency[1] - theme_data['competencies'][best_competency[0]]
                if difference > 10:
                    insights.append({
                        'type': 'strength',
                        'title': f'Destaque em {comp_name} neste tema',
                        'description': f'Sua {comp_name} está {difference:.1f} pontos acima da média para este tema.'
                    })
        
        comparison_data['insights'] = insights
        return comparison_data
        
    except Exception as e:
        logger.error(f"Error getting theme comparison: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@api_router.post("/essays")
async def create_essay(
    essay: EssayCreate,
    current_user: dict = Depends(get_current_user)
):
    """Cria nova redação com transação e validação otimizada"""
    try:
        print(f"DEBUG: Criando redação para usuário: {current_user.email}")
        print(f"DEBUG: Dados da redação: {essay.dict()}")
        
        # Validate essay content length
        if len(essay.content.strip()) < 50:
            raise HTTPException(status_code=400, detail="Conteúdo da redação muito curto (mínimo 50 caracteres)")
        
        if len(essay.content) > 10000:
            raise HTTPException(status_code=400, detail="Conteúdo da redação muito longo (máximo 10.000 caracteres)")
        
        # Primeiro verifica gramática de forma assíncrona
        grammar_check = await check_grammar(essay.content)
        
        # Adiciona user_id automaticamente - usar email como identificador
        essay_data = essay.dict()
        essay_data["user_id"] = current_user.email
        essay_data["id"] = str(uuid.uuid4())
        essay_data["created_at"] = datetime.utcnow().isoformat()
        essay_data["grammar_errors"] = grammar_check.get("matches", [])
        
        print(f"DEBUG: Dados finais da redação: {essay_data}")
        
        # Insert essay with proper async handling and transaction support
        # The database adapter handles transactions internally
        result = await db.insert_essay(essay_data)
        
        print(f"DEBUG: Redação inserida com sucesso, ID: {essay_data['id']}")
        
        # Invalidate user essays cache after creating new essay (all pages)
        # Since we don't know which pages exist, we'll use a pattern-based invalidation
        cache_pattern = f"user:essays:{current_user.email}:*"
        await cache_manager.invalidate_pattern(cache_pattern)
        
        # Also invalidate user stats cache since essay count changed
        stats_cache_key = f"user:stats:{current_user.email}"
        await cache_manager.delete(stats_cache_key)
        
        return {
            "id": essay_data["id"],
            "user_id": essay_data["user_id"],
            "theme_id": essay_data["theme_id"],
            "theme_title": essay_data["theme_title"],
            "content": essay_data["content"],
            "ai_model": essay_data["ai_model"],
            "created_at": essay_data["created_at"],
            "grammar_errors": essay_data["grammar_errors"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao criar redação: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao criar redação: {str(e)}")

@api_router.post("/essays/{essay_id}/correct")
async def correct_essay(
    essay_id: str, 
    correction: EssayCorrection,
    current_user: UserAuth = Depends(get_current_user)
):
    """Corrige redação com IA usando o novo serviço otimizado"""
    try:
        essay = await db.get_essay(essay_id)
        if not essay:
            raise HTTPException(status_code=404, detail="Redação não encontrada")
        
        # Verify user owns the essay
        if essay["user_id"] != current_user.email and essay["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Você não tem permissão para corrigir esta redação")
        
        # Tentar obter dados do tema para detecção de faculdade
        theme_data = None
        try:
            # Construir theme_data baseado nas informações disponíveis
            theme_data = {
                "title": essay["theme_title"],
                "theme_id": essay.get("theme_id", "")
            }
            
            # Usar o mesmo mapeamento do SystemPromptsManager
            try:
                theme_id_num = int(essay.get("theme_id", 0))
                # Mapeamento baseado nos JSONs reais
                if 32 <= theme_id_num <= 47:  # ITA
                    theme_data["faculdade"] = "ITA"
                elif 48 <= theme_id_num <= 70:  # FUVEST
                    theme_data["faculdade"] = "FUVEST"
                elif 71 <= theme_id_num <= 90:  # UNESP
                    theme_data["faculdade"] = "UNESP"
                elif 91 <= theme_id_num <= 110:  # UNIFESP
                    theme_data["faculdade"] = "UNIFESP"
                elif 111 <= theme_id_num <= 130:  # PUC-RJ
                    theme_data["faculdade"] = "PUC-RJ"
                elif 1 <= theme_id_num <= 31:  # ENEM
                    theme_data["faculdade"] = "ENEM"
                else:
                    theme_data["faculdade"] = "ENEM"  # Default
            except (ValueError, TypeError):
                theme_data["faculdade"] = "ENEM"
                
            print(f"[DEBUG] Theme data construído para correção: {theme_data}")
        except Exception as e:
            print(f"[DEBUG] Erro ao construir theme_data: {e}")
            theme_data = {"title": essay["theme_title"], "faculdade": "ENEM"}

        # Use the new AI service with rate limiting and optimizations
        try:
            result = await ai_service.correct_essay(
                content=essay["content"],
                theme=essay["theme_title"],
                model_key=correction.ai_model,
                user_id=current_user.email,
                analysis_type="full",
                theme_data=theme_data
            )
            
            feedback = result["feedback"]
            score = result["score"]
            
            # Update essay with correction results
            await db.update_essay(essay_id, {
                "feedback": feedback,
                "score": score,
                "corrected_at": datetime.utcnow().isoformat(),
                "ai_model": correction.ai_model
            })
            
            # Invalidate caches
            essay_cache_key = CacheKeys.essay_detail(essay_id)
            await cache_manager.delete(essay_cache_key)
            
            user_essays_pattern = f"user:essays:{current_user.email}:*"
            await cache_manager.invalidate_pattern(user_essays_pattern)
            
            stats_cache_key = f"user:stats:{current_user.email}"
            await cache_manager.delete(stats_cache_key)
            
            return {
                "message": "Redação corrigida com sucesso",
                "score": score,
                "feedback": feedback,
                "model": result["model"],
                "processing_time": result["processing_time"],
                "is_fallback": result.get("is_fallback", False)
            }
            
        except RateLimitExceededError as e:
            raise HTTPException(
                status_code=429, 
                detail=f"Limite de correções excedido. Tente novamente em {e.wait_time:.0f} segundos."
            )
        except AIServiceUnavailableError as e:
            raise HTTPException(
                status_code=503,
                detail="Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos."
            )
        except AIServiceError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in essay correction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno na correção: {str(e)}")

@api_router.get("/essays/my")
async def get_user_essays(
    page: int = 1,
    size: int = 10,
    current_user: UserAuth = Depends(get_current_user)
):
    """Lista redações do usuário autenticado com paginação otimizada"""
    try:
        # Validate pagination parameters
        if page < 1:
            page = 1
        if size < 1 or size > 100:  # Limit max size to prevent abuse
            size = 10
        
        # Try to get from cache first
        cache_key = CacheKeys.user_essays(current_user.email, page, size)
        cached_essays = await cache_manager.get(cache_key)
        
        if cached_essays is not None:
            print(f"DEBUG: Cache hit - retornando {len(cached_essays)} redações do cache")
            return cached_essays
        
        print(f"DEBUG: Cache miss - buscando redações para usuário: {current_user.email} (página {page}, tamanho {size})")
        
        # Use optimized pagination query to avoid N+1 problems
        essays = await db.get_user_essays(current_user.email, page, size)
        print(f"DEBUG: Encontradas {len(essays)} redações")
        
        # Cache for 10 minutes
        await cache_manager.set(cache_key, essays, expire=600)
        
        return essays
    except Exception as e:
        print(f"ERRO ao buscar redações: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar redações: {str(e)}")

@api_router.get("/essays/{essay_id}")
async def get_essay_by_id(essay_id: str):
    """Busca redação por ID"""
    if essay_id == "my":
        # Invalid essay ID
        raise HTTPException(status_code=400, detail="ID de redação inválido")
    
    # Try to get from cache first
    cache_key = CacheKeys.essay_detail(essay_id)
    cached_essay = await cache_manager.get(cache_key)
    
    if cached_essay is not None:
        return Essay(**cached_essay)
    
    essay = await db.get_essay(essay_id)
    if not essay:
        raise HTTPException(status_code=404, detail="Redação não encontrada")
    
    # Cache for 30 minutes
    await cache_manager.set(cache_key, essay, expire=1800)
    
    return Essay(**essay)


@api_router.get("/stats/my")
async def get_user_stats(
    current_user: UserAuth = Depends(get_current_user)
):
    """Estatísticas detalhadas do usuário - otimizado com single query"""
    try:
        # Use authenticated user's email as user_id
        user_id = current_user.email
        
        # Try to get from cache first
        cache_key = f"user:stats:{user_id}"
        cached_stats = await cache_manager.get(cache_key)
        
        if cached_stats is not None:
            return cached_stats
        
        # Use optimized single query to get all user statistics
        stats = await db.get_user_essay_count(user_id)
        
        if stats['total_essays'] == 0:
            result = {
                "total_essays": 0,
                "average_score": 0,
                "best_score": 0,
                "worst_score": 0,
                "progress": [],
                "score_distribution": [],
                "level": "Iniciante"
            }
            # Cache empty stats for 5 minutes
            await cache_manager.set(cache_key, result, expire=300)
            return result
        
        # Get scored essays for detailed analysis
        essays = await db.get_scored_essays(user_id)
        scores = [essay["score"] for essay in essays if essay.get("score")]
        
        # Progresso ao longo do tempo - optimized sorting
        progress = []
        for essay in sorted(essays, key=lambda x: x["created_at"]):
            if essay.get("score"):
                # created_at já é string no SQLite
                created_at = essay["created_at"]
                if hasattr(created_at, 'isoformat'):
                    created_at = created_at.isoformat()
                
                progress.append({
                    "date": created_at,
                    "score": essay["score"],
                    "theme": essay.get("theme_title", essay.get("theme", "Sem tema"))
                })
        
        # Distribuição de notas - optimized calculation
        score_ranges = [
            (0, 200, "Muito Baixo"),
            (200, 400, "Baixo"), 
            (400, 600, "Regular"),
            (600, 800, "Bom"),
            (800, 1000, "Excelente")
        ]
        
        distribution = []
        for min_score, max_score, label in score_ranges:
            count = len([s for s in scores if min_score <= s < max_score])
            distribution.append({"range": label, "count": count})
        
        # Nível do usuário baseado na média
        avg_score = stats['avg_score'] or 0
        if avg_score >= 800:
            level = "Avançado"
        elif avg_score >= 600:
            level = "Intermediário"
        else:
            level = "Iniciante"
        
        result = {
            "total_essays": stats['total_essays'],
            "average_score": round(avg_score, 1),
            "best_score": stats['best_score'] or 0,
            "worst_score": stats['worst_score'] or 0,
            "progress": progress,
            "score_distribution": distribution,
            "level": level
        }
        
        # Cache for 15 minutes
        await cache_manager.set(cache_key, result, expire=900)
        return result
        
    except Exception as e:
        print(f"ERRO ao buscar estatísticas: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas: {str(e)}")

# Ranking system removed - not needed for current version
    pipeline = [
        {
            "$lookup": {
                "from": "essays",
                "localField": "id",
                "foreignField": "user_id",
                "as": "essays"
            }
        },
        {
            "$addFields": {
                "scored_essays": {
                    "$filter": {
                        "input": "$essays",
                        "cond": {"$ne": ["$$this.score", None]}
                    }
                }
            }
        },
        {
            "$addFields": {
                "avg_score": {"$avg": "$scored_essays.score"},
                "total_essays": {"$size": "$scored_essays"}
            }
        },
        {
            "$match": {"total_essays": {"$gt": 0}}
        },
        {
            "$sort": {"avg_score": -1}
        },
        {
            "$limit": 50
        }
    ]
    
    # Try to get from cache first
    cache_key = "global:ranking"
    cached_ranking = await cache_manager.get(cache_key)
    
    if cached_ranking is not None:
        return cached_ranking
    
    # Use optimized single query to get ranking data
    ranking = await db.get_user_ranking()
    
    result = []
    for i, user in enumerate(ranking):
        # Usar nickname se disponível, senão name, senão fallback
        display_name = user.get("nickname") or user.get("name", f"Usuário {user['user_id'][:8]}")
        
        result.append({
            "id": user['user_id'],
            "position": i + 1,
            "name": display_name,
            "nickname": user.get("nickname"),
            "average_score": round(user["avg_score"], 1),
            "total_essays": user.get("essay_count", 0),
            "level": "Avançado" if user["avg_score"] >= 800 else "Intermediário" if user["avg_score"] >= 600 else "Iniciante"
        })
    
    # Cache for 30 minutes
    await cache_manager.set(cache_key, result, expire=1800)
    
    return result

@api_router.get("/wikipedia/{query}")
async def search_wikipedia(query: str):
    """Busca na Wikipedia"""
    try:
        result = await get_wikipedia_summary(query)
        print(f"DEBUG: Retornando informação da Wikipedia para: {query}")
        return result
    except Exception as e:
        print(f"Erro no endpoint da Wikipedia: {e}")
        return {
            "title": query,
            "extract": "Informação não disponível no momento. Tente novamente mais tarde.",
            "thumbnail": None,
            "content_urls": None
        }

quote_cache = None

async def update_quote_cache():
    global quote_cache
    quote_cache = await get_quotable_quote("education,motivation")

@app.on_event("startup")
async def startup_event():
    # Initialize database with async function
    await init_db()
    # Initialize cache connection
    await cache_manager.connect()
    # Initialize task queue system
    await task_queue.connect()
    # Register task handlers
    register_task_handlers(task_queue)
    # Start background workers
    await task_queue.start_workers(num_workers=3)
    asyncio.create_task(update_quote_cache())

@app.on_event("shutdown")
async def shutdown_event():
    # Stop task queue workers
    await task_queue.stop_workers()
    # Close task queue connection
    await task_queue.disconnect()
    # Close database adapter
    await db.close()
    # Close cache connection
    await cache_manager.disconnect()

@api_router.get("/quotes")
async def get_quotes(tags: str = None):
    """Busca citações motivacionais"""
    # Use cache for quotes
    cache_key = f"quotes:{tags or 'default'}"
    cached_quote = await cache_manager.get(cache_key)
    
    if cached_quote is not None:
        print(f"DEBUG: Cache hit para citação")
        return cached_quote
    
    # Fallback to global cache for education,motivation
    global quote_cache
    if tags == "education,motivation" and quote_cache:
        await cache_manager.set(cache_key, quote_cache, expire=3600)
        return quote_cache
    
    try:
        result = await get_quotable_quote(tags)
        print(f"DEBUG: Retornando citação: {result.get('author', 'Autor desconhecido')}")
        
        # Cache for 1 hour
        await cache_manager.set(cache_key, result, expire=3600)
        
        return result
    except Exception as e:
        print(f"Erro no endpoint de citações: {e}")
        fallback_quote = {
            "content": "A educação é a arma mais poderosa que você pode usar para mudar o mundo.",
            "author": "Nelson Mandela"
        }
        
        # Cache fallback for 10 minutes
        await cache_manager.set(cache_key, fallback_quote, expire=600)
        
        return fallback_quote

# Endpoint removido - agora usando apenas Dicionário Aberto no frontend

async def update_user_stats(user_id: str):
    """Atualiza estatísticas do usuário"""
    essays = await db.get_scored_essays(user_id)
    
    if essays:
        scores = [essay["score"] for essay in essays if essay.get("score")]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        level = "Avançado" if avg_score >= 800 else "Intermediário" if avg_score >= 600 else "Iniciante"
        
        await db.update_user_stats(user_id, {
            "total_essays": len(essays),
            "avg_score": avg_score,
            "level": level
        })

@api_router.delete("/essays/{essay_id}")
async def delete_essay(
    essay_id: str,
    current_user: UserAuth = Depends(get_current_user)
):
    """Exclui uma redação com transação e validação otimizada"""
    try:
        # Primeiro verificar se a redação existe e pertence ao usuário
        essay = await db.get_essay(essay_id)
        if not essay:
            raise HTTPException(status_code=404, detail="Redação não encontrada")
        
        # Verificar se o usuário é o dono da redação (compatibilidade com diferentes formatos de user_id)
        print(f"DEBUG DELETE: essay user_id: '{essay['user_id']}', current_user.id: '{current_user.id}', current_user.email: '{current_user.email}'")
        
        # Múltiplas verificações para compatibilidade com redações antigas
        is_owner = (
            essay["user_id"] == current_user.id or 
            essay["user_id"] == current_user.email or
            essay["user_id"] == getattr(current_user, 'sub', None) or
            # Para redações muito antigas que podem ter sido salvas com email
            (hasattr(current_user, 'email') and essay["user_id"] == current_user.email) or
            # Verificação adicional para Google IDs
            (essay["user_id"] and current_user.email and essay["user_id"].endswith(current_user.email.split('@')[1]))
        )
        
        print(f"DEBUG DELETE: is_owner = {is_owner}")
        
        if not is_owner:
            print(f"DEBUG: Tentativa de exclusão negada - usuário não é o dono")
            raise HTTPException(status_code=403, detail="Você não tem permissão para excluir esta redação")
        
        # Excluir a redação usando transação (handled by database adapter)
        deleted = await db.delete_essay(essay_id)
        
        if deleted:
            # Invalidate essay cache after deletion
            essay_cache_key = CacheKeys.essay_detail(essay_id)
            await cache_manager.delete(essay_cache_key)
            
            # Invalidate user essays cache (all pages)
            user_essays_pattern = f"user:essays:{current_user.email}:*"
            await cache_manager.invalidate_pattern(user_essays_pattern)
            
            # Invalidate user stats cache since essay count changed
            stats_cache_key = f"user:stats:{current_user.email}"
            await cache_manager.delete(stats_cache_key)
            
            # Invalidate global ranking cache since user stats may have changed
            await cache_manager.delete("global:ranking")
            
            return {"message": "Redação excluída com sucesso", "essay_id": essay_id}
        else:
            raise HTTPException(status_code=500, detail="Erro ao excluir redação")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao excluir redação: {str(e)}")

# Deep Analysis Endpoints
from deep_analysis import deep_analysis_service, DeepAnalysisResult, AnalysisReliability

@api_router.post("/essays/{essay_id}/deep-analysis")
async def deep_analyze_essay(
    essay_id: str,
    current_user: UserAuth = Depends(get_current_user)
):
    """Perform deep analysis of an essay using multiple AI models"""
    try:
        # Get the essay
        essay = await db.get_essay(essay_id)
        if not essay:
            raise HTTPException(status_code=404, detail="Redação não encontrada")
        
        # Verify user owns the essay
        if essay["user_id"] != current_user.email and essay["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Você não tem permissão para analisar esta redação")
        
        # Perform deep analysis
        try:
            result = await deep_analysis_service.analyze_deep(
                content=essay["content"],
                theme=essay["theme_title"],
                analysis_type="full",
                user_id=current_user.email
            )
            
            # Update essay with deep analysis results
            await db.update_essay(essay_id, {
                "deep_analysis_feedback": result.final_feedback,
                "deep_analysis_score": result.final_score,
                "deep_analysis_reliability": result.consensus_metrics.reliability_level.value,
                "deep_analysis_at": datetime.utcnow().isoformat()
            })
            
            # Invalidate caches
            essay_cache_key = CacheKeys.essay_detail(essay_id)
            await cache_manager.delete(essay_cache_key)
            
            return {
                "message": "Análise profunda concluída com sucesso",
                "analysis_id": result.content_hash,
                "final_score": result.final_score,
                "final_feedback": result.final_feedback,
                "reliability": {
                    "level": result.consensus_metrics.reliability_level.value,
                    "agreement_percentage": result.consensus_metrics.agreement_percentage,
                    "models_used": len([r for r in result.model_results if r.success])
                },
                "processing_time": result.processing_time,
                "models_summary": [
                    {
                        "model": r.model,
                        "success": r.success,
                        "score": r.score,
                        "is_outlier": r.model in result.consensus_metrics.outlier_models
                    } for r in result.model_results
                ]
            }
            
        except RateLimitExceededError as e:
            raise HTTPException(
                status_code=429,
                detail=f"Limite de análises profundas excedido. Tente novamente em {e.wait_time:.0f} segundos."
            )
        except Exception as e:
            logger.error(f"Deep analysis error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro na análise profunda: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in deep analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno na análise profunda: {str(e)}")

@api_router.post("/essays/{essay_id}/enhanced-deep-analysis")
async def enhanced_deep_analyze_essay(
    essay_id: str,
    current_user: UserAuth = Depends(get_current_user)
):
    """Perform enhanced deep analysis of an essay using the two-phase system (Análise Profunda Aprimorada)"""
    try:
        # Check if user has access to enhanced deep analysis (Premium/Lifetime only)
        user_tier = current_user.get("tier", "free")
        if user_tier == "free":
            raise HTTPException(
                status_code=403,
                detail="Enhanced deep analysis is only available for Premium and Lifetime users"
            )
        
        # Get the essay
        essay = await db.get_essay(essay_id)
        if not essay:
            raise HTTPException(status_code=404, detail="Redação não encontrada")
        
        # Verify user owns the essay
        if essay["user_id"] != current_user.email and essay["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Você não tem permissão para analisar esta redação")
        
        # Get theme data if available for exam type detection
        theme_data = None
        try:
            # Try to construct theme_data from essay information
            theme_data = {
                "title": essay["theme_title"],
                "theme_id": essay.get("theme_id", "")
            }
            
            # Detect exam type based on theme_id (same logic as correction)
            try:
                theme_id_num = int(essay.get("theme_id", 0))
                if 32 <= theme_id_num <= 47:  # ITA
                    theme_data["faculdade"] = "ITA"
                elif 48 <= theme_id_num <= 70:  # FUVEST
                    theme_data["faculdade"] = "FUVEST"
                elif 71 <= theme_id_num <= 90:  # UNESP
                    theme_data["faculdade"] = "UNESP"
                elif 91 <= theme_id_num <= 110:  # UNIFESP
                    theme_data["faculdade"] = "UNIFESP"
                elif 111 <= theme_id_num <= 130:  # PUC-RJ
                    theme_data["faculdade"] = "PUC-RJ"
                elif 1 <= theme_id_num <= 31:  # ENEM
                    theme_data["faculdade"] = "ENEM"
                else:
                    theme_data["faculdade"] = "ENEM"  # Default
            except (ValueError, TypeError):
                theme_data["faculdade"] = "ENEM"
                
            logger.info(f"Enhanced deep analysis theme data: {theme_data}")
        except Exception as e:
            logger.warning(f"Error constructing theme_data for enhanced analysis: {e}")
            theme_data = {"title": essay["theme_title"], "faculdade": "ENEM"}
        
        # Perform enhanced deep analysis using the two-phase system
        try:
            result = await enhanced_deep_analysis_service.analyze_enhanced_deep(
                content=essay["content"],
                theme=essay["theme_title"],
                analysis_type="full",
                user_id=current_user.email,
                theme_data=theme_data
            )
            
            # Update essay with enhanced deep analysis results (REPLACES existing deep_analysis_feedback)
            # As specified in the plan, the Llama 49B synthesis replaces the existing content
            await db.update_essay(essay_id, {
                "deep_analysis_feedback": result.phase2_result.consolidated_feedback,  # Llama 49B synthesis replaces existing
                "deep_analysis_score": result.phase2_result.final_score,
                "deep_analysis_reliability": result.phase2_result.reliability_level,
                "deep_analysis_at": datetime.utcnow().isoformat()
            })
            
            # Invalidate caches
            essay_cache_key = CacheKeys.essay_detail(essay_id)
            await cache_manager.delete(essay_cache_key)
            
            return {
                "message": "Análise profunda aprimorada concluída com sucesso",
                "analysis_id": result.content_hash,
                "final_score": result.phase2_result.final_score,
                "final_feedback": result.phase2_result.consolidated_feedback,
                "exam_type": result.exam_type,
                "reliability": {
                    "level": result.phase2_result.reliability_level,
                    "phase1_models": result.phase1_results.successful_models,
                    "phase2_success": result.phase2_result.success
                },
                "processing_time": result.total_processing_time,
                "phase_details": {
                    "phase1": {
                        "processing_time": result.phase1_results.processing_time,
                        "successful_models": result.phase1_results.successful_models,
                        "kimi_success": result.phase1_results.kimi_result.success if result.phase1_results.kimi_result else False,
                        "qwen_success": result.phase1_results.qwen_result.success if result.phase1_results.qwen_result else False,
                        "deepseek_success": result.phase1_results.deepseek_result.success if result.phase1_results.deepseek_result else False
                    },
                    "phase2": {
                        "processing_time": result.phase2_result.processing_time,
                        "success": result.phase2_result.success,
                        "model": "llama_49b"
                    }
                }
            }
            
        except RateLimitExceededError as e:
            raise HTTPException(
                status_code=429,
                detail=f"Limite de análises profundas aprimoradas excedido. Tente novamente em {e.wait_time:.0f} segundos."
            )
        except Exception as e:
            logger.error(f"Enhanced deep analysis error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro na análise profunda aprimorada: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in enhanced deep analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno na análise profunda aprimorada: {str(e)}")

@api_router.post("/analyze/deep")
async def deep_analyze_content(
    request: dict,
    current_user: UserAuth = Depends(get_current_user)
):
    """Perform deep analysis on arbitrary content using multiple AI models"""
    try:
        content = request.get("content", "").strip()
        theme = request.get("theme", "").strip()
        analysis_type = request.get("analysis_type", "full")
        
        if not content:
            raise HTTPException(status_code=400, detail="Conteúdo não pode estar vazio")
        
        if not theme:
            raise HTTPException(status_code=400, detail="Tema não pode estar vazio")
        
        if analysis_type not in ["full", "paragraph"]:
            raise HTTPException(status_code=400, detail="Tipo de análise deve ser 'full' ou 'paragraph'")
        
        # Validate content length
        max_length = 2000 if analysis_type == "paragraph" else 10000
        if len(content) > max_length:
            raise HTTPException(
                status_code=400, 
                detail=f"Conteúdo muito longo (máximo {max_length} caracteres para análise {analysis_type})"
            )
        
        # Perform deep analysis
        try:
            result = await deep_analysis_service.analyze_deep(
                content=content,
                theme=theme,
                analysis_type=analysis_type,
                user_id=current_user.email
            )
            
            return {
                "analysis_id": result.content_hash,
                "final_score": result.final_score,
                "final_feedback": result.final_feedback,
                "analysis_type": result.analysis_type,
                "reliability": {
                    "level": result.consensus_metrics.reliability_level.value,
                    "agreement_percentage": result.consensus_metrics.agreement_percentage,
                    "score_std_dev": result.consensus_metrics.score_std_dev,
                    "outlier_models": result.consensus_metrics.outlier_models
                },
                "model_results": [
                    {
                        "model": r.model,
                        "success": r.success,
                        "score": r.score,
                        "processing_time": r.processing_time,
                        "error": r.error,
                        "is_outlier": r.model in result.consensus_metrics.outlier_models
                    } for r in result.model_results
                ],
                "reliability_report": result.reliability_report,
                "processing_time": result.processing_time,
                "timestamp": result.timestamp
            }
            
        except RateLimitExceededError as e:
            raise HTTPException(
                status_code=429,
                detail=f"Limite de análises profundas excedido. Tente novamente em {e.wait_time:.0f} segundos."
            )
        except Exception as e:
            logger.error(f"Deep analysis error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro na análise profunda: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in deep content analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno na análise profunda: {str(e)}")

@api_router.get("/analyze/deep/{analysis_id}/comparison")
async def get_deep_analysis_comparison(
    analysis_id: str,
    current_user: UserAuth = Depends(get_current_user)
):
    """Get detailed comparison of models for a deep analysis"""
    try:
        # For now, we'll need to reconstruct from cache using content hash
        # In a production system, you might want to store analysis_id mappings
        
        # This is a simplified implementation - in practice you'd want to store
        # the mapping between analysis_id and the original content/theme
        raise HTTPException(
            status_code=501, 
            detail="Comparação detalhada será implementada em versão futura. Use o endpoint de análise direta."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting deep analysis comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter comparação: {str(e)}")

@api_router.get("/ai/deep-analysis/health")
async def get_deep_analysis_health():
    """Get health status of deep analysis service"""
    try:
        # Get AI service health
        ai_health = await ai_service.get_service_health()
        
        # Calculate deep analysis specific metrics
        available_models = sum(1 for model in ai_health["models"].values() if model["available"])
        total_models = len(ai_health["models"])
        
        deep_analysis_status = "healthy"
        if available_models == 0:
            deep_analysis_status = "unhealthy"
        elif available_models < 2:  # Need at least 2 models for meaningful consensus
            deep_analysis_status = "degraded"
        elif available_models < total_models:
            deep_analysis_status = "partial"
        
        return {
            "status": deep_analysis_status,
            "available_models": available_models,
            "total_models": total_models,
            "models": ai_health["models"],
            "cache_connected": ai_health["cache_connected"],
            "consensus_capable": available_models >= 2,
            "high_reliability_capable": available_models >= 3,
            "service_info": {
                "max_concurrent_models": deep_analysis_service.config["max_concurrent_models"],
                "consensus_threshold": deep_analysis_service.config["consensus_threshold"],
                "cache_ttl": deep_analysis_service.config["cache_ttl"]
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting deep analysis health: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "available_models": 0,
            "total_models": 0
        }

# Achievement Routes
@api_router.get("/achievements/my")
async def get_my_achievements(
    current_user: UserAuth = Depends(get_current_user)
):
    """Get achievements for the current authenticated user."""
    try:
        user_id = current_user.email  # Using email as the user identifier
        achievements = await achievement_service.get_user_achievements(user_id)
        return {"achievements": achievements}
    except Exception as e:
        logger.error(f"Error getting user achievements: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user achievements.")

# Include the routers in the main app
app.include_router(api_router)
app.include_router(task_router)
app.include_router(tier_router)


# Middleware para capturar todas as requisições - REMOVIDO TEMPORARIAMENTE
# Conflito com outros middlewares causando problemas

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://scribo-delta.vercel.app",
        "https://scribo-j03w.onrender.com",
        "https://scribo-bay.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    pass  # SQLite não precisa fechar conexão global

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)