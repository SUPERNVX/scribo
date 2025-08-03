#!/usr/bin/env python3
"""
Script para corrigir acesso ao dashboard - versão com localhost
"""

import asyncio
import uvicorn
import logging
from pathlib import Path
import sys
import webbrowser
import time

# Adicionar o diretório backend ao path
sys.path.insert(0, str(Path(__file__).parent))

from admin_dashboard import app, dashboard_service

async def init_dashboard():
    """Inicializar dashboard e verificar dependências"""
    try:
        await dashboard_service.db.init()
        health = await dashboard_service.db.health_check()
        print(f"✅ Database Status: {health}")
        
        users = await dashboard_service.get_all_users_stats()
        print(f"✅ Found {len(users)} users in database")
        
        system_stats = await dashboard_service.get_system_stats()
        print(f"✅ System Stats: {system_stats.total_users} users, {system_stats.total_essays} essays")
        
        print("✅ Dashboard initialized successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing dashboard: {e}")
        return False

def open_browser():
    """Abrir navegador automaticamente"""
    time.sleep(2)  # Aguardar servidor iniciar
    try:
        webbrowser.open('http://localhost:8001')
        print("🌐 Navegador aberto automaticamente!")
    except:
        print("⚠️ Não foi possível abrir o navegador automaticamente")

def main():
    """Função principal"""
    print("🚀 Starting Scribo Admin Dashboard (FIXED VERSION)...")
    print("=" * 60)
    
    # Verificar arquivos
    if not Path("admin_dashboard.py").exists():
        print("❌ Error: admin_dashboard.py not found")
        print("Please run this script from the backend directory")
        sys.exit(1)
    
    templates_dir = Path("templates")
    if not templates_dir.exists() or not (templates_dir / "dashboard.html").exists():
        print("❌ Error: Template files not found")
        sys.exit(1)
    
    # Inicializar dashboard
    init_success = asyncio.run(init_dashboard())
    
    if not init_success:
        print("❌ Failed to initialize dashboard")
        sys.exit(1)
    
    print("\n🎯 Dashboard Configuration (CORRECTED):")
    print("- URL CORRETA: http://localhost:8001")
    print("- URL ALTERNATIVA: http://127.0.0.1:8001")
    print("- ❌ NÃO USE: http://0.0.0.0:8001 (não funciona)")
    print("- Admin Token: scribo_admin_2024_secure_token")
    print("- Interface: SIM - Dashboard visual completo!")
    
    print("\n🎨 Interface Visual Inclui:")
    print("- 📊 4 Cards de estatísticas com números grandes")
    print("- 👥 Lista de usuários com fotos e informações")
    print("- 📈 3 Gráficos interativos (Chart.js)")
    print("- 🔍 Barra de busca em tempo real")
    print("- ⚙️ Formulário para alterar tiers")
    print("- 🎨 Design moderno com gradientes e animações")
    
    print("\n🔐 Como Acessar:")
    print("1. Aguarde a mensagem 'Uvicorn running on...'")
    print("2. Abra o navegador em: http://localhost:8001")
    print("3. Digite o token: scribo_admin_2024_secure_token")
    print("4. Aproveite a interface visual!")
    
    print("\n🚀 Starting server on localhost (not 0.0.0.0)...")
    print("=" * 60)
    
    # Configurar logging
    logging.basicConfig(level=logging.INFO)
    
    # Abrir navegador automaticamente em thread separada
    import threading
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Iniciar servidor com localhost
    try:
        uvicorn.run(
            app,
            host="127.0.0.1",  # Usar localhost em vez de 0.0.0.0
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