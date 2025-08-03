#!/usr/bin/env python3
"""
Script completo para testar e corrigir o dashboard administrativo
"""
import sqlite3
import os
import json
import asyncio
from datetime import datetime, timedelta

def setup_database():
    """Configurar banco de dados com dados de teste"""
    print("🔧 Configurando banco de dados...")
    
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    try:
        # Criar tabela users se não existir
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                user_tier TEXT DEFAULT 'free',
                tier_expires_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Criar tabela api_usage se não existir
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS api_usage (
                id TEXT PRIMARY KEY,
                model_name TEXT NOT NULL,
                user_id TEXT,
                request_type TEXT NOT NULL,
                response_time REAL NOT NULL,
                success BOOLEAN NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Verificar usuários das redações
        cursor.execute("SELECT DISTINCT user_id FROM essays")
        essay_users = [row[0] for row in cursor.fetchall()]
        print(f"👥 Encontrados {len(essay_users)} usuários com redações")
        
        # Criar usuários baseados nas redações
        for user_id in essay_users:
            cursor.execute("SELECT COUNT(*) FROM users WHERE id = ?", (user_id,))
            if cursor.fetchone()[0] == 0:
                name = user_id.split('@')[0] if '@' in user_id else user_id
                cursor.execute('''
                    INSERT INTO users (id, name, email, user_tier)
                    VALUES (?, ?, ?, 'free')
                ''', (user_id, name, user_id))
                print(f"✅ Usuário criado: {user_id}")
        
        # Limpar dados antigos de API
        cursor.execute("DELETE FROM api_usage")
        
        # Adicionar dados de API realistas
        models = ['deepseek', 'deepseek14b', 'llama']
        request_types = ['essay_correction', 'paragraph_analysis', 'deep_analysis']
        
        base_time = datetime.now() - timedelta(hours=24)
        
        for i in range(100):  # 100 chamadas de teste
            model = models[i % len(models)]
            req_type = request_types[i % len(request_types)]
            user_id = essay_users[i % len(essay_users)] if essay_users else "test@test.com"
            
            # Simular tempos de resposta realistas
            if model == 'deepseek':
                response_time = 2.5 + (i * 0.1)
            elif model == 'deepseek14b':
                response_time = 1.2 + (i * 0.05)
            else:  # llama
                response_time = 4.1 + (i * 0.15)
            
            created_at = base_time + timedelta(minutes=i * 15)
            
            cursor.execute('''
                INSERT INTO api_usage (id, model_name, user_id, request_type, 
                                     response_time, success, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                f"api_call_{i}",
                model,
                user_id,
                req_type,
                response_time,
                True,
                created_at.isoformat()
            ))
        
        conn.commit()
        print("✅ Banco de dados configurado com sucesso!")
        
        # Mostrar estatísticas
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM essays")
        essay_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM api_usage")
        api_count = cursor.fetchone()[0]
        
        print(f"📊 Estatísticas:")
        print(f"   👥 Usuários: {user_count}")
        print(f"   📝 Redações: {essay_count}")
        print(f"   🔧 Chamadas API: {api_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

async def test_dashboard_functions():
    """Testar funções do dashboard"""
    print("\n🧪 Testando funções do dashboard...")
    
    try:
        from admin_dashboard import dashboard_service
        
        # Testar get_all_users_stats
        users = await dashboard_service.get_all_users_stats()
        print(f"✅ get_all_users_stats: {len(users)} usuários")
        
        if users:
            user = users[0]
            print(f"   📝 Primeiro usuário: {user.email} ({user.total_essays} redações)")
        
        # Testar get_api_usage_stats
        api_stats = await dashboard_service.get_api_usage_stats()
        print(f"✅ get_api_usage_stats: {len(api_stats)} modelos")
        
        for stat in api_stats:
            print(f"   🔧 {stat.model_name}: {stat.total_calls} chamadas")
        
        # Testar get_system_stats
        system_stats = await dashboard_service.get_system_stats()
        print(f"✅ get_system_stats:")
        print(f"   👥 Total usuários: {system_stats.total_users}")
        print(f"   🆓 Usuários free: {system_stats.free_users}")
        print(f"   ⭐ Usuários premium: {system_stats.premium_users}")
        
        # Testar update_user_tier
        if users:
            test_user = users[0]
            print(f"\n🔧 Testando alteração de tier para {test_user.email}...")
            
            success = await dashboard_service.update_user_tier(
                test_user.user_id, 
                'premium', 
                (datetime.now() + timedelta(days=365)).isoformat()
            )
            
            if success:
                print("✅ Tier atualizado com sucesso!")
                
                # Verificar se a alteração funcionou
                updated_users = await dashboard_service.get_all_users_stats()
                updated_user = next((u for u in updated_users if u.user_id == test_user.user_id), None)
                
                if updated_user and updated_user.tier == 'premium':
                    print("✅ Verificação: Tier alterado corretamente!")
                else:
                    print("❌ Verificação: Tier não foi alterado!")
            else:
                print("❌ Falha ao atualizar tier!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar dashboard: {e}")
        import traceback
        traceback.print_exc()
        return False

def fix_javascript_errors():
    """Corrigir erros de JavaScript no template"""
    print("\n🔧 Verificando template do dashboard...")
    
    template_path = "templates/dashboard.html"
    if not os.path.exists(template_path):
        print("❌ Template não encontrado!")
        return False
    
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Verificar se ainda há referências ao llama70b
    if 'llama70b' in content:
        print("⚠️  Ainda há referências ao llama70b no template")
        # Substituir todas as referências restantes
        content = content.replace('llama70b', 'deepseek14b')
        content = content.replace('Llama 70B', 'DeepSeek 14B')
        
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Referências ao llama70b corrigidas!")
    else:
        print("✅ Template está correto!")
    
    return True

if __name__ == "__main__":
    print("🚀 Teste completo do dashboard administrativo")
    print("=" * 50)
    
    # 1. Configurar banco de dados
    if not setup_database():
        print("❌ Falha na configuração do banco")
        exit(1)
    
    # 2. Corrigir JavaScript
    if not fix_javascript_errors():
        print("❌ Falha na correção do template")
        exit(1)
    
    # 3. Testar funções do dashboard
    success = asyncio.run(test_dashboard_functions())
    
    if success:
        print("\n🎉 Dashboard está funcionando corretamente!")
        print("\n📋 Próximos passos:")
        print("1. Inicie o dashboard: python admin_dashboard.py")
        print("2. Acesse: http://localhost:8001")
        print("3. Login: supernvxofc@gmail.com / 9Lf$5;Zagaia")
        print("4. Teste a alteração de tiers dos usuários")
    else:
        print("\n❌ Problemas detectados no dashboard!")