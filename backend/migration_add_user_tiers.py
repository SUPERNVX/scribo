#!/usr/bin/env python3
"""
Migração para adicionar sistema de tiers aos usuários existentes
Adiciona campos user_tier e tier_expires_at à tabela users
"""

import sqlite3
import logging
from datetime import datetime
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_sqlite_add_user_tiers():
    """Migração para SQLite - adicionar campos de tier"""
    db_path = Path(__file__).parent / 'database.db'
    
    if not db_path.exists():
        logger.info("Database SQLite não encontrado, criando novo...")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar se já existe tabela users
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            logger.info("Tabela users não existe, será criada pelo init.sql")
            return
        
        # Verificar se campos já existem
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'user_tier' in columns:
            logger.info("Campos de tier já existem, migração não necessária")
            return
        
        logger.info("Adicionando campos de tier à tabela users...")
        
        # Adicionar campos de tier
        cursor.execute("ALTER TABLE users ADD COLUMN user_tier TEXT DEFAULT 'free'")
        cursor.execute("ALTER TABLE users ADD COLUMN tier_expires_at TEXT")
        
        # Atualizar usuários existentes baseado em heurística
        # Usuários com muitas redações = premium (temporário)
        cursor.execute("""
            UPDATE users 
            SET user_tier = 'premium' 
            WHERE id IN (
                SELECT user_id 
                FROM essays 
                GROUP BY user_id 
                HAVING COUNT(*) > 50
            )
        """)
        
        premium_users = cursor.rowcount
        
        conn.commit()
        logger.info(f"Migração concluída: {premium_users} usuários marcados como premium")
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro durante migração: {e}")
        raise
    finally:
        conn.close()

def migrate_postgres_add_user_tiers():
    """Migração para PostgreSQL - adicionar campos de tier"""
    # TODO: Implementar quando PostgreSQL estiver ativo
    logger.info("Migração PostgreSQL não implementada ainda")

if __name__ == "__main__":
    logger.info("Iniciando migração de tiers...")
    migrate_sqlite_add_user_tiers()
    logger.info("Migração concluída!")