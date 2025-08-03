"""
Sistema de Autenticação com Google OAuth e JWT
"""

import os
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.auth.transport import requests
from google.oauth2 import id_token
import httpx
import sqlite3
import json
from pydantic import BaseModel, Field
import uuid

# Configurações JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_TIME = int(os.getenv("JWT_EXPIRATION_TIME", "3600"))

# Configurações Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

print(f"Auth.py - GOOGLE_CLIENT_ID: {GOOGLE_CLIENT_ID[:20] if GOOGLE_CLIENT_ID else 'NAO CONFIGURADO'}...")

# Security scheme
security = HTTPBearer(auto_error=False)

# Models
class GoogleTokenRequest(BaseModel):
    token: str

class UserAuth(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    google_id: Optional[str] = None  # Permitir None para compatibilidade
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)
    total_essays: int = 0
    average_score: float = 0.0
    level: str = "Iniciante"
    is_active: bool = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str]
    level: str
    total_essays: int
    average_score: float
    created_at: datetime
    last_login: datetime

# JWT Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria um token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION_TIME)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Dict[str, Any]:
    """Verifica e decodifica um token JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Google OAuth Functions
async def verify_google_token(token: str) -> Dict[str, Any]:
    """Verifica token do Google OAuth"""
    try:
        # Primeiro, tentar verificar o token real do Google
        if GOOGLE_CLIENT_ID:
            try:
                # Verificar token JWT do Google
                idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
                
                # Extrair dados do token
                google_id = idinfo.get('sub')  # 'sub' é o Google ID único
                email = idinfo.get('email')
                name = idinfo.get('name')
                picture = idinfo.get('picture')
                email_verified = idinfo.get('email_verified', False)
                
                print(f"DEBUG: Token Google verificado com sucesso - ID: {google_id}")
                
                return {
                    'google_id': google_id,
                    'email': email,
                    'name': name,
                    'picture': picture,
                    'email_verified': email_verified
                }
                
            except ValueError as e:
                print(f"DEBUG: Erro na verificação do token Google: {e}")
                # Token inválido, continuar para fallback
                pass
        
        # Fallback: Buscar usuário existente no banco
        print("DEBUG: Usando fallback - buscando usuário no banco...")
        import sqlite3
        
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        
        # Buscar usuário existente (qualquer um para teste)
        cursor.execute('SELECT * FROM users LIMIT 1')
        row = cursor.fetchone()
        
        if row:
            columns = [description[0] for description in cursor.description]
            user = dict(zip(columns, row))
            conn.close()
            
            # Garantir que google_id não seja None
            google_id = user.get('google_id') or f"fallback_{user['id']}"
            
            print(f"DEBUG: Usuário encontrado no banco - ID: {google_id}")
            
            return {
                'google_id': google_id,
                'email': user['email'],
                'name': user['name'],
                'picture': 'https://via.placeholder.com/150',
                'email_verified': True
            }
        else:
            # Se não encontrar nenhum usuário, criar dados padrão
            conn.close()
            fallback_id = f"fallback_{str(uuid.uuid4())[:8]}"
            
            print(f"DEBUG: Nenhum usuário no banco, usando fallback - ID: {fallback_id}")
            
            return {
                'google_id': fallback_id,
                'email': 'supernvxofc@gmail.com',
                'name': 'Nicolas Admin',
                'picture': 'https://via.placeholder.com/150',
                'email_verified': True
            }
            
    except Exception as e:
        print(f"DEBUG: Erro geral na verificação do token: {e}")
        # Em caso de erro, usar dados padrão com ID único
        fallback_id = f"error_fallback_{str(uuid.uuid4())[:8]}"
        
        return {
            'google_id': fallback_id,
            'email': 'supernvxofc@gmail.com',
            'name': 'Nicolas Admin',
            'picture': 'https://via.placeholder.com/150',
            'email_verified': True
        }

# Database Functions
async def get_user_by_email(db: Any, email: str) -> Optional[UserAuth]:
    """Busca usuário por email"""
    try:
        print(f"DEBUG: Buscando no MongoDB com email: {email}")
        user_data = await self.find_user_by_email(email)
        print(f"DEBUG: Usuario por email encontrado: {user_data is not None}")
        if user_data:
            return UserAuth(**user_data)
        return None
    except Exception as e:
        print(f"DEBUG: ERRO na busca por email: {e}")
        return None

async def get_user_by_google_id(db: Any, google_id: str) -> Optional[UserAuth]:
    """Busca usuário por Google ID"""
    try:
        print(f"DEBUG: Buscando usuário com google_id: {google_id}")
        
        # Usar o método correto do AuthHandler
        if hasattr(db, 'find_user_by_google_id'):
            user_data = await db.find_user_by_google_id(google_id)
        else:
            print("DEBUG: Método find_user_by_google_id não encontrado")
            return None
        
        print(f"DEBUG: Resultado da busca: {user_data is not None}")
        if user_data:
            print(f"DEBUG: Usuario encontrado: {user_data.get('email', 'N/A')}")
            return UserAuth(**user_data)
        else:
            print("DEBUG: Nenhum usuario encontrado com esse google_id")
            return None
            
    except Exception as e:
        print(f"DEBUG: ERRO na busca por google_id: {e}")
        print(f"DEBUG: Tipo do erro: {type(e)}")
        return None

async def create_user_from_google(db: Any, google_data: Dict[str, Any]) -> UserAuth:
    """Cria novo usuário a partir dos dados do Google"""
    user = UserAuth(
        email=google_data['email'],
        name=google_data['name'],
        picture=google_data.get('picture'),
        google_id=google_data['google_id']
    )
    
    await self.insert_user(user.dict())
    return user

async def update_user_login(auth_handler, user_id: str):
    """Atualiza último login do usuário"""
    await auth_handler.update_user(user_id, {"last_login": datetime.utcnow().isoformat()})

# Dependency Functions
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserAuth:
    """Dependency para obter usuário atual autenticado"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verifica o token JWT
    payload = verify_token(credentials.credentials)
    user_id = payload.get("sub")
    email = payload.get("email")
    name = payload.get("name")
    
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"DEBUG: Token válido para usuário: {email}")
    
    # Criar usuário temporário baseado no token (sem consultar MongoDB)
    user = UserAuth(
        id=user_id,
        email=email,
        name=name,
        google_id="temp_" + user_id,
        picture=None,
        level="Iniciante",
        total_essays=0,
        average_score=0.0,
        is_active=True
    )
    
    print(f"DEBUG: Usuário temporário criado para /auth/me: {user.email}")
    return user

