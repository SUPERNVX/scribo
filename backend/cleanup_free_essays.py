#!/usr/bin/env python3
"""
Script para limpeza automática das redações de usuários gratuitos após 30 dias
Este script pode ser executado manualmente ou agendado via cron/task scheduler

Uso:
    python cleanup_free_essays.py [--days=30] [--dry-run] [--verbose]

Exemplos:
    python cleanup_free_essays.py                    # Limpa redações com mais de 30 dias
    python cleanup_free_essays.py --days=45          # Limpa redações com mais de 45 dias
    python cleanup_free_essays.py --dry-run          # Simula a limpeza sem deletar
    python cleanup_free_essays.py --verbose          # Mostra logs detalhados
"""

import asyncio
import argparse
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Adicionar o diretório backend ao path para importar módulos
sys.path.insert(0, str(Path(__file__).parent))

from database_adapter import db_adapter
from task_queue import task_queue
from task_handlers import register_task_handlers

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('cleanup_free_essays.log')
    ]
)

logger = logging.getLogger(__name__)

class FreeEssayCleanup:
    """Classe para gerenciar a limpeza das redações de usuários gratuitos"""
    
    def __init__(self, days_old: int = 30, dry_run: bool = False):
        self.days_old = days_old
        self.dry_run = dry_run
        
    async def initialize(self):
        """Inicializar conexões e serviços"""
        try:
            await db_adapter.init()
            register_task_handlers(task_queue)
            logger.info("Serviços inicializados com sucesso")
        except Exception as e:
            logger.error(f"Erro ao inicializar serviços: {e}")
            raise
    
    async def get_cleanup_preview(self) -> dict:
        """Obter preview do que será limpo sem executar a limpeza"""
        try:
            # Calcular data de corte
            cutoff_date = (datetime.utcnow() - timedelta(days=self.days_old)).isoformat()
            
            # Simular a query de limpeza para obter estatísticas
            conn = db_adapter.get_sqlite_connection()
            cursor = conn.cursor()
            
            # Identificar usuários premium (heurística: mais de 50 redações)
            cursor.execute('''
                SELECT user_id, COUNT(*) as essay_count
                FROM essays 
                GROUP BY user_id
                HAVING essay_count > 50
            ''')
            premium_users = [row[0] for row in cursor.fetchall()]
            
            # Contar redações que seriam deletadas
            if premium_users:
                placeholders = ','.join(['?' for _ in premium_users])
                query = f'''
                    SELECT COUNT(*) FROM essays 
                    WHERE created_at < ? 
                    AND user_id NOT IN ({placeholders})
                '''
                params = [cutoff_date] + premium_users
            else:
                query = 'SELECT COUNT(*) FROM essays WHERE created_at < ?'
                params = [cutoff_date]
            
            cursor.execute(query, params)
            essays_to_delete = cursor.fetchone()[0]
            
            # Contar usuários afetados
            if premium_users:
                query = f'''
                    SELECT COUNT(DISTINCT user_id) FROM essays 
                    WHERE created_at < ? 
                    AND user_id NOT IN ({placeholders})
                '''
            else:
                query = 'SELECT COUNT(DISTINCT user_id) FROM essays WHERE created_at < ?'
            
            cursor.execute(query, params)
            users_affected = cursor.fetchone()[0]
            
            # Estatísticas gerais
            cursor.execute('SELECT COUNT(*) FROM essays')
            total_essays = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(DISTINCT user_id) FROM essays')
            total_users = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                "cutoff_date": cutoff_date,
                "days_old": self.days_old,
                "essays_to_delete": essays_to_delete,
                "users_affected": users_affected,
                "premium_users_count": len(premium_users),
                "total_essays": total_essays,
                "total_users": total_users,
                "percentage_to_delete": round((essays_to_delete / total_essays * 100) if total_essays > 0 else 0, 2)
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter preview da limpeza: {e}")
            raise
    
    async def execute_cleanup(self) -> dict:
        """Executar a limpeza das redações"""
        if self.dry_run:
            logger.info("Modo DRY RUN - Nenhuma redação será deletada")
            return await self.get_cleanup_preview()
        
        try:
            logger.info(f"Iniciando limpeza de redações com mais de {self.days_old} dias")
            
            # Executar limpeza via database adapter
            result = await db_adapter.cleanup_free_user_essays(self.days_old)
            
            logger.info(f"Limpeza concluída: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Erro durante a limpeza: {e}")
            raise
    
    async def cleanup(self):
        """Limpar recursos"""
        try:
            await db_adapter.close()
            logger.info("Recursos limpos com sucesso")
        except Exception as e:
            logger.error(f"Erro ao limpar recursos: {e}")

