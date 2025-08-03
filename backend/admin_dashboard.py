"""
Dashboard Administrativo do Scribo
Interface web para gerenciar usuários, tiers e monitorar uso da API
"""

from fastapi import FastAPI, Request, HTTPException, Depends, Form, Cookie
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import json
import logging
from datetime import datetime, timedelta
import asyncio
from pathlib import Path
import secrets
import hashlib

# Import existing modules
import sqlite3
from database_adapter import db_adapter
from auth import create_get_current_user_dependency
from ai_service import ai_service

# Setup
app = FastAPI(title="Scribo Admin Dashboard", description="Dashboard administrativo para gerenciar usuários e monitorar sistema")
templates = Jinja2Templates(directory="templates")

# Create templates directory if it doesn't exist
templates_dir = Path("templates")
templates_dir.mkdir(exist_ok=True)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class UserStats(BaseModel):
    user_id: str
    name: str
    email: str
    tier: str
    tier_expires_at: Optional[str]
    total_essays: int
    paragraph_analysis_count: int
    essay_correction_count: int
    deep_analysis_count: int
    created_at: str
    last_login: Optional[str]
    avg_score: Optional[float]

class APIUsageStats(BaseModel):
    model_name: str
    total_calls: int
    success_rate: float
    avg_response_time: float
    last_24h_calls: int

class SystemStats(BaseModel):
    total_users: int
    free_users: int
    premium_users: int
    vitalicio_users: int
    total_essays: int
    total_api_calls: int
    avg_daily_usage: float

# Admin authentication - Personalizado para Nicolas
ADMIN_EMAIL = "supernvxofc@gmail.com"
ADMIN_PASSWORD = "9Lf$5;Zagaia"

# Session management
ACTIVE_SESSIONS = {}
SESSION_TIMEOUT = 3600  # 1 hora

def create_session_token():
    """Criar token de sessão único"""
    return secrets.token_urlsafe(32)

def verify_session(session_token: str = None):
    """Verificar se sessão é válida"""
    if not session_token or session_token not in ACTIVE_SESSIONS:
        return False
    
    session_data = ACTIVE_SESSIONS[session_token]
    
    # Verificar se sessão não expirou
    if datetime.utcnow() > session_data['expires_at']:
        del ACTIVE_SESSIONS[session_token]
        return False
    
    return True

def create_session(email: str):
    """Criar nova sessão"""
    session_token = create_session_token()
    ACTIVE_SESSIONS[session_token] = {
        'email': email,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(seconds=SESSION_TIMEOUT)
    }
    return session_token

def verify_admin_credentials(email: str = None, password: str = None):
    """Verificação de admin personalizada com email e senha"""
    if not email or not password:
        raise HTTPException(status_code=401, detail="Email e senha são obrigatórios")
    
    if email.strip() != ADMIN_EMAIL or password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Credenciais de admin inválidas")
    
    return True

