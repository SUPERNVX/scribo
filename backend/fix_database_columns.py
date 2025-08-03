#!/usr/bin/env python3
"""
Script para corrigir colunas faltantes no banco de dados
"""

import sqlite3
from pathlib import Path

def fix_database():
    """Corrigir banco de dados adicionando colunas faltantes"""
    db_path = Path(__file__).parent / 'database.db'
    
    if not db_path.exists():
        print("❌ Database não encontrado")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🔧 Verificando estrutura do banco...")
        
        # Verificar se tabela users existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("📝 Criando tabela users...")
            cursor.execute('''
                CREATE TABLE users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    user_tier TEXT DEFAULT 'free',
                    tier_expires_at TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    last_login TEXT
                )
            ''')
            print("✅ Tabela users criada")
        else:
            print("✅ Tabela users existe")
            
            # Verificar colunas existentes
            cursor.execute("PRAGMA table_info(users)")
            columns = [col[1] for col in cursor.fetchall()]
            print(f"📋 Colunas existentes: {columns}")
            
            # Adicionar colunas faltantes
            if 'user_tier' not in columns:
                print("➕ Adicionando coluna user_tier...")
                cursor.execute("ALTER TABLE users ADD COLUMN user_tier TEXT DEFAULT 'free'")
            
            if 'tier_expires_at' not in columns:
                print("➕ Adicionando coluna tier_expires_at...")
                cursor.execute("ALTER TABLE users ADD COLUMN tier_expires_at TEXT")
            
            if 'last_login' not in columns:
                print("➕ Adicionando coluna last_login...")
                cursor.execute("ALTER TABLE users ADD COLUMN last_login TEXT")
        
        # Verificar se há usuários, se não, criar usuário admin
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        if user_count == 0:
            print("👤 Criando usuário admin...")
            cursor.execute('''
                INSERT INTO users (id, name, email, user_tier, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            ''', ('admin', 'Nicolas Admin', 'supernvxofc@gmail.com', 'vitalicio'))
            print("✅ Usuário admin criado")
        
        conn.commit()
        print("✅ Banco de dados corrigido com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔧 CORREÇÃO DO BANCO DE DADOS")
    print("=" * 40)
    
    success = fix_database()
    
    if success:
        print("\n✅ Correção concluída!")
        print("🚀 Agora execute o dashboard novamente")
    else:
        print("\n❌ Falha na correção")
        print("🔧 Verifique os erros acima")