"""
Database adapter that can work with both SQLite and PostgreSQL
"""
import os
import sqlite3
import json
import logging
import uuid
from typing import List, Dict, Optional, Any
from datetime import datetime
from pathlib import Path
# Removed imports of deleted files - functionality integrated directly

logger = logging.getLogger(__name__)

class DatabaseAdapter:
    """Database adapter that supports both SQLite and PostgreSQL"""
    
    def __init__(self):
        self.use_postgres = os.getenv('USE_POSTGRES', 'true').lower() == 'true'
        self.sqlite_path = Path(__file__).parent / 'database.db'
        
        if self.use_postgres:
            logger.info("Using PostgreSQL database")
        else:
            logger.info("Using SQLite database")
    
    async def init(self):
        """Initialize database connection"""
        # Force SQLite usage since PostgreSQL components were removed
        if self.use_postgres:
            logger.warning("PostgreSQL support was removed during cleanup. Forcing SQLite usage.")
            self.use_postgres = False
        
        # Initialize SQLite tables
        await self._init_sqlite_tables()
        logger.info("Database adapter initialized successfully with SQLite")
    
    async def close(self):
        """Close database connection"""
        if self.use_postgres:
            # PostgreSQL close would go here
            pass
    
    async def _init_sqlite_tables(self):
        """Initialize SQLite database tables"""
        conn = self.get_sqlite_connection()
        cursor = conn.cursor()
        
        try:
            # Create users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    email TEXT UNIQUE,
                    user_tier TEXT DEFAULT 'free',
                    tier_expires_at TEXT,
                    created_at TEXT NOT NULL
                )
            ''')

            # Create essays table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS essays (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    theme_id TEXT NOT NULL,
                    theme_title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    ai_model TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    grammar_errors TEXT DEFAULT '[]',
                    score REAL,
                    feedback TEXT,
                    corrected_at TEXT,
                    deep_analysis_feedback TEXT,
                    deep_analysis_score REAL,
                    deep_analysis_reliability TEXT,
                    deep_analysis_at TEXT
                )
            ''')
            
            # Create users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    email TEXT UNIQUE,
                    user_tier TEXT DEFAULT 'free',
                    tier_expires_at TEXT,
                    created_at TEXT NOT NULL
                )
            ''')
            
            # Add deep analysis columns to existing essays table if they don't exist
            try:
                cursor.execute('ALTER TABLE essays ADD COLUMN deep_analysis_feedback TEXT')
            except sqlite3.OperationalError:
                pass  # Column already exists
            
            try:
                cursor.execute('ALTER TABLE essays ADD COLUMN deep_analysis_score REAL')
            except sqlite3.OperationalError:
                pass  # Column already exists
            
            try:
                cursor.execute('ALTER TABLE essays ADD COLUMN deep_analysis_reliability TEXT')
            except sqlite3.OperationalError:
                pass  # Column already exists
            
            try:
                cursor.execute('ALTER TABLE essays ADD COLUMN deep_analysis_at TEXT')
            except sqlite3.OperationalError:
                pass  # Column already exists
            
            # Create custom_themes table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS custom_themes (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            ''')
            
            # Create corrections table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS corrections (
                    id TEXT PRIMARY KEY,
                    essay_id TEXT NOT NULL,
                    ai_model TEXT NOT NULL,
                    score REAL NOT NULL,
                    feedback TEXT NOT NULL,
                    suggestions TEXT DEFAULT '[]',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (essay_id) REFERENCES essays (id)
                )
            ''')
            
            # Create api_usage table for real API tracking
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS api_usage (
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
            
            # Create index for better performance
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_api_usage_model_time 
                ON api_usage(model_name, created_at)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_api_usage_user_time 
                ON api_usage(user_id, created_at)
            ''')
            
            conn.commit()
            logger.info("SQLite tables initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize SQLite tables: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def get_sqlite_connection(self):
        """Get SQLite connection"""
        return sqlite3.connect(self.sqlite_path)
    
    async def get_postgres_db(self):
        """Get PostgreSQL database instance"""
        # PostgreSQL support temporarily disabled after cleanup
        raise NotImplementedError("PostgreSQL support temporarily disabled")
    
    # User operations
    async def find_user_by_email(self, email: str) -> Optional[Dict]:
        """Find user by email"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.find_user_by_email(email)
        else:
            # SQLite fallback - create a default user for compatibility
            return {
                'id': email,  # Use email as ID for SQLite compatibility
                'email': email,
                'name': email.split('@')[0],
                'username': None,
                'google_id': None,
                'profile_picture': None,
                'stats': {}
            }
    
    async def find_user_by_username(self, username: str) -> Optional[Dict]:
        """Find user by username"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.find_user_by_username(username)
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, row))
            return None
    
    async def check_username_availability(self, username: str) -> bool:
        """Check if username is available (returns True if available)"""
        user = await self.find_user_by_username(username)
        return user is None
    
    async def update_user_username(self, user_id: str, username: str) -> bool:
        """Update user's username"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.update_user_username(user_id, username)
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            try:
                cursor.execute('UPDATE users SET username = ? WHERE id = ?', (username, user_id))
                conn.commit()
                return cursor.rowcount > 0
            except sqlite3.IntegrityError:
                # Username already exists
                return False
            finally:
                conn.close()
    
    async def create_user(self, user_data: Dict) -> Dict:
        """Create user"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.create_user(user_data)
        else:
            # SQLite doesn't have users table, return the input data
            return user_data
    
    async def update_user_last_login(self, user_id: str):
        """Update user's last login"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            await db.update_user_last_login(user_id)
        # SQLite: no-op
    
    # Essay operations
    async def insert_essay(self, essay_data: Dict) -> Dict:
        """Insert essay"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.insert_essay(essay_data)
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            essay_id = essay_data.get('id', str(uuid.uuid4()))
            cursor.execute('''
                INSERT INTO essays (id, user_id, theme_id, theme_title, content, ai_model, created_at, grammar_errors)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                essay_id,
                essay_data['user_id'],
                essay_data.get('theme_id', ''),
                essay_data.get('theme_title', essay_data.get('title', 'Untitled')),
                essay_data['content'],
                essay_data.get('ai_model', 'deepseek'),
                essay_data.get('created_at', datetime.utcnow().isoformat()),
                json.dumps(essay_data.get('grammar_errors', []))
            ))
            conn.commit()
            conn.close()
            
            essay_data['id'] = essay_id
            return essay_data
    
    async def get_essay(self, essay_id: str) -> Optional[Dict]:
        """Get essay by ID"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.get_essay(essay_id)
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM essays WHERE id = ?', (essay_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                columns = [desc[0] for desc in cursor.description]
                essay = dict(zip(columns, row))
                if essay.get('grammar_errors'):
                    try:
                        essay['grammar_errors'] = json.loads(essay['grammar_errors'])
                    except (json.JSONDecodeError, TypeError):
                        essay['grammar_errors'] = []
                return essay
            return None
    
    async def find_essay(self, essay_id: str) -> Optional[Dict]:
        """Find essay by ID (alias for get_essay)"""
        return await self.get_essay(essay_id)
    
    async def update_essay(self, essay_id: str, update_data: Dict):
        """Update essay"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            await db.update_essay(essay_id, update_data)
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            set_clauses = []
            values = []
            for key, value in update_data.items():
                if key == 'grammar_errors':
                    value = json.dumps(value)
                elif key == 'corrected_at' and isinstance(value, datetime):
                    value = value.isoformat()
                set_clauses.append(f"{key} = ?")
                values.append(value)
            
            if set_clauses:
                values.append(essay_id)
                query = f"UPDATE essays SET {', '.join(set_clauses)} WHERE id = ?"
                cursor.execute(query, values)
                conn.commit()
            conn.close()
    
    async def get_user_essays(self, user_id: str, page: int = 1, size: int = 10) -> List[Dict]:
        """Get user essays with pagination - optimized to avoid N+1 problems"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.get_user_essays(user_id, page, size)
        else:
            # SQLite implementation - optimized with LEFT JOIN to avoid N+1
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            offset = (page - 1) * size
            # Optimized query that includes correction count to avoid N+1 problems
            cursor.execute('''
                SELECT 
                    e.*,
                    COUNT(c.id) as correction_count,
                    MAX(c.created_at) as last_correction_at
                FROM essays e
                LEFT JOIN corrections c ON e.id = c.essay_id
                WHERE e.user_id = ? 
                GROUP BY e.id
                ORDER BY e.created_at DESC 
                LIMIT ? OFFSET ?
            ''', (user_id, size, offset))
            rows = cursor.fetchall()
            conn.close()
            
            essays = []
            if rows:
                columns = [desc[0] for desc in cursor.description]
                for row in rows:
                    essay = dict(zip(columns, row))
                    if essay.get('grammar_errors'):
                        try:
                            essay['grammar_errors'] = json.loads(essay['grammar_errors'])
                        except (json.JSONDecodeError, TypeError):
                            essay['grammar_errors'] = []
                    essays.append(essay)
            
            return essays
    
    async def get_scored_essays(self, user_id: str) -> List[Dict]:
        """Get scored essays"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.get_scored_essays(user_id)
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM essays WHERE user_id = ? AND score IS NOT NULL', (user_id,))
            rows = cursor.fetchall()
            conn.close()
            
            essays = []
            if rows:
                columns = [desc[0] for desc in cursor.description]
                for row in rows:
                    essay = dict(zip(columns, row))
                    if essay.get('grammar_errors'):
                        try:
                            essay['grammar_errors'] = json.loads(essay['grammar_errors'])
                        except (json.JSONDecodeError, TypeError):
                            essay['grammar_errors'] = []
                    essays.append(essay)
            
            return essays
    
    async def delete_essay(self, essay_id: str) -> bool:
        """Delete essay with transaction support"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.delete_essay(essay_id)
        else:
            # SQLite implementation with transaction
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            try:
                # Start transaction
                cursor.execute('BEGIN')
                # Delete corrections first (foreign key constraint)
                cursor.execute('DELETE FROM corrections WHERE essay_id = ?', (essay_id,))
                # Then delete the essay
                cursor.execute('DELETE FROM essays WHERE id = ?', (essay_id,))
                rows_affected = cursor.rowcount
                conn.commit()
                return rows_affected > 0
            except Exception as e:
                conn.rollback()
                raise e
            finally:
                conn.close()
    
    async def create_essay_with_correction(self, essay_data: Dict, correction_data: Optional[Dict] = None) -> Dict:
        """Create essay and optionally add correction in a single transaction"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.create_essay_with_correction(essay_data, correction_data)
        else:
            # SQLite implementation with transaction
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            try:
                cursor.execute('BEGIN')
                
                # Insert essay
                essay_id = essay_data.get('id', str(uuid.uuid4()))
                cursor.execute('''
                    INSERT INTO essays (id, user_id, theme_id, theme_title, content, ai_model, created_at, grammar_errors)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    essay_id,
                    essay_data['user_id'],
                    essay_data.get('theme_id', ''),
                    essay_data.get('theme_title', essay_data.get('title', 'Untitled')),
                    essay_data['content'],
                    essay_data.get('ai_model', 'deepseek'),
                    essay_data.get('created_at', datetime.utcnow().isoformat()),
                    json.dumps(essay_data.get('grammar_errors', []))
                ))
                
                essay_data['id'] = essay_id
                
                # Insert correction if provided
                if correction_data:
                    correction_id = str(uuid.uuid4())
                    cursor.execute('''
                        INSERT INTO corrections (id, essay_id, ai_model, score, feedback, suggestions, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        correction_id,
                        essay_id,
                        correction_data['model'],
                        correction_data['score'],
                        json.dumps(correction_data['feedback']),
                        json.dumps(correction_data.get('suggestions', [])),
                        datetime.utcnow().isoformat()
                    ))
                    essay_data['correction'] = {
                        'id': correction_id,
                        'essay_id': essay_id,
                        'model': correction_data['model'],
                        'score': correction_data['score'],
                        'feedback': correction_data['feedback'],
                        'suggestions': correction_data.get('suggestions', [])
                    }
                
                conn.commit()
                return essay_data
            except Exception as e:
                conn.rollback()
                raise e
            finally:
                conn.close()
    
    async def get_user_essay_count(self, user_id: str) -> Dict:
        """Get essay count and statistics for a user"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.get_user_essay_count(user_id)
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_essays,
                    COUNT(CASE WHEN score IS NOT NULL THEN 1 END) as scored_essays,
                    AVG(score) as avg_score,
                    MAX(score) as best_score,
                    MIN(score) as worst_score,
                    MAX(created_at) as last_essay_date
                FROM essays 
                WHERE user_id = ?
            ''', (user_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                columns = ['total_essays', 'scored_essays', 'avg_score', 'best_score', 'worst_score', 'last_essay_date']
                return dict(zip(columns, row))
            else:
                return {
                    'total_essays': 0,
                    'scored_essays': 0,
                    'avg_score': None,
                    'best_score': None,
                    'worst_score': None,
                    'last_essay_date': None
                }
    
    # Custom themes operations
    async def insert_custom_theme(self, theme_data: Dict) -> Dict:
        """Insert custom theme"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.insert_custom_theme(theme_data)
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            theme_id = theme_data.get('id', str(uuid.uuid4()))
            cursor.execute('''
                INSERT INTO custom_themes (id, user_id, title, description, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                theme_id,
                theme_data['user_id'],
                theme_data['title'],
                theme_data['description'],
                theme_data.get('created_at', datetime.utcnow().isoformat())
            ))
            conn.commit()
            conn.close()
            
            theme_data['id'] = theme_id
            return theme_data
    
    async def find_user_themes(self, user_id: str) -> List[Dict]:
        """Find user themes"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.find_user_themes(user_id)
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM custom_themes WHERE user_id = ?', (user_id,))
            rows = cursor.fetchall()
            conn.close()
            
            columns = ['id', 'user_id', 'title', 'description', 'created_at']
            return [dict(zip(columns, row)) for row in rows]
    
    # Statistics
    async def get_user_ranking(self) -> List[Dict]:
        """Get user ranking"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.get_user_ranking()
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT user_id, AVG(score) as avg_score, COUNT(*) as essay_count
                FROM essays 
                WHERE score IS NOT NULL
                GROUP BY user_id 
                ORDER BY avg_score DESC 
                LIMIT 10
            ''', ())
            rows = cursor.fetchall()
            conn.close()
            
            ranking = []
            for row in rows:
                user_id, avg_score, essay_count = row
                ranking.append({
                    'user_id': user_id,
                    'email': user_id,  # Use user_id as email for SQLite
                    'name': user_id.split('@')[0] if '@' in user_id else user_id,
                    'avg_score': avg_score,
                    'essay_count': essay_count
                })
            
            return ranking
    
    async def update_user_stats(self, user_id: str, stats_data: Dict):
        """Update user stats"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            await db.update_user_stats(user_id, stats_data)
        # SQLite: no-op
    
    # Task-related operations for background processing
    async def save_essay_correction(self, correction_data: Dict) -> Dict:
        """Save essay correction data"""
        if self.use_postgres:
            # PostgreSQL implementation would go here
            pass
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                # Update the essay with correction data
                cursor.execute('''
                    UPDATE essays 
                    SET score = ?, feedback = ?, corrected_at = ?, ai_model = ?
                    WHERE id = ?
                ''', (
                    correction_data.get("score"),
                    json.dumps(correction_data.get("feedback", {})),
                    correction_data.get("created_at"),
                    correction_data.get("model"),
                    correction_data.get("essay_id")
                ))
                
                conn.commit()
                return correction_data
                
            except Exception as e:
                conn.rollback()
                logger.error(f"Error saving essay correction: {e}")
                raise
            finally:
                conn.close()

    async def save_deep_analysis(self, analysis_data: Dict) -> Dict:
        """Save deep analysis data"""
        if self.use_postgres:
            # PostgreSQL implementation would go here
            pass
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                # Update the essay with deep analysis data
                cursor.execute('''
                    UPDATE essays 
                    SET deep_analysis_score = ?, deep_analysis_feedback = ?, 
                        deep_analysis_reliability = ?, deep_analysis_at = ?
                    WHERE id = ?
                ''', (
                    analysis_data.get("consensus_score"),
                    json.dumps(analysis_data.get("detailed_feedback", {})),
                    json.dumps({
                        "agreement_level": analysis_data.get("agreement_level"),
                        "reliability_score": analysis_data.get("reliability_score")
                    }),
                    analysis_data.get("created_at"),
                    analysis_data.get("essay_id")
                ))
                
                conn.commit()
                return analysis_data
                
            except Exception as e:
                conn.rollback()
                logger.error(f"Error saving deep analysis: {e}")
                raise
            finally:
                conn.close()

    async def get_essay_corrections(self, essay_id: str) -> List[Dict]:
        """Get corrections for an essay"""
        if self.use_postgres:
            # PostgreSQL implementation would go here
            return []
        else:
            # SQLite implementation - return essay correction data
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                cursor.execute('''
                    SELECT score, feedback, corrected_at, ai_model
                    FROM essays 
                    WHERE id = ? AND score IS NOT NULL
                ''', (essay_id,))
                
                row = cursor.fetchone()
                if row:
                    return [{
                        "score": row[0],
                        "feedback": json.loads(row[1]) if row[1] else {},
                        "created_at": row[2],
                        "model": row[3]
                    }]
                return []
                
            except Exception as e:
                logger.error(f"Error getting essay corrections: {e}")
                return []
            finally:
                conn.close()

    async def cleanup_old_corrections(self, days_old: int) -> int:
        """Clean up old correction data"""
        if self.use_postgres:
            # PostgreSQL implementation would go here
            return 0
        else:
            # SQLite implementation - for now, just return 0 as SQLite stores corrections inline
            return 0

    async def cleanup_free_user_essays(self, days_old: int = 30) -> Dict[str, int]:
        """Clean up essays from free users older than specified days"""
        if self.use_postgres:
            # PostgreSQL implementation would go here
            return {"deleted_essays": 0, "deleted_corrections": 0}
        else:
            # SQLite implementation using real tier system
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                cursor.execute('BEGIN')
                
                # Calculate cutoff date
                from datetime import datetime, timedelta
                cutoff_date = (datetime.utcnow() - timedelta(days=days_old)).isoformat()
                
                # Check if users table with tier system exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
                users_table_exists = cursor.fetchone() is not None
                
                if users_table_exists:
                    # Check if tier columns exist
                    cursor.execute("PRAGMA table_info(users)")
                    columns = [column[1] for column in cursor.fetchall()]
                    
                    if 'user_tier' in columns:
                        # Use real tier system - only delete from 'free' users
                        # Premium and vitalicio users are preserved
                        query = '''
                            SELECT e.id FROM essays e
                            JOIN users u ON e.user_id = u.id
                            WHERE e.created_at < ? 
                            AND u.user_tier = 'free'
                        '''
                        params = [cutoff_date]
                        logger.info("Using real tier system for cleanup")
                    else:
                        # Fallback to heuristic method
                        logger.warning("Tier columns not found, using heuristic method")
                        query, params = self._get_heuristic_cleanup_query(cursor, cutoff_date)
                else:
                    # Fallback to heuristic method
                    logger.warning("Users table not found, using heuristic method")
                    query, params = self._get_heuristic_cleanup_query(cursor, cutoff_date)
                
                cursor.execute(query, params)
                essays_to_delete = [row[0] for row in cursor.fetchall()]
                
                deleted_essays = 0
                deleted_corrections = 0
                
                # Delete essays and their corrections
                for essay_id in essays_to_delete:
                    # Delete corrections first (foreign key constraint)
                    cursor.execute('DELETE FROM corrections WHERE essay_id = ?', (essay_id,))
                    deleted_corrections += cursor.rowcount
                    
                    # Delete the essay
                    cursor.execute('DELETE FROM essays WHERE id = ?', (essay_id,))
                    deleted_essays += cursor.rowcount
                
                conn.commit()
                
                logger.info(f"Cleanup completed: {deleted_essays} essays and {deleted_corrections} corrections deleted")
                return {
                    "deleted_essays": deleted_essays,
                    "deleted_corrections": deleted_corrections
                }
                
            except Exception as e:
                conn.rollback()
                logger.error(f"Error during essay cleanup: {e}")
                raise
            finally:
                conn.close()

    def _get_heuristic_cleanup_query(self, cursor, cutoff_date):
        """Fallback heuristic method for cleanup when tier system is not available"""
        # Get user essay counts to identify potential premium users
        cursor.execute('''
            SELECT user_id, COUNT(*) as essay_count
            FROM essays 
            GROUP BY user_id
            HAVING essay_count > 50
        ''')
        premium_users = [row[0] for row in cursor.fetchall()]
        
        # Build query to exclude premium users
        if premium_users:
            placeholders = ','.join(['?' for _ in premium_users])
            query = f'''
                SELECT id FROM essays 
                WHERE created_at < ? 
                AND user_id NOT IN ({placeholders})
            '''
            params = [cutoff_date] + premium_users
        else:
            query = 'SELECT id FROM essays WHERE created_at < ?'
            params = [cutoff_date]
        
        return query, params

    async def get_user_tier(self, user_id: str) -> str:
        """Get user tier (free/premium/vitalicio) from database"""
        if self.use_postgres:
            # PostgreSQL implementation would check user subscription
            # For now, return 'free' as default
            return 'free'
        else:
            # SQLite implementation - check user_tier field
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                # First try to get from users table if it exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
                if cursor.fetchone():
                    cursor.execute('SELECT user_tier FROM users WHERE id = ?', (user_id,))
                    result = cursor.fetchone()
                    if result:
                        return result[0]
                
                # Fallback: heuristic based on essay count (for backward compatibility)
                cursor.execute('SELECT COUNT(*) FROM essays WHERE user_id = ?', (user_id,))
                essay_count = cursor.fetchone()[0]
                
                # Simple heuristic: users with more than 50 essays are likely premium
                return 'premium' if essay_count > 50 else 'free'
                
            except Exception as e:
                logger.error(f"Error getting user tier: {e}")
                return 'free'
            finally:
                conn.close()

    async def update_user_tier(self, user_id: str, tier: str, expires_at: str = None) -> bool:
        """Update user tier and expiration date (with robust upsert logic)"""
        conn = self.get_sqlite_connection()
        cursor = conn.cursor()
        try:
            # Step 1: Ensure the user exists. If not, create them.
            cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
            user_exists = cursor.fetchone()

            if not user_exists:
                logger.info(f"User '{user_id}' not found. Creating a new record.")
                name = user_id.split('@')[0] if '@' in user_id else user_id
                created_at = datetime.utcnow().isoformat()
                cursor.execute(
                    "INSERT INTO users (id, name, email, user_tier, created_at) VALUES (?, ?, ?, ?, ?)",
                    (user_id, name, user_id, 'free', created_at)
                )

            # Step 2: Update the user's tier.
            if expires_at:
                cursor.execute(
                    'UPDATE users SET user_tier = ?, tier_expires_at = ? WHERE id = ?',
                    (tier, expires_at, user_id)
                )
            else:
                cursor.execute(
                    'UPDATE users SET user_tier = ?, tier_expires_at = NULL WHERE id = ?',
                    (tier, user_id)
                )
            
            conn.commit()
            success = cursor.rowcount > 0

            # If the user was just created, rowcount for the UPDATE will be 1.
            # If the user existed, it will also be 1. If nothing changed, it might be 0.
            # The creation step makes this logic more reliable.
            if user_exists and not success:
                 logger.warning(f"Tier for user {user_id} was already set to {tier}. No changes made.")
                 return True # Consider it a success if the state is already correct

            logger.info(f"Successfully set tier for {user_id} to {tier}.")
            return True

        except Exception as e:
            conn.rollback()
            logger.error(f"Database error in update_user_tier for {user_id}: {e}")
            return False
        finally:
            conn.close()

    async def check_tier_expiration(self, user_id: str) -> bool:
        """Check if user's premium tier has expired and downgrade if necessary"""
        if self.use_postgres:
            # PostgreSQL implementation would go here
            return False
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                cursor.execute(
                    'SELECT user_tier, tier_expires_at FROM users WHERE id = ?',
                    (user_id,)
                )
                result = cursor.fetchone()
                
                if not result:
                    return False
                
                tier, expires_at = result
                
                # Vitalicio users never expire
                if tier == 'vitalicio':
                    return False
                
                # Free users don't have expiration
                if tier == 'free':
                    return False
                
                # Check if premium tier has expired
                if tier == 'premium' and expires_at:
                    from datetime import datetime
                    expiry_date = datetime.fromisoformat(expires_at)
                    
                    if datetime.utcnow() > expiry_date:
                        # Downgrade to free
                        cursor.execute(
                            'UPDATE users SET user_tier = ?, tier_expires_at = NULL WHERE id = ?',
                            ('free', user_id)
                        )
                        conn.commit()
                        logger.info(f"User {user_id} premium tier expired, downgraded to free")
                        return True
                
                return False
                
            except Exception as e:
                logger.error(f"Error checking tier expiration: {e}")
                return False
            finally:
                conn.close()

    async def get_user_tier_details(self, user_id: str) -> Optional[Dict]:
        """Get detailed tier information for a user"""
        if self.use_postgres:
            # PostgreSQL implementation would go here
            return None
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                # Check if users table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
                if not cursor.fetchone():
                    return None
                
                cursor.execute(
                    'SELECT user_tier, tier_expires_at, created_at FROM users WHERE id = ?',
                    (user_id,)
                )
                result = cursor.fetchone()
                
                if result:
                    return {
                        'user_tier': result[0],
                        'tier_expires_at': result[1],
                        'created_at': result[2]
                    }
                
                return None
                
            except Exception as e:
                logger.error(f"Error getting user tier details: {e}")
                return None
            finally:
                conn.close()

    async def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user data"""
        return await self.find_user_by_email(user_id)
    
    # API Usage tracking methods
    async def log_api_usage(self, model_name: str, user_id: str, request_type: str, 
                           response_time: float, success: bool, error_message: str = None, 
                           tokens_used: int = None) -> None:
        """Log API usage for real tracking"""
        if self.use_postgres:
            # PostgreSQL implementation would go here
            pass
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                usage_id = str(uuid.uuid4())
                cursor.execute('''
                    INSERT INTO api_usage (id, model_name, user_id, request_type, 
                                         response_time, success, error_message, tokens_used, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    usage_id,
                    model_name,
                    user_id,
                    request_type,
                    response_time,
                    success,
                    error_message,
                    tokens_used,
                    datetime.utcnow().isoformat()
                ))
                conn.commit()
            except Exception as e:
                logger.error(f"Error logging API usage: {e}")
            finally:
                conn.close()
    
    async def get_api_usage_stats(self, hours: int = 24) -> List[Dict]:
        """Get real API usage statistics"""
        if self.use_postgres:
            # PostgreSQL implementation would go here
            return []
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                # Calculate time window
                from datetime import datetime, timedelta
                cutoff_time = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
                
                cursor.execute('''
                    SELECT 
                        model_name,
                        COUNT(*) as total_calls,
                        AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate,
                        AVG(response_time) as avg_response_time,
                        COUNT(CASE WHEN created_at >= ? THEN 1 END) as recent_calls,
                        MIN(created_at) as first_call,
                        MAX(created_at) as last_call
                    FROM api_usage 
                    GROUP BY model_name
                    ORDER BY total_calls DESC
                ''', (cutoff_time,))
                
                rows = cursor.fetchall()
                stats = []
                
                for row in rows:
                    stats.append({
                        "model_name": row[0],
                        "total_calls": row[1],
                        "success_rate": row[2] or 0.0,
                        "avg_response_time": row[3] or 0.0,
                        "last_24h_calls": row[4],
                        "first_call": row[5],
                        "last_call": row[6]
                    })
                
                return stats
                
            except Exception as e:
                logger.error(f"Error getting API usage stats: {e}")
                return []
            finally:
                conn.close()
    
    async def get_api_usage_timeline(self, model_name: str = None, hours: int = 24) -> List[Dict]:
        """Get API usage timeline for charts"""
        if self.use_postgres:
            # PostgreSQL implementation would go here
            return []
        else:
            # SQLite implementation
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            
            try:
                # Calculate time window
                from datetime import datetime, timedelta
                cutoff_time = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
                
                if model_name:
                    cursor.execute('''
                        SELECT 
                            STRFTIME('%Y-%m-%d %H:00:00', created_at) as hour,
                            model_name,
                            COUNT(*) as calls,
                            AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate,
                            AVG(response_time) as avg_response_time
                        FROM api_usage 
                        WHERE model_name = ? AND created_at >= ?
                        GROUP BY hour, model_name
                        ORDER BY hour ASC
                    ''', (model_name, cutoff_time))
                else:
                    cursor.execute('''
                        SELECT 
                            STRFTIME('%Y-%m-%d %H:00:00', created_at) as hour,
                            model_name,
                            COUNT(*) as calls,
                            AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate,
                            AVG(response_time) as avg_response_time
                        FROM api_usage 
                        WHERE created_at >= ?
                        GROUP BY hour, model_name
                        ORDER BY hour ASC
                    ''', (cutoff_time,))
                
                rows = cursor.fetchall()
                timeline = []
                
                for row in rows:
                    timeline.append({
                        "hour": row[0],
                        "model_name": row[1],
                        "calls": row[2],
                        "success_rate": row[3] or 0.0,
                        "avg_response_time": row[4] or 0.0
                    })
                
                return timeline
                
            except Exception as e:
                logger.error(f"Error getting API usage timeline: {e}")
                return []
            finally:
                conn.close()

    # Health check
    async def health_check(self) -> Dict:
        """Health check"""
        if self.use_postgres:
            db = await self.get_postgres_db()
            return await db.health_check()
        else:
            try:
                conn = self.get_sqlite_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                conn.close()
                return {"status": "healthy", "database": "sqlite"}
            except Exception as e:
                return {"status": "unhealthy", "database": "sqlite", "error": str(e)}

# Global database adapter instance
db_adapter = DatabaseAdapter()

async def get_user_essays_dates(self, user_id: str) -> List[Dict]:
    """Get creation dates of all user essays."""
    conn = self.get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT created_at FROM essays WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

async def get_user_distinct_themes(self, user_id: str) -> List[str]:
    """Get the count of distinct themes for a user's essays."""
    conn = self.get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT theme_title FROM essays WHERE user_id = ?', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [row[0] for row in rows]

async def get_user_essays_by_month(self, user_id: str) -> Dict[str, int]:
    """Get the count of essays per month for a user."""
    conn = self.get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT STRFTIME('%Y-%m', created_at) as month, COUNT(id) as essay_count
        FROM essays
        WHERE user_id = ?
        GROUP BY month
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return {row['month']: row['essay_count'] for row in rows}

async def get_theme_comparison_data(self, user_id: str, theme_title: str) -> Dict:
    """Get comparison data for a specific theme"""
    conn = self.get_sqlite_connection()
    cursor = conn.cursor()
    
    try:
        # Get user's performance for this theme
        cursor.execute("""
            SELECT 
                AVG(score) as user_avg_score,
                COUNT(*) as user_essay_count,
                MAX(score) as user_best_score,
                MIN(score) as user_worst_score,
                AVG(LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1) as user_avg_words
            FROM essays 
            WHERE user_id = ? AND theme_title = ? AND score IS NOT NULL
        """, (user_id, theme_title))
        user_data = cursor.fetchone()
        
        # Get all users' performance for this theme (excluding current user)
        cursor.execute("""
            SELECT 
                AVG(score) as theme_avg_score,
                COUNT(DISTINCT user_id) as total_users,
                COUNT(*) as total_essays,
                MAX(score) as theme_best_score,
                MIN(score) as theme_worst_score,
                AVG(LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1) as theme_avg_words
            FROM essays 
            WHERE theme_title = ? AND score IS NOT NULL AND user_id != ?
        """, (theme_title, user_id))
        theme_data = cursor.fetchone()
        
        # Get percentile calculation
        cursor.execute("""
            SELECT COUNT(*) as users_below
            FROM (
                SELECT user_id, AVG(score) as avg_score
                FROM essays 
                WHERE theme_title = ? AND score IS NOT NULL AND user_id != ?
                GROUP BY user_id
                HAVING avg_score < ?
            )
        """, (theme_title, user_id, user_data[0] if user_data[0] else 0))
        users_below = cursor.fetchone()[0]
        
        # Get total users for percentile calculation
        cursor.execute("""
            SELECT COUNT(DISTINCT user_id) as total_users_with_scores
            FROM essays 
            WHERE theme_title = ? AND score IS NOT NULL
        """, (theme_title,))
        total_users_with_scores = cursor.fetchone()[0]
        
        # Calculate user percentile
        user_percentile = 0
        if total_users_with_scores > 1:
            user_percentile = round((users_below / (total_users_with_scores - 1)) * 100)
        
        # Get competency averages for this theme
        cursor.execute("""
            SELECT user_id, score, feedback
            FROM essays 
            WHERE theme_title = ? AND score IS NOT NULL AND feedback IS NOT NULL
        """, (theme_title,))
        essays_with_feedback = cursor.fetchall()
        
        # Process competency data
        user_competencies = {}
        theme_competencies = {}
        
        for essay in essays_with_feedback:
            essay_user_id, score, feedback_json = essay
            try:
                feedback = json.loads(feedback_json) if feedback_json else {}
                competencies = feedback.get('competencies', {})
                
                if essay_user_id == user_id:
                    for comp, data in competencies.items():
                        if comp not in user_competencies:
                            user_competencies[comp] = []
                        user_competencies[comp].append(data.get('score', 0))
                else:
                    for comp, data in competencies.items():
                        if comp not in theme_competencies:
                            theme_competencies[comp] = []
                        theme_competencies[comp].append(data.get('score', 0))
            except (json.JSONDecodeError, AttributeError):
                continue
        
        # Calculate averages
        user_comp_averages = {}
        theme_comp_averages = {}
        
        for comp, scores in user_competencies.items():
            user_comp_averages[comp] = sum(scores) / len(scores) if scores else 0
            
        for comp, scores in theme_competencies.items():
            theme_comp_averages[comp] = sum(scores) / len(scores) if scores else 0
        
        return {
            'theme_title': theme_title,
            'user_data': {
                'avg_score': user_data[0] if user_data[0] else 0,
                'essay_count': user_data[1] if user_data[1] else 0,
                'best_score': user_data[2] if user_data[2] else 0,
                'worst_score': user_data[3] if user_data[3] else 0,
                'avg_words': round(user_data[4]) if user_data[4] else 0,
                'competencies': user_comp_averages,
                'percentile': user_percentile
            },
            'theme_data': {
                'avg_score': theme_data[0] if theme_data[0] else 0,
                'total_users': theme_data[1] if theme_data[1] else 0,
                'total_essays': theme_data[2] if theme_data[2] else 0,
                'best_score': theme_data[3] if theme_data[3] else 0,
                'worst_score': theme_data[4] if theme_data[4] else 0,
                'avg_words': round(theme_data[5]) if theme_data[5] else 0,
                'competencies': theme_comp_averages
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting theme comparison data: {e}")
        return {
            'theme_title': theme_title,
            'user_data': {
                'avg_score': 0, 'essay_count': 0, 'best_score': 0, 
                'worst_score': 0, 'avg_words': 0, 'competencies': {}, 'percentile': 0
            },
            'theme_data': {
                'avg_score': 0, 'total_users': 0, 'total_essays': 0, 
                'best_score': 0, 'worst_score': 0, 'avg_words': 0, 'competencies': {}
            }
        }
    finally:
        conn.close()

    async def get_user_analysis_usage(self, user_id: str, analysis_type: str, since: datetime) -> int:
        """Get user's analysis usage count since a specific date"""
        try:
            if self.use_postgres:
                # PostgreSQL implementation (when available)
                pass
            else:
                # SQLite implementation
                conn = sqlite3.connect(self.sqlite_path)
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM analysis_usage 
                    WHERE user_id = ? AND analysis_type = ? AND created_at >= ?
                """, (user_id, analysis_type, since.isoformat()))
                
                result = cursor.fetchone()
                conn.close()
                
                return result[0] if result else 0
                
        except Exception as e:
            logger.error(f"Error getting user analysis usage: {e}")
            return 0

    async def log_analysis_usage(self, user_id: str, analysis_type: str, timestamp: datetime) -> bool:
        """Log analysis usage for rate limiting"""
        try:
            if self.use_postgres:
                # PostgreSQL implementation (when available)
                pass
            else:
                # SQLite implementation
                conn = sqlite3.connect(self.sqlite_path)
                cursor = conn.cursor()
                
                usage_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO analysis_usage (id, user_id, analysis_type, created_at)
                    VALUES (?, ?, ?, ?)
                """, (usage_id, user_id, analysis_type, timestamp.isoformat()))
                
                conn.commit()
                conn.close()
                
                return True
                
        except Exception as e:
            logger.error(f"Error logging analysis usage: {e}")
            return False

# Add the new methods to the class
DatabaseAdapter.get_user_essays_dates = get_user_essays_dates
DatabaseAdapter.get_user_distinct_themes = get_user_distinct_themes
DatabaseAdapter.get_user_essays_by_month = get_user_essays_by_month
DatabaseAdapter.get_theme_comparison_data = get_theme_comparison_data

# Global database adapter instance
db_adapter = DatabaseAdapter()
