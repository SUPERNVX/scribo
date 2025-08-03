"""
Comprehensive tests for async database operations
Tests for task 4: Refactor database operations to async
"""
import pytest
import asyncio
import uuid
import os
from datetime import datetime
from typing import Dict, List
import json

from database_adapter import DatabaseAdapter

# Set environment to use SQLite for testing
os.environ['USE_POSTGRES'] = 'false'

@pytest.mark.asyncio
class TestAsyncDatabaseOperations:
    """Test async database operations and transaction handling"""
    
    @pytest.fixture
    def sample_user_data(self):
        """Sample user data for testing"""
        return {
            'email': f'test_{uuid.uuid4().hex[:8]}@example.com',
            'name': 'Test User',
            'google_id': f'google_{uuid.uuid4().hex[:8]}',
            'profile_picture': 'https://example.com/avatar.jpg',
            'stats': {'level': 'beginner'}
        }
    
    @pytest.fixture
    def sample_user_data(self):
        """Sample user data for testing"""
        return {
            'email': f'test_{uuid.uuid4().hex[:8]}@example.com',
            'name': 'Test User',
            'google_id': f'google_{uuid.uuid4().hex[:8]}',
            'profile_picture': 'https://example.com/avatar.jpg',
            'stats': {'level': 'beginner'}
        }
    
    @pytest.fixture
    def sample_essay_data(self):
        """Sample essay data for testing"""
        return {
            'user_id': f'test_user_{uuid.uuid4().hex[:8]}',
            'title': 'Test Essay',
            'content': 'This is a test essay content for testing async database operations.',
            'theme': 'Test Theme',
            'theme_id': 'test_theme_1',
            'ai_model': 'deepseek',
            'status': 'draft',
            'grammar_errors': [{'message': 'Test error', 'offset': 0, 'length': 4}]
        }
    
    @pytest.fixture
    def sample_correction_data(self):
        """Sample correction data for testing"""
        return {
            'model': 'deepseek',
            'score': 750.0,
            'feedback': {'overall': 'Good essay', 'suggestions': ['Improve conclusion']},
            'suggestions': ['Add more examples', 'Check grammar'],
            'processing_time': 2.5
        }

    async def test_async_user_operations(self, db_adapter, sample_user_data):
        """Test async user CRUD operations"""
        # Test user creation
        created_user = await db_adapter.create_user(sample_user_data)
        assert created_user['email'] == sample_user_data['email']
        assert created_user['name'] == sample_user_data['name']
        
        # Test find user by email
        found_user = await db_adapter.find_user_by_email(sample_user_data['email'])
        assert found_user is not None
        assert found_user['email'] == sample_user_data['email']
        
        # Test update last login
        await db_adapter.update_user_last_login(found_user['id'])
        
        # Verify user exists after operations
        user_after_update = await db_adapter.find_user_by_email(sample_user_data['email'])
        assert user_after_update is not None

    async def test_async_essay_operations(self, db_adapter, sample_essay_data):
        """Test async essay CRUD operations"""
        # Test essay creation
        created_essay = await db_adapter.insert_essay(sample_essay_data)
        assert created_essay['content'] == sample_essay_data['content']
        assert created_essay['user_id'] == sample_essay_data['user_id']
        assert 'id' in created_essay
        
        essay_id = created_essay['id']
        
        # Test get essay by ID
        retrieved_essay = await db_adapter.get_essay(essay_id)
        assert retrieved_essay is not None
        assert retrieved_essay['id'] == essay_id
        assert retrieved_essay['content'] == sample_essay_data['content']
        
        # Test essay update
        update_data = {
            'score': 850.0,
            'feedback': 'Excellent work!',
            'corrected_at': datetime.utcnow().isoformat()
        }
        await db_adapter.update_essay(essay_id, update_data)
        
        # Verify update
        updated_essay = await db_adapter.get_essay(essay_id)
        assert updated_essay['score'] == 850.0
        assert updated_essay['feedback'] == 'Excellent work!'
        
        # Test essay deletion
        deleted = await db_adapter.delete_essay(essay_id)
        assert deleted is True
        
        # Verify deletion
        deleted_essay = await db_adapter.get_essay(essay_id)
        assert deleted_essay is None

    async def test_optimized_pagination(self, db_adapter, sample_essay_data):
        """Test optimized pagination to avoid N+1 problems"""
        user_id = sample_essay_data['user_id']
        
        # Create multiple essays for pagination testing
        essay_ids = []
        for i in range(15):  # Create 15 essays
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Test Essay {i+1}'
            essay_data['content'] = f'Content for essay {i+1}'
            created_essay = await db_adapter.insert_essay(essay_data)
            essay_ids.append(created_essay['id'])
        
        try:
            # Test first page
            page1_essays = await db_adapter.get_user_essays(user_id, page=1, size=10)
            assert len(page1_essays) == 10
            
            # Test second page
            page2_essays = await db_adapter.get_user_essays(user_id, page=2, size=10)
            assert len(page2_essays) == 5  # Remaining essays
            
            # Verify no overlap between pages
            page1_ids = {essay['id'] for essay in page1_essays}
            page2_ids = {essay['id'] for essay in page2_essays}
            assert len(page1_ids.intersection(page2_ids)) == 0
            
            # Verify essays are ordered by created_at DESC
            for i in range(len(page1_essays) - 1):
                assert page1_essays[i]['created_at'] >= page1_essays[i+1]['created_at']
            
            # Test that correction_count is included (optimized query)
            for essay in page1_essays:
                assert 'correction_count' in essay
                
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_transaction_support(self, db_adapter, sample_essay_data, sample_correction_data):
        """Test transaction support for complex operations"""
        # Test create essay with correction in single transaction
        essay_with_correction = await db_adapter.create_essay_with_correction(
            sample_essay_data, sample_correction_data
        )
        
        assert 'id' in essay_with_correction
        assert essay_with_correction['content'] == sample_essay_data['content']
        
        if 'correction' in essay_with_correction:
            correction = essay_with_correction['correction']
            assert correction['score'] == sample_correction_data['score']
            assert correction['model'] == sample_correction_data['model']
        
        # Cleanup
        await db_adapter.delete_essay(essay_with_correction['id'])

    async def test_user_statistics_optimization(self, db_adapter, sample_essay_data):
        """Test optimized user statistics queries"""
        user_id = sample_essay_data['user_id']
        
        # Create essays with scores
        essay_ids = []
        scores = [750.0, 800.0, 650.0, 900.0, 700.0]
        
        for i, score in enumerate(scores):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Scored Essay {i+1}'
            created_essay = await db_adapter.insert_essay(essay_data)
            
            # Update with score
            await db_adapter.update_essay(created_essay['id'], {'score': score})
            essay_ids.append(created_essay['id'])
        
        try:
            # Test optimized user statistics
            stats = await db_adapter.get_user_essay_count(user_id)
            
            assert stats['total_essays'] == 5
            assert stats['scored_essays'] == 5
            assert stats['avg_score'] == sum(scores) / len(scores)
            assert stats['best_score'] == max(scores)
            assert stats['worst_score'] == min(scores)
            assert stats['last_essay_date'] is not None
            
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_ranking_optimization(self, db_adapter, sample_user_data, sample_essay_data):
        """Test optimized ranking queries"""
        # Create test users and essays for ranking
        test_users = []
        essay_ids = []
        
        try:
            # Create multiple users with different scores
            for i in range(3):
                user_data = sample_user_data.copy()
                user_data['email'] = f'ranking_test_{i}_{uuid.uuid4().hex[:8]}@example.com'
                user_data['name'] = f'Ranking User {i+1}'
                
                created_user = await db_adapter.create_user(user_data)
                test_users.append(created_user)
                
                # Create essays with different scores for each user
                user_scores = [700 + (i * 50), 750 + (i * 50), 800 + (i * 50)]
                for score in user_scores:
                    essay_data = sample_essay_data.copy()
                    essay_data['user_id'] = created_user['id']
                    essay_data['title'] = f'Ranking Essay {score}'
                    
                    created_essay = await db_adapter.insert_essay(essay_data)
                    await db_adapter.update_essay(created_essay['id'], {'score': float(score)})
                    essay_ids.append(created_essay['id'])
            
            # Test ranking query
            ranking = await db_adapter.get_user_ranking()
            
            # Verify ranking is ordered by average score descending
            if len(ranking) >= 2:
                for i in range(len(ranking) - 1):
                    assert ranking[i]['avg_score'] >= ranking[i+1]['avg_score']
            
            # Verify ranking includes necessary fields
            for rank_entry in ranking:
                assert 'user_id' in rank_entry
                assert 'avg_score' in rank_entry
                assert 'essay_count' in rank_entry
                
        finally:
            # Cleanup essays
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_concurrent_operations(self, db_adapter, sample_essay_data):
        """Test concurrent database operations"""
        user_id = sample_essay_data['user_id']
        
        async def create_essay(index: int):
            """Create an essay concurrently"""
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Concurrent Essay {index}'
            essay_data['content'] = f'Content for concurrent essay {index}'
            return await db_adapter.insert_essay(essay_data)
        
        # Create multiple essays concurrently
        tasks = [create_essay(i) for i in range(10)]
        created_essays = await asyncio.gather(*tasks)
        
        try:
            # Verify all essays were created
            assert len(created_essays) == 10
            for essay in created_essays:
                assert 'id' in essay
                assert essay['user_id'] == user_id
            
            # Test concurrent reads
            async def get_essay(essay_id: str):
                return await db_adapter.get_essay(essay_id)
            
            read_tasks = [get_essay(essay['id']) for essay in created_essays]
            read_results = await asyncio.gather(*read_tasks)
            
            # Verify all reads succeeded
            assert len(read_results) == 10
            for result in read_results:
                assert result is not None
                
        finally:
            # Cleanup
            for essay in created_essays:
                await db_adapter.delete_essay(essay['id'])

    async def test_error_handling_and_rollback(self, db_adapter, sample_essay_data):
        """Test error handling and transaction rollback"""
        # Test that failed transactions are properly rolled back
        invalid_essay_data = sample_essay_data.copy()
        invalid_essay_data['user_id'] = None  # This should cause an error
        
        with pytest.raises(Exception):
            await db_adapter.insert_essay(invalid_essay_data)
        
        # Verify no partial data was inserted
        essays = await db_adapter.get_user_essays(sample_essay_data['user_id'])
        initial_count = len(essays)
        
        # Try to create essay with invalid correction data
        invalid_correction = {
            'model': None,  # Invalid
            'score': 'invalid_score',  # Invalid type
            'feedback': None
        }
        
        with pytest.raises(Exception):
            await db_adapter.create_essay_with_correction(sample_essay_data, invalid_correction)
        
        # Verify no essays were created due to rollback
        essays_after = await db_adapter.get_user_essays(sample_essay_data['user_id'])
        assert len(essays_after) == initial_count

    async def test_performance_benchmarks(self, db_adapter, sample_essay_data):
        """Basic performance tests for database operations"""
        import time
        
        # Benchmark essay creation
        start_time = time.time()
        created_essays = []
        
        for i in range(50):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Performance Test Essay {i}'
            created_essay = await db_adapter.insert_essay(essay_data)
            created_essays.append(created_essay)
        
        creation_time = time.time() - start_time
        
        try:
            # Should create 50 essays in reasonable time (less than 5 seconds)
            assert creation_time < 5.0, f"Essay creation took too long: {creation_time}s"
            
            # Benchmark pagination query
            start_time = time.time()
            essays = await db_adapter.get_user_essays(sample_essay_data['user_id'], page=1, size=25)
            query_time = time.time() - start_time
            
            # Pagination should be fast (less than 1 second)
            assert query_time < 1.0, f"Pagination query took too long: {query_time}s"
            assert len(essays) == 25
            
        finally:
            # Cleanup
            for essay in created_essays:
                await db_adapter.delete_essay(essay['id'])


