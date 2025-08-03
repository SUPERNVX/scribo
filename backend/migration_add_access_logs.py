#!/usr/bin/env python3
"""
Migração para adicionar tabela access_logs para rastreamento de geolocalização
"""

import sqlite3
import os

def run_migration():
    """Executa a migração para adicionar a tabela access_logs"""
    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se a tabela já existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='access_logs'
        """)
        
        if cursor.fetchone():
            print("Tabela access_logs já existe. Migração não necessária.")
            return
        
        # Criar tabela access_logs
        cursor.execute("""
            CREATE TABLE access_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_address TEXT NOT NULL,
                country TEXT,
                region TEXT,
                city TEXT,
                latitude REAL,
                longitude REAL,
                browser TEXT,
                browser_version TEXT,
                os TEXT,
                os_version TEXT,
                device_type TEXT,
                user_agent TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                endpoint TEXT,
                method TEXT
            )
        """)
        
        # Criar índices para melhor performance
        cursor.execute("CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp)")
        cursor.execute("CREATE INDEX idx_access_logs_country ON access_logs(country)")
        cursor.execute("CREATE INDEX idx_access_logs_ip ON access_logs(ip_address)")
        
        conn.commit()
        print("Tabela access_logs criada com sucesso!")
        
    except Exception as e:
        print(f"Erro ao executar migração: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration()