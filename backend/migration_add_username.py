#!/usr/bin/env python3
"""
Migration script to add username column to users table
"""
import sqlite3
import os
from pathlib import Path

def migrate_database():
    """Add username column to existing users table"""
    db_path = Path(__file__).parent / 'database.db'
    
    if not db_path.exists():
        print("Database file not found. Creating new database with username support.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if username column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'username' in columns:
            print("Username column already exists in users table.")
            return
        
        print("Adding username column to users table...")
        
        # Add username column
        cursor.execute('ALTER TABLE users ADD COLUMN username TEXT UNIQUE')
        
        # Create index for username
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
        
        conn.commit()
        print("Successfully added username column and index.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()