async def main():
    """Função principal"""
    parser = argparse.ArgumentParser(
        description="Limpeza automática de redações de usuários gratuitos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:
  python cleanup_free_essays.py                    # Limpa redações com mais de 30 dias
  python cleanup_free_essays.py --days=45          # Limpa redações com mais de 45 dias  
  python cleanup_free_essays.py --dry-run          # Simula a limpeza sem deletar
  python cleanup_free_essays.py --verbose          # Mostra logs detalhados
        """
    )
    
    parser.add_argument(
        '--days', 
        type=int, 
        default=30,
        help='Número de dias para considerar redações antigas (padrão: 30)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simular a limpeza sem deletar redações'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Mostrar logs detalhados'
    )
    
    args = parser.parse_args()
    
    # Configurar nível de log
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Validar argumentos
    if args.days < 1:
        logger.error("O número de dias deve ser maior que 0")
        sys.exit(1)
    
    cleanup_service = FreeEssayCleanup(days_old=args.days, dry_run=args.dry_run)
    
    try:
        # Inicializar serviços
        await cleanup_service.initialize()
        
        # Obter preview
        preview = await cleanup_service.get_cleanup_preview()
        
        logger.info("=== PREVIEW DA LIMPEZA ===")
        logger.info(f"Data de corte: {preview['cutoff_date']}")
        logger.info(f"Redações a serem deletadas: {preview['essays_to_delete']}")
        logger.info(f"Usuários afetados: {preview['users_affected']}")
        logger.info(f"Usuários premium (preservados): {preview['premium_users_count']}")
        logger.info(f"Total de redações: {preview['total_essays']}")
        logger.info(f"Percentual a ser deletado: {preview['percentage_to_delete']}%")
        
        if args.dry_run:
            logger.info("=== MODO DRY RUN - NENHUMA REDAÇÃO FOI DELETADA ===")
        else:
            # Confirmar execução
            if preview['essays_to_delete'] > 0:
                logger.warning(f"ATENÇÃO: {preview['essays_to_delete']} redações serão PERMANENTEMENTE deletadas!")
                
                # Em produção, você pode querer adicionar uma confirmação interativa
                # response = input("Deseja continuar? (sim/não): ")
                # if response.lower() not in ['sim', 's', 'yes', 'y']:
                #     logger.info("Operação cancelada pelo usuário")
                #     return
                
                # Executar limpeza
                result = await cleanup_service.execute_cleanup()
                
                logger.info("=== RESULTADO DA LIMPEZA ===")
                logger.info(f"Redações deletadas: {result.get('deleted_essays', 0)}")
                logger.info(f"Correções deletadas: {result.get('deleted_corrections', 0)}")
                logger.info(f"Entradas de cache limpas: {result.get('deleted_cache_entries', 0)}")
            else:
                logger.info("Nenhuma redação encontrada para limpeza")
        
    except Exception as e:
        logger.error(f"Erro durante a execução: {e}")
        sys.exit(1)
    
    finally:
        await cleanup_service.cleanup()

if __name__ == "__main__":
    # Executar função principal
    asyncio.run(main())