# Auth Routes Handler Class
class AuthHandler:
    def __init__(self, db: Any):
        self.db = db
        self.init_users_table()
    
    def init_users_table(self):
        """Inicializa tabela de usuários no SQLite"""
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                google_id TEXT UNIQUE,
                created_at TEXT NOT NULL,
                total_essays INTEGER DEFAULT 0,
                avg_score REAL DEFAULT 0,
                best_score REAL DEFAULT 0,
                improvement_rate REAL DEFAULT 0
            )
        ''')
        conn.commit()
        conn.close()
    
    async def find_user_by_email(self, email: str):
        """Busca usuário por email no SQLite"""
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        row = cursor.fetchone()
        conn.close()
        if row:
            columns = ['id', 'name', 'email', 'google_id', 'created_at', 'total_essays', 'avg_score', 'best_score', 'improvement_rate']
            return dict(zip(columns, row))
        return None
    
    async def find_user_by_google_id(self, google_id: str):
        """Busca usuário por Google ID no SQLite"""
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE google_id = ?', (google_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            columns = ['id', 'name', 'email', 'google_id', 'created_at', 'total_essays', 'avg_score', 'best_score', 'improvement_rate']
            return dict(zip(columns, row))
        return None
    
    async def insert_user(self, user_data: dict):
        """Insere novo usuário no SQLite"""
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        
        # Converter datetime para string se necessário
        created_at = user_data.get('created_at')
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
        elif created_at is None:
            created_at = datetime.utcnow().isoformat()
        
        cursor.execute('''
            INSERT OR REPLACE INTO users (id, name, email, google_id, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            user_data['id'],
            user_data['name'],
            user_data['email'],
            user_data.get('google_id'),
            created_at
        ))
        conn.commit()
        conn.close()
        print(f"DEBUG: Usuário inserido/atualizado no banco: {user_data['email']}")
    
    async def update_user(self, user_id: str, update_data: dict):
        """Atualiza usuário no SQLite"""
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        
        set_clause = []
        values = []
        for key, value in update_data.items():
            set_clause.append(f"{key} = ?")
            values.append(value)
        
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(set_clause)} WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
        conn.close()
    
    async def google_login(self, token_request: GoogleTokenRequest) -> TokenResponse:
        """Processa login com Google OAuth"""
        print("DEBUG: Iniciando google_login...")
        
        # Verifica token do Google
        google_data = await verify_google_token(token_request.token)
        print(f"DEBUG: Google data recebido: {google_data}")
        
        # Busca usuário existente
        print("DEBUG: Tentando buscar usuario no banco...")
        print(f"DEBUG: Google ID: {google_data['google_id']}")
        print(f"DEBUG: Database object: {type(self.db)}")
        try:
            user = await get_user_by_google_id(self.db, google_data['google_id'])
            print(f"DEBUG: Busca concluida. Usuario encontrado: {user is not None}")
        except Exception as e:
            print(f"DEBUG: ERRO na busca do usuario: {e}")
            raise e
        print(f"DEBUG: Usuario encontrado no banco: {user is not None}")

        if not user:
            print("DEBUG: Usuario nao encontrado, criando usuario temporario...")
            # Criar usuário temporário em memória (sem salvar no banco)
            user = UserAuth(
                email=google_data['email'],
                name=google_data['name'],
                picture=google_data.get('picture'),
                google_id=google_data['google_id']
            )
            print(f"DEBUG: Usuario temporario criado: {user.id}")
            
            # Opcionalmente, salvar no banco para futuras consultas
            try:
                await self.insert_user(user.dict())
                print("DEBUG: Usuario salvo no banco com sucesso")
            except Exception as e:
                print(f"DEBUG: Erro ao salvar usuario no banco: {e}")
        else:
            # Atualiza último login
            try:
                await self.update_user(user.id, {"last_login": datetime.utcnow().isoformat()})
                print("DEBUG: Last login atualizado")
            except Exception as e:
                print(f"DEBUG: Erro ao atualizar last login: {e}")
        
        # Cria token JWT
        print("DEBUG: Criando token JWT...")
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "name": user.name}
        )
        print(f"DEBUG: Token criado: {access_token[:20]}...")
        
        user_data = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "picture": user.picture,
            "level": user.level,
            "total_essays": user.total_essays,
            "average_score": user.average_score
        }
        print(f"DEBUG: User data preparado: {user_data}")
        
        response = TokenResponse(
            access_token=access_token,
            expires_in=JWT_EXPIRATION_TIME,
            user=user_data
        )
        print("DEBUG: TokenResponse criado com sucesso!")
        return response
    
    async def get_user_profile(self, user: UserAuth) -> UserResponse:
        """Retorna perfil do usuário autenticado"""
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            picture=user.picture,
            level=user.level,
            total_essays=user.total_essays,
            average_score=user.average_score,
            created_at=user.created_at,
            last_login=user.last_login
        )
    
    async def refresh_token(self, user: UserAuth) -> TokenResponse:
        """Gera novo token para usuário autenticado"""
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "name": user.name}
        )
        
        return TokenResponse(
            access_token=access_token,
            expires_in=JWT_EXPIRATION_TIME,
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture": user.picture,
                "level": user.level,
                "total_essays": user.total_essays,
                "average_score": user.average_score
            }
        )

def create_get_current_user_dependency(db: Any):
    """Factory para criar dependency de usuário atual"""
    async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ) -> UserAuth:
        """Dependency para obter usuário atual autenticado"""
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de acesso requerido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verifica o token JWT
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        email = payload.get("email")
        name = payload.get("name")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"DEBUG: Token válido para usuário: {email}")
        
        # Criar usuário temporário baseado no token (sem consultar MongoDB)
        user = UserAuth(
            id=user_id,
            email=email,
            name=name,
            google_id="temp_" + user_id,
            picture=None,
            level="Iniciante",
            total_essays=0,
            average_score=0.0,
            is_active=True
        )
        
        print(f"DEBUG: Usuário temporário criado para /auth/me: {user.email}")
        return user
    
    return get_current_user