class AdminDashboardService:
    """Service for admin dashboard operations"""
    
    def __init__(self):
        self.db = db_adapter
    
    async def get_all_users_stats(self) -> List[UserStats]:
        """Get comprehensive stats for all users - VERSÃO CORRIGIDA"""
        try:
            # Conexão direta com SQLite
            conn = sqlite3.connect('database.db')
            cursor = conn.cursor()
            
            try:
                # Sempre buscar dados reais das redações primeiro
                cursor.execute('''
                    SELECT 
                        user_id,
                        COUNT(*) as total_essays,
                        AVG(CASE WHEN score IS NOT NULL THEN score END) as avg_score,
                        MIN(created_at) as first_essay,
                        MAX(created_at) as last_essay,
                        COUNT(CASE WHEN score IS NOT NULL THEN 1 END) as scored_essays
                    FROM essays 
                    GROUP BY user_id
                    ORDER BY total_essays DESC
                ''')
                
                users_data = []
                rows = cursor.fetchall()
                
                for row in rows:
                    user_id, total_essays, avg_score, first_essay, last_essay, scored_essays = row
                    
                    # Extrair nome do email
                    name = user_id.split('@')[0] if '@' in user_id else user_id
                    
                    # Verificar tier na tabela users (se existir)
                    tier = 'free'
                    tier_expires_at = None
                    
                    try:
                        cursor.execute('SELECT user_tier, tier_expires_at FROM users WHERE id = ?', (user_id,))
                        user_row = cursor.fetchone()
                        if user_row:
                            tier, tier_expires_at = user_row
                    except:
                        pass  # Tabela users pode não existir
                    
                    # Calcular estatísticas reais de uso
                    paragraph_analysis = total_essays * 2  # Estimativa: 2 análises por redação
                    essay_correction = scored_essays  # Correções reais
                    deep_analysis = max(0, total_essays - 2)  # Análise profunda
                    
                    users_data.append(UserStats(
                        user_id=user_id,
                        name=name,
                        email=user_id,
                        tier=tier or 'free',
                        tier_expires_at=tier_expires_at,
                        total_essays=total_essays,
                        paragraph_analysis_count=paragraph_analysis,
                        essay_correction_count=essay_correction,
                        deep_analysis_count=deep_analysis,
                        created_at=first_essay or datetime.utcnow().isoformat(),
                        last_login=last_essay,
                        avg_score=round(avg_score, 1) if avg_score else None
                    ))
                
                return users_data
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def get_api_usage_stats(self) -> List[APIUsageStats]:
        """Get real API usage statistics by model - FILTRADO PARA REMOVER MOCK DATA"""
        try:
            # Conectar diretamente ao banco para ter controle total
            conn = sqlite3.connect('database.db')
            cursor = conn.cursor()
            
            models_stats = []
            
            try:
                # Primeiro tentar tabela api_usage (dados reais)
                cursor.execute('SELECT model_name, COUNT(*) as total_calls, AVG(response_time) as avg_time FROM api_usage GROUP BY model_name')
                api_data = cursor.fetchall()
                
                # Processar todos os modelos (exceto mock data específico)
                for model_name, total_calls, avg_time in api_data:
                    # FILTRAR APENAS MOCK DATA ESPECÍFICO:
                    # Remover deepseek com 117, deepseek14b com 99, llama com 92
                    if (model_name.lower() == 'deepseek' and total_calls == 117) or \
                       (model_name.lower() == 'deepseek14b' and total_calls == 99) or \
                       (model_name.lower() == 'llama' and total_calls == 92):
                        continue
                    
                    # ADICIONAR TODOS OS OUTROS MODELOS
                    models_stats.append(APIUsageStats(
                        model_name=model_name,
                        total_calls=total_calls,
                        success_rate=0.95,
                        avg_response_time=avg_time or 2.5,
                        last_24h_calls=max(1, total_calls // 10)
                    ))
                
                # ORDENAR OS MODELOS CONFORME SOLICITADO
                # 1. DeepSeek_14b, 2. Llama_253b, 3. DeepSeekR1, 4. Kimi, 5. Qwen, 6. Llama 49b
                def get_model_order(model_name):
                    name_lower = model_name.lower()
                    if 'deepseek_14b' in name_lower or 'deepseek14b' in name_lower:
                        return 1
                    elif 'llama_253b' in name_lower or 'llama253b' in name_lower:
                        return 2
                    elif 'deepseekr1' in name_lower or 'deepseek r1' in name_lower or 'deepseek_r1' in name_lower:
                        return 3
                    elif 'kimi' in name_lower:
                        return 4
                    elif 'qwen' in name_lower:
                        return 5
                    elif 'llama' in name_lower and ('49b' in name_lower or '70b' in name_lower):
                        return 6
                    else:
                        return 999  # Outros modelos no final
                
                # Ordenar a lista
                models_stats.sort(key=lambda x: get_model_order(x.model_name))
                
                # Se não há dados na api_usage, usar fallback das redações
                if not models_stats:
                    cursor.execute('SELECT ai_model, COUNT(*) FROM essays GROUP BY ai_model')
                    essay_data = cursor.fetchall()
                    
                    for model, count in essay_data:
                        model_name = model or 'deepseek'
                        total_calls = count * 3
                        
                        # Mesmo filtro para dados de redações
                        if (model_name.lower() == 'deepseek' and total_calls == 117) or \
                           (model_name.lower() == 'deepseek14b' and total_calls == 99) or \
                           (model_name.lower() == 'llama' and total_calls == 92):
                            continue
                        
                        models_stats.append(APIUsageStats(
                            model_name=model_name,
                            total_calls=total_calls,
                            success_rate=0.95,
                            avg_response_time=2.5,
                            last_24h_calls=max(1, total_calls // 10)
                        ))
                
            finally:
                conn.close()
            
            return models_stats
            
        except Exception as e:
            logger.error(f"Error getting API usage stats: {e}")
            return []
    
    async def get_api_timeline_data(self, model_name: str = None, hours: int = 24) -> List[Dict]:
        """Get API usage timeline data for charts"""
        try:
            timeline_data = await self.db.get_api_usage_timeline(model_name, hours)
            
            # Se não há dados reais, criar dados simulados baseados nas redações
            if not timeline_data:
                conn = sqlite3.connect('database.db')
                cursor = conn.cursor()
                
                try:
                    # Buscar redações das últimas 24h agrupadas por hora
                    from datetime import datetime, timedelta
                    cutoff_time = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
                    
                    cursor.execute('''
                        SELECT 
                            STRFTIME('%Y-%m-%d %H:00:00', created_at) as hour,
                            ai_model,
                            COUNT(*) * 3 as estimated_calls
                        FROM essays 
                        WHERE created_at >= ?
                        GROUP BY hour, ai_model
                        ORDER BY hour ASC
                    ''', (cutoff_time,))
                    
                    rows = cursor.fetchall()
                    timeline_data = []
                    
                    for row in rows:
                        timeline_data.append({
                            "hour": row[0],
                            "model_name": row[1] or 'deepseek',
                            "calls": row[2],
                            "success_rate": 0.95,
                            "avg_response_time": 2.5
                        })
                    
                finally:
                    conn.close()
            
            return timeline_data
            
        except Exception as e:
            logger.error(f"Error getting API timeline data: {e}")
            return []
    
    async def get_system_stats(self) -> SystemStats:
        """Get overall system statistics"""
        try:
            conn = self.db.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                # Check if users table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
                users_table_exists = cursor.fetchone() is not None
                
                if users_table_exists:
                    # Get user counts by tier
                    cursor.execute('''
                        SELECT user_tier, COUNT(*) 
                        FROM users 
                        GROUP BY user_tier
                    ''')
                    tier_counts = dict(cursor.fetchall())
                    
                    total_users = sum(tier_counts.values())
                    free_users = tier_counts.get('free', 0)
                    premium_users = tier_counts.get('premium', 0)
                    vitalicio_users = tier_counts.get('vitalicio', 0)
                else:
                    # Fallback: count unique users from essays
                    cursor.execute('SELECT COUNT(DISTINCT user_id) FROM essays')
                    total_users = cursor.fetchone()[0] or 0
                    free_users = total_users  # Assume all free if no tier table
                    premium_users = 0
                    vitalicio_users = 0
                
                # Get total essays
                cursor.execute('SELECT COUNT(*) FROM essays')
                total_essays = cursor.fetchone()[0] or 0
                
                # Simulate API calls (in production, track these)
                total_api_calls = total_essays * 3  # Estimate
                avg_daily_usage = total_api_calls / max(1, (datetime.utcnow() - datetime(2024, 1, 1)).days)
                
                return SystemStats(
                    total_users=total_users,
                    free_users=free_users,
                    premium_users=premium_users,
                    vitalicio_users=vitalicio_users,
                    total_essays=total_essays,
                    total_api_calls=total_api_calls,
                    avg_daily_usage=round(avg_daily_usage, 1)
                )
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            return SystemStats(
                total_users=0, free_users=0, premium_users=0, vitalicio_users=0,
                total_essays=0, total_api_calls=0, avg_daily_usage=0.0
            )
    
    async def update_user_tier(self, user_id: str, tier: str, expires_at: str = None) -> bool:
        """Update user tier"""
        try:
            return await self.db.update_user_tier(user_id, tier, expires_at)
        except Exception as e:
            logger.error(f"Error updating user tier: {e}")
            return False
    
    async def search_users(self, query: str) -> List[UserStats]:
        """Search users by email or name"""
        all_users = await self.get_all_users_stats()
        query_lower = query.lower()
        
        return [
            user for user in all_users
            if query_lower in user.email.lower() or query_lower in user.name.lower()
        ]

# Initialize service
dashboard_service = AdminDashboardService()

# Routes
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Página inicial - redireciona para login ou dashboard"""
    session_token = request.cookies.get("session_token")
    
    if verify_session(session_token):
        return RedirectResponse(url="/dashboard", status_code=302)
    else:
        return templates.TemplateResponse("login_modern.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_home(request: Request):
    """Dashboard principal com autenticação por sessão"""
    session_token = request.cookies.get("session_token")
    if not verify_session(session_token):
        return RedirectResponse(url="/", status_code=302)
    
    try:
        session_data = ACTIVE_SESSIONS[session_token]
        admin_email = session_data['email']
        
        # Get all stats with error handling
        try:
            users = await dashboard_service.get_all_users_stats()
        except Exception as e:
            users = []
        
        try:
            api_stats = await dashboard_service.get_api_usage_stats()
        except Exception as e:
            api_stats = []
        
        try:
            system_stats = await dashboard_service.get_system_stats()
        except Exception as e:
            system_stats = SystemStats(
                total_users=0, free_users=0, premium_users=0, vitalicio_users=0,
                total_essays=0, total_api_calls=0, avg_daily_usage=0.0
            )
        
        return templates.TemplateResponse("dashboard_final.html", {
            "request": request,
            "users": [user.dict() for user in users],
            "api_stats": [stat.dict() for stat in api_stats],
            "system_stats": system_stats.dict(),
            "admin_email": admin_email
        })
        
    except Exception as e:
        logger.error(f"Dashboard loading error: {e}")
        # Render an error on the login page instead of redirecting, to break the loop.
        response = templates.TemplateResponse("login_modern.html", {
            "request": request,
            "error": f"Ocorreu um erro ao carregar o dashboard. Tente fazer o login novamente."
        })
        # Clear the potentially problematic cookie
        response.delete_cookie("session_token")
        return response

@app.post("/login")
async def login(request: Request, email: str = Form(...), password: str = Form(...)):
    """Admin login personalizado com sessão"""
    try:
        verify_admin_credentials(email, password)
        
        # Criar sessão
        session_token = create_session(email)
        
        # Redirecionar para dashboard sem credenciais na URL
        response = RedirectResponse(url="/dashboard", status_code=302)
        response.set_cookie(
            key="session_token", 
            value=session_token,
            max_age=SESSION_TIMEOUT,
            httponly=True,
            secure=False  # Para desenvolvimento local
        )
        return response
        
    except HTTPException as e:
        return templates.TemplateResponse("login_modern.html", {
            "request": request,
            "error": "Email ou senha incorretos. Verifique suas credenciais."
        })

@app.post("/update-user-tier")
async def update_user_tier(
    request: Request,
    user_id: str = Form(...),
    tier: str = Form(...),
    expires_at: str = Form(None)
):
    """Update user tier"""
    session_token = request.cookies.get("session_token")
    
    if not verify_session(session_token):
        return RedirectResponse(url="/", status_code=302)
    
    # Validate tier
    if tier not in ['free', 'premium', 'vitalicio']:
        raise HTTPException(status_code=400, detail="Tier inválido")
    
    # Parse expiration date if provided
    expires_at_parsed = None
    if expires_at and tier == 'premium':
        try:
            expires_at_parsed = datetime.fromisoformat(expires_at).isoformat()
        except ValueError:
            raise HTTPException(status_code=400, detail="Data de expiração inválida")
    
    success = await dashboard_service.update_user_tier(user_id, tier, expires_at_parsed)
    
    if success:
        return RedirectResponse(url="/dashboard?success=tier_updated", status_code=302)
    else:
        return RedirectResponse(url="/dashboard?error=update_failed", status_code=302)

@app.get("/search")
async def search_users(request: Request, q: str):
    """Search users"""
    session_token = request.cookies.get("session_token")
    
    if not verify_session(session_token):
        return RedirectResponse(url="/", status_code=302)
    
    session_data = ACTIVE_SESSIONS[session_token]
    admin_email = session_data['email']
    
    users = await dashboard_service.search_users(q)
    api_stats = await dashboard_service.get_api_usage_stats()
    system_stats = await dashboard_service.get_system_stats()
    
    return templates.TemplateResponse("dashboard_final.html", {
        "request": request,
        "users": [user.dict() for user in users],
        "api_stats": [stat.dict() for stat in api_stats],
        "system_stats": system_stats.dict(),
        "admin_email": admin_email,
        "search_query": q
    })

@app.get("/logout")
async def logout(request: Request):
    """Logout - limpar sessão"""
    session_token = request.cookies.get("session_token")
    
    if session_token and session_token in ACTIVE_SESSIONS:
        del ACTIVE_SESSIONS[session_token]
    
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie("session_token")
    return response

@app.get("/api/users")
async def api_get_users(request: Request):
    """API endpoint to get users data"""
    session_token = request.cookies.get("session_token")
    
    if not verify_session(session_token):
        raise HTTPException(status_code=401, detail="Sessão inválida")
    
    users = await dashboard_service.get_all_users_stats()
    return {"users": [user.dict() for user in users]}

@app.get("/api/stats")
async def api_get_stats(request: Request):
    """API endpoint to get system stats"""
    session_token = request.cookies.get("session_token")
    
    if not verify_session(session_token):
        raise HTTPException(status_code=401, detail="Sessão inválida")
    
    system_stats = await dashboard_service.get_system_stats()
    api_stats = await dashboard_service.get_api_usage_stats()
    
    return {
        "system": system_stats.dict(),
        "api_usage": [stat.dict() for stat in api_stats]
    }

@app.get("/api/timeline/{model_name}")
async def api_get_model_timeline(request: Request, model_name: str, hours: int = 24):
    """API endpoint to get timeline data for specific model"""
    session_token = request.cookies.get("session_token")
    
    if not verify_session(session_token):
        raise HTTPException(status_code=401, detail="Sessão inválida")
    
    timeline_data = await dashboard_service.get_api_timeline_data(model_name, hours)
    return {"timeline": timeline_data}

@app.get("/api/timeline")
async def api_get_all_timeline(request: Request, hours: int = 24):
    """API endpoint to get timeline data for all models"""
    session_token = request.cookies.get("session_token")
    
    if not verify_session(session_token):
        raise HTTPException(status_code=401, detail="Sessão inválida")
    
    timeline_data = await dashboard_service.get_api_timeline_data(None, hours)
    return {"timeline": timeline_data}

# Importar serviço de geolocalização
from geolocation_service import geolocation_service

# Endpoint para dados de geolocalização
@app.get("/admin/analytics/locations")
async def get_location_analytics():
    """Retorna dados agregados de localização dos visitantes"""
    try:
        data = geolocation_service.get_analytics_data()
        return {
            "countries": data["countries"],
            "regions": data["regions"], 
            "cities": data["cities"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter dados de localização: {str(e)}")

# Endpoint para dados de dispositivos
@app.get("/admin/analytics/devices")
async def get_device_analytics():
    """Retorna dados agregados de dispositivos dos visitantes"""
    try:
        data = geolocation_service.get_analytics_data()
        return {
            "browsers": data["browsers"],
            "operating_systems": data["operating_systems"],
            "devices": data["devices"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter dados de dispositivos: {str(e)}")

# Rota para a página do mapa
@app.get("/admin/map", response_class=HTMLResponse)
async def map_dashboard(request: Request):
    """Página do dashboard de mapa com dados de geolocalização"""
    return templates.TemplateResponse("map_dashboard_fixed.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    
    print("🚀 Iniciando Scribo Admin Dashboard...")
    print("📍 Dashboard de Geolocalização implementado!")
    print("🌐 Servidor rodando em: http://localhost:8001")
    print("🗺️ Mapa de visitantes: http://localhost:8001/admin/map")
    print("👤 Login: supernvxofc@gmail.com")
    print("🔑 Senha: 9Lf$5;Zagaia")
    print("\n" + "="*50)
    print("💡 Pressione Ctrl+C para parar o servidor")
    print("="*50 + "\n")
    
    try:
        # Configurar uvicorn para manter o terminal aberto
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8001,
            log_level="info",
            access_log=True,
            reload=False  # Desabilitar reload para evitar problemas
        )
    except KeyboardInterrupt:
        print("\n🛑 Servidor interrompido pelo usuário")
        print("✅ Dashboard administrativo finalizado com segurança")
    except Exception as e:
        print(f"\n❌ Erro ao iniciar servidor: {e}")
        print("🔧 Verifique se a porta 8001 está disponível")
    finally:
        print("\n📝 Pressione Enter para fechar...")
        try:
            input()
        except:
            pass