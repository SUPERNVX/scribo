#!/usr/bin/env python3
"""
Script de teste para verificar se o dashboard está funcionando
"""

import asyncio
import sys
from pathlib import Path

# Adicionar o diretório backend ao path
sys.path.insert(0, str(Path(__file__).parent))

async def test_dashboard():
    """Testar funcionalidades do dashboard"""
    try:
        from admin_dashboard import dashboard_service
        
        print("🧪 Testando Dashboard Administrativo...")
        print("=" * 50)
        
        # 1. Testar conexão com banco
        print("1. Testando conexão com banco...")
        await dashboard_service.db.init()
        health = await dashboard_service.db.health_check()
        print(f"   ✅ Status: {health.get('status', 'unknown')}")
        
        # 2. Testar busca de usuários
        print("\n2. Testando busca de usuários...")
        users = await dashboard_service.get_all_users_stats()
        print(f"   ✅ Encontrados: {len(users)} usuários")
        
        if users:
            print("   📋 Primeiros usuários:")
            for i, user in enumerate(users[:3]):
                print(f"      {i+1}. {user.name} ({user.email}) - Tier: {user.tier}")
        
        # 3. Testar estatísticas do sistema
        print("\n3. Testando estatísticas do sistema...")
        system_stats = await dashboard_service.get_system_stats()
        print(f"   ✅ Total usuários: {system_stats.total_users}")
        print(f"   ✅ Usuários gratuitos: {system_stats.free_users}")
        print(f"   ✅ Usuários premium: {system_stats.premium_users}")
        print(f"   ✅ Total redações: {system_stats.total_essays}")
        
        # 4. Testar estatísticas de API
        print("\n4. Testando estatísticas de API...")
        api_stats = await dashboard_service.get_api_usage_stats()
        print(f"   ✅ Modelos monitorados: {len(api_stats)}")
        
        for stat in api_stats:
            print(f"      📊 {stat.model_name}: {stat.total_calls} chamadas")
        
        # 5. Testar busca
        if users:
            print("\n5. Testando busca de usuários...")
            test_email = users[0].email
            search_results = await dashboard_service.search_users(test_email.split('@')[0])
            print(f"   ✅ Busca por '{test_email.split('@')[0]}': {len(search_results)} resultados")
        
        print("\n" + "=" * 50)
        print("✅ TODOS OS TESTES PASSARAM!")
        print("\n🚀 Dashboard pronto para uso:")
        print("   URL: http://localhost:8001")
        print("   Token: scribo_admin_2024_secure_token")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Função principal"""
    success = await test_dashboard()
    
    if success:
        print("\n🎯 Para iniciar o dashboard:")
        print("   python start_admin_dashboard.py")
        print("   ou")
        print("   start_admin_dashboard.bat")
    else:
        print("\n❌ Corrija os erros antes de iniciar o dashboard")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())