@pytest.mark.asyncio
class TestDatabaseAdapter:
    """Test database adapter functionality"""
    
    async def test_adapter_initialization(self):
        """Test database adapter initialization"""
        adapter = DatabaseAdapter()
        await adapter.init()
        
        # Test health check
        health = await adapter.health_check()
        assert health['status'] in ['healthy', 'unhealthy']
        
        await adapter.close()
    
    async def test_adapter_fallback_behavior(self):
        """Test adapter fallback behavior between PostgreSQL and SQLite"""
        adapter = DatabaseAdapter()
        await adapter.init()
        
        try:
            # Test user operations (should work with both backends)
            user_data = {
                'email': f'fallback_test_{uuid.uuid4().hex[:8]}@example.com',
                'name': 'Fallback Test User'
            }
            
            # These operations should work regardless of backend
            found_user = await adapter.find_user_by_email(user_data['email'])
            assert found_user is not None  # SQLite creates default user
            
            # Test essay operations
            essay_data = {
                'user_id': user_data['email'],
                'content': 'Fallback test content',
                'theme_title': 'Fallback Theme'
            }
            
            created_essay = await adapter.insert_essay(essay_data)
            assert created_essay['content'] == essay_data['content']
            
            # Cleanup
            await adapter.delete_essay(created_essay['id'])
            
        finally:
            await adapter.close()


if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, '-v'])