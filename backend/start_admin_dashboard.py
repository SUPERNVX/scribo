#!/usr/bin/env python3
"""
Script para iniciar o Dashboard Administrativo do Scribo
"""

import asyncio
import uvicorn
import logging
from pathlib import Path
import sys

# Adicionar o diretório backend ao path
sys.path.insert(0, str(Path(__file__).parent))

from admin_dashboard import app, dashboard_service

async def init_dashboard():
    """Inicializar dashboard e verificar dependências"""
    try:
        # Inicializar database adapter
        await dashboard_service.db.init()
        
        # Verificar se as tabelas existem
        health = await dashboard_service.db.health_check()
        print(f"✅ Database Status: {health}")
        
        # Testar busca de usuários
        users = await dashboard_service.get_all_users_stats()
        print(f"✅ Found {len(users)} users in database")
        
        # Testar stats do sistema
        system_stats = await dashboard_service.get_system_stats()
        print(f"✅ System Stats: {system_stats.total_users} users, {system_stats.total_essays} essays")
        
        print("✅ Dashboard initialized successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing dashboard: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Starting Scribo Admin Dashboard...")
    print("=" * 50)
    
    # Verificar se estamos no diretório correto
    if not Path("admin_dashboard.py").exists():
        print("❌ Error: admin_dashboard.py not found")
        print("Please run this script from the backend directory")
        sys.exit(1)
    
    # Verificar se templates existem
    templates_dir = Path("templates")
    if not templates_dir.exists() or not (templates_dir / "dashboard.html").exists():
        print("❌ Error: Template files not found")
        print("Please ensure templates/dashboard.html and templates/login.html exist")
        sys.exit(1)
    
    # Inicializar dashboard
    init_success = asyncio.run(init_dashboard())
    
    if not init_success:
        print("❌ Failed to initialize dashboard")
        sys.exit(1)
    
    print("\n🎯 Dashboard Configuration:")
    print("- URL: http://localhost:8001")
    print("- URL Alternativa: http://127.0.0.1:8001")
    print("- Admin Token: scribo_admin_2024_secure_token")
    print("- Auto-refresh: 30 seconds")
    print("- Features: User management, API stats, tier management")
    
    print("\n🔐 Security Notes:")
    print("- Change the admin token in production")
    print("- Use HTTPS in production")
    print("- Restrict access by IP if needed")
    
    print("\n🚀 Starting server...")
    print("=" * 50)
    
    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Iniciar servidor
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8001,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n👋 Dashboard stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting dashboard: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()