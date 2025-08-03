#!/usr/bin/env python3
"""
Script para corrigir problemas do dashboard administrativo
"""
import sqlite3
import os
import json
from datetime import datetime

def check_and_fix_database():
    """Verificar e corrigir problemas do banco de dados"""
    
    print("🔍 Verificando banco de dados...")
    
    # Verificar se database.db existe
    if not os.path.exists('database.db'):
        print("❌ database.db não encontrado!")
        return False
    
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    try:
        # Verificar tabelas existentes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"📋 Tabelas existentes: {tables}")
        
        # Criar tabela users se não existir
        if 'users' not in tables:
            print("🔧 Criando tabela users...")
            cursor.execute('''
                CREATE TABLE users (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    email TEXT UNIQUE,
                    username TEXT UNIQUE,
                    google_id TEXT,
                    profile_picture TEXT,
                    user_tier TEXT DEFAULT 'free',
                    tier_expires_at TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    last_login TEXT
                )
            ''')
            print("✅ Tabela users criada!")
        else:
            print("✅ Tabela users já existe")
            
            # Verificar colunas da tabela users
            cursor.execute("PRAGMA table_info(users)")
            columns = [col[1] for col in cursor.fetchall()]
            print(f"📝 Colunas da tabela users: {columns}")
            
            # Adicionar colunas de tier se não existirem
            if 'user_tier' not in columns:
                print("🔧 Adicionando coluna user_tier...")
                cursor.execute("ALTER TABLE users ADD COLUMN user_tier TEXT DEFAULT 'free'")
                
            if 'tier_expires_at' not in columns:
                print("🔧 Adicionando coluna tier_expires_at...")
                cursor.execute("ALTER TABLE users ADD COLUMN tier_expires_at TEXT")
        
        # Verificar se existem usuários baseados nas redações
        cursor.execute("SELECT DISTINCT user_id FROM essays")
        essay_users = [row[0] for row in cursor.fetchall()]
        print(f"👥 Usuários com redações: {len(essay_users)}")
        
        # Criar registros de usuários baseados nas redações
        for user_id in essay_users:
            cursor.execute("SELECT COUNT(*) FROM users WHERE id = ?", (user_id,))
            if cursor.fetchone()[0] == 0:
                print(f"🔧 Criando usuário: {user_id}")
                name = user_id.split('@')[0] if '@' in user_id else user_id
                cursor.execute('''
                    INSERT INTO users (id, name, email, user_tier, created_at)
                    VALUES (?, ?, ?, 'free', ?)
                ''', (user_id, name, user_id, datetime.now().isoformat()))
        
        # Verificar tabela api_usage
        if 'api_usage' not in tables:
            print("🔧 Criando tabela api_usage...")
            cursor.execute('''
                CREATE TABLE api_usage (
                    id TEXT PRIMARY KEY,
                    model_name TEXT NOT NULL,
                    user_id TEXT,
                    request_type TEXT NOT NULL,
                    response_time REAL NOT NULL,
                    success BOOLEAN NOT NULL,
                    error_message TEXT,
                    tokens_used INTEGER,
                    created_at TEXT NOT NULL
                )
            ''')
            
            # Criar índices
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_api_usage_model_time 
                ON api_usage(model_name, created_at)
            ''')
            print("✅ Tabela api_usage criada!")
        
        # Simular alguns dados de API para teste
        cursor.execute("SELECT COUNT(*) FROM api_usage")
        if cursor.fetchone()[0] == 0:
            print("🔧 Adicionando dados de teste para API...")
            test_data = [
                ('deepseek', 'essay_correction', 2.5, True),
                ('deepseek14b', 'paragraph_analysis', 1.2, True),
                ('llama', 'deep_analysis', 4.1, True),
            ]
            
            for model, req_type, time, success in test_data:
                for i in range(10):  # 10 chamadas de teste para cada modelo
                    cursor.execute('''
                        INSERT INTO api_usage (id, model_name, user_id, request_type, 
                                             response_time, success, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        f"test_{model}_{i}",
                        model,
                        essay_users[0] if essay_users else "test@test.com",
                        req_type,
                        time + (i * 0.1),
                        success,
                        datetime.now().isoformat()
                    ))
        
        conn.commit()
        
        # Verificar estatísticas finais
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM essays")
        essay_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM api_usage")
        api_count = cursor.fetchone()[0]
        
        print(f"\n📊 Estatísticas finais:")
        print(f"👥 Usuários: {user_count}")
        print(f"📝 Redações: {essay_count}")
        print(f"🔧 Chamadas API: {api_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def test_dashboard_functions():
    """Testar funções do dashboard"""
    print("\n🧪 Testando funções do dashboard...")
    
    try:
        import sys
        sys.path.append('.')
        from admin_dashboard import dashboard_service
        
        # Testar get_all_users_stats
        import asyncio
        
        async def test_async():
            users = await dashboard_service.get_all_users_stats()
            print(f"✅ get_all_users_stats: {len(users)} usuários encontrados")
            
            api_stats = await dashboard_service.get_api_usage_stats()
            print(f"✅ get_api_usage_stats: {len(api_stats)} modelos encontrados")
            
            system_stats = await dashboard_service.get_system_stats()
            print(f"✅ get_system_stats: {system_stats.total_users} usuários totais")
            
            return True
        
        result = asyncio.run(test_async())
        return result
        
    except Exception as e:
        print(f"❌ Erro ao testar dashboard: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando correção do dashboard...")
    
    if check_and_fix_database():
        print("✅ Banco de dados corrigido!")
        
        if test_dashboard_functions():
            print("✅ Dashboard funcionando corretamente!")
        else:
            print("❌ Problemas no dashboard detectados")
    else:
        print("❌ Falha ao corrigir banco de dados")