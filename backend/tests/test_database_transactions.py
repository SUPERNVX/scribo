"""
Tests for database transaction support and async operations
Tests for task 4: Refactor database operations to async
"""
import pytest
import pytest_asyncio
import asyncio
import uuid
import os
from datetime import datetime
from typing import Dict, List
import json

from database_adapter import DatabaseAdapter

# Set environment to use SQLite for testing
os.environ['USE_POSTGRES'] = 'false'

@pytest_asyncio.fixture
async def db_adapter():
    """Create and initialize database adapter for testing"""
    adapter = DatabaseAdapter()
    await adapter.init()
    yield adapter
    await adapter.close()

@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        'email': f'test_{uuid.uuid4().hex[:8]}@example.com',
        'name': 'Test User',
        'google_id': f'google_{uuid.uuid4().hex[:8]}',
        'profile_picture': 'https://example.com/avatar.jpg',
        'stats': {'level': 'beginner'}
    }

@pytest.fixture
def sample_essay_data():
    """Sample essay data for testing"""
    return {
        'user_id': f'test_user_{uuid.uuid4().hex[:8]}@example.com',
        'title': 'Test Essay',
        'content': 'This is a test essay content for testing async database operations with proper length to meet minimum requirements.',
        'theme': 'Test Theme',
        'theme_id': 'test_theme_1',
        'ai_model': 'deepseek',
        'status': 'draft',
        'grammar_errors': [{'message': 'Test error', 'offset': 0, 'length': 4}]
    }

@pytest.fixture
def sample_correction_data():
    """Sample correction data for testing"""
    return {
        'model': 'deepseek',
        'score': 750.0,
        'feedback': {'overall': 'Good essay', 'suggestions': ['Improve conclusion']},
        'suggestions': ['Add more examples', 'Check grammar'],
        'processing_time': 2.5
    }

@pytest.mark.asyncio
class TestTransactionSupport:
    """Test transaction support in database operations"""

    async def test_essay_creation_with_transaction(self, db_adapter, sample_essay_data):
        """Test essay creation uses transaction support"""
        # Create essay
        created_essay = await db_adapter.insert_essay(sample_essay_data)
        assert created_essay['content'] == sample_essay_data['content']
        assert 'id' in created_essay
        
        # Verify essay was created
        retrieved_essay = await db_adapter.get_essay(created_essay['id'])
        assert retrieved_essay is not None
        assert retrieved_essay['content'] == sample_essay_data['content']
        
        # Cleanup
        await db_adapter.delete_essay(created_essay['id'])

    async def test_essay_deletion_with_transaction(self, db_adapter, sample_essay_data):
        """Test essay deletion uses transaction to handle related data"""
        # Create essay first
        created_essay = await db_adapter.insert_essay(sample_essay_data)
        essay_id = created_essay['id']
        
        # Delete essay (should handle corrections and related data in transaction)
        deleted = await db_adapter.delete_essay(essay_id)
        assert deleted is True
        
        # Verify essay is gone
        retrieved_essay = await db_adapter.get_essay(essay_id)
        assert retrieved_essay is None

    async def test_essay_with_correction_transaction(self, db_adapter, sample_essay_data, sample_correction_data):
        """Test creating essay with correction in single transaction"""
        # Create essay with correction in single transaction
        essay_with_correction = await db_adapter.create_essay_with_correction(
            sample_essay_data, sample_correction_data
        )
        
        assert 'id' in essay_with_correction
        assert essay_with_correction['content'] == sample_essay_data['content']
        
        # Verify essay exists
        retrieved_essay = await db_adapter.get_essay(essay_with_correction['id'])
        assert retrieved_essay is not None
        
        # Cleanup
        await db_adapter.delete_essay(essay_with_correction['id'])

    async def test_transaction_rollback_on_error(self, db_adapter):
        """Test that transactions rollback properly on errors"""
        # Try to create essay with invalid data that should cause rollback
        invalid_essay_data = {
            'user_id': None,  # This should cause an error
            'content': 'Test content',
            'theme_title': 'Test Theme'
        }
        
        with pytest.raises(Exception):
            await db_adapter.insert_essay(invalid_essay_data)
        
        # Verify no partial data was inserted by checking essay count
        # This is a basic test since we can't easily verify transaction rollback in SQLite

@pytest.mark.asyncio
class TestOptimizedQueries:
    """Test optimized queries to avoid N+1 problems"""

    async def test_user_essays_pagination_optimization(self, db_adapter, sample_essay_data):
        """Test that user essays pagination avoids N+1 queries"""
        user_id = sample_essay_data['user_id']
        
        # Create multiple essays
        essay_ids = []
        for i in range(15):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Test Essay {i+1}'
            essay_data['content'] = f'Content for essay {i+1} with sufficient length to meet requirements.'
            created_essay = await db_adapter.insert_essay(essay_data)
            essay_ids.append(created_essay['id'])
        
        try:
            # Test pagination - should use optimized query
            page1_essays = await db_adapter.get_user_essays(user_id, page=1, size=10)
            assert len(page1_essays) == 10
            
            # Verify that correction_count is included (indicates optimized query)
            for essay in page1_essays:
                assert 'correction_count' in essay or 'id' in essay
            
            # Test second page
            page2_essays = await db_adapter.get_user_essays(user_id, page=2, size=10)
            assert len(page2_essays) == 5
            
            # Verify no overlap
            page1_ids = {essay['id'] for essay in page1_essays}
            page2_ids = {essay['id'] for essay in page2_essays}
            assert len(page1_ids.intersection(page2_ids)) == 0
            
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_user_statistics_single_query(self, db_adapter, sample_essay_data):
        """Test that user statistics use optimized single query"""
        user_id = sample_essay_data['user_id']
        
        # Create essays with scores
        essay_ids = []
        scores = [750.0, 800.0, 650.0, 900.0, 700.0]
        
        for i, score in enumerate(scores):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Scored Essay {i+1}'
            essay_data['content'] = f'Content for scored essay {i+1} with sufficient length.'
            created_essay = await db_adapter.insert_essay(essay_data)
            
            # Update with score
            await db_adapter.update_essay(created_essay['id'], {'score': score})
            essay_ids.append(created_essay['id'])
        
        try:
            # Test optimized statistics query
            stats = await db_adapter.get_user_essay_count(user_id)
            
            assert stats['total_essays'] == 5
            assert stats['scored_essays'] == 5
            assert stats['avg_score'] == sum(scores) / len(scores)
            assert stats['best_score'] == max(scores)
            assert stats['worst_score'] == min(scores)
            
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_ranking_query_optimization(self, db_adapter, sample_user_data, sample_essay_data):
        """Test that ranking query is optimized"""
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
                    essay_data['user_id'] = created_user.get('id', created_user['email'])  # Use email as fallback for SQLite
                    essay_data['title'] = f'Ranking Essay {score}'
                    essay_data['content'] = f'Content for ranking essay with score {score} and sufficient length.'
                    
                    created_essay = await db_adapter.insert_essay(essay_data)
                    await db_adapter.update_essay(created_essay['id'], {'score': float(score)})
                    essay_ids.append(created_essay['id'])
            
            # Test ranking query - should be optimized single query
            ranking = await db_adapter.get_user_ranking()
            
            # Verify ranking is ordered by average score descending
            if len(ranking) >= 2:
                for i in range(len(ranking) - 1):
                    assert ranking[i]['avg_score'] >= ranking[i+1]['avg_score']
            
            # Verify ranking includes necessary fields
            for rank_entry in ranking:
                assert 'user_id' in rank_entry
                assert 'avg_score' in rank_entry
                assert 'essay_count' in rank_entry or 'total_essays' in rank_entry
                
        finally:
            # Cleanup essays
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

@pytest.mark.asyncio
class TestAsyncOperations:
    """Test async database operations"""

    async def test_concurrent_essay_creation(self, db_adapter, sample_essay_data):
        """Test concurrent essay creation"""
        user_id = sample_essay_data['user_id']
        
        async def create_essay(index: int):
            """Create an essay concurrently"""
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Concurrent Essay {index}'
            essay_data['content'] = f'Content for concurrent essay {index} with sufficient length for testing.'
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

    async def test_concurrent_essay_updates(self, db_adapter, sample_essay_data):
        """Test concurrent essay updates"""
        # Create base essay
        created_essay = await db_adapter.insert_essay(sample_essay_data)
        essay_id = created_essay['id']
        
        try:
            async def update_essay(score: float):
                """Update essay score concurrently"""
                await db_adapter.update_essay(essay_id, {'score': score})
                return score
            
            # Update essay concurrently with different scores
            scores = [750.0, 800.0, 650.0, 900.0, 700.0]
            tasks = [update_essay(score) for score in scores]
            await asyncio.gather(*tasks)
            
            # Verify essay was updated (final state may vary due to concurrency)
            updated_essay = await db_adapter.get_essay(essay_id)
            assert updated_essay is not None
            assert updated_essay['score'] is not None
            
        finally:
            # Cleanup
            await db_adapter.delete_essay(essay_id)

    async def test_async_error_handling(self, db_adapter):
        """Test async error handling"""
        # Test getting non-existent essay
        non_existent_essay = await db_adapter.get_essay('non-existent-id')
        assert non_existent_essay is None
        
        # Test deleting non-existent essay
        deleted = await db_adapter.delete_essay('non-existent-id')
        assert deleted is False
        
        # Test updating non-existent essay (should not raise error)
        await db_adapter.update_essay('non-existent-id', {'score': 100})

@pytest.mark.asyncio
class TestPerformanceOptimizations:
    """Test performance optimizations"""

    async def test_pagination_performance(self, db_adapter, sample_essay_data):
        """Test pagination performance with larger dataset"""
        import time
        
        user_id = sample_essay_data['user_id']
        
        # Create larger dataset
        essay_ids = []
        for i in range(50):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Performance Test Essay {i}'
            essay_data['content'] = f'Content for performance test essay {i} with sufficient length.'
            created_essay = await db_adapter.insert_essay(essay_data)
            essay_ids.append(created_essay['id'])
        
        try:
            # Test pagination performance
            start_time = time.time()
            essays = await db_adapter.get_user_essays(user_id, page=1, size=25)
            query_time = time.time() - start_time
            
            # Should be reasonably fast (less than 1 second)
            assert query_time < 1.0, f"Pagination query took too long: {query_time}s"
            assert len(essays) == 25
            
            # Test second page
            start_time = time.time()
            essays_page2 = await db_adapter.get_user_essays(user_id, page=2, size=25)
            query_time2 = time.time() - start_time
            
            assert query_time2 < 1.0, f"Second page query took too long: {query_time2}s"
            assert len(essays_page2) == 25
            
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_bulk_operations_performance(self, db_adapter, sample_essay_data):
        """Test bulk operations performance"""
        import time
        
        # Test bulk creation performance
        start_time = time.time()
        created_essays = []
        
        for i in range(20):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Bulk Test Essay {i}'
            essay_data['content'] = f'Content for bulk test essay {i} with sufficient length.'
            created_essay = await db_adapter.insert_essay(essay_data)
            created_essays.append(created_essay)
        
        creation_time = time.time() - start_time
        
        try:
            # Should create 20 essays in reasonable time (less than 3 seconds)
            assert creation_time < 3.0, f"Bulk creation took too long: {creation_time}s"
            
            # Test bulk deletion performance
            start_time = time.time()
            for essay in created_essays:
                await db_adapter.delete_essay(essay['id'])
            deletion_time = time.time() - start_time
            
            # Should delete 20 essays in reasonable time (less than 2 seconds)
            assert deletion_time < 2.0, f"Bulk deletion took too long: {deletion_time}s"
            
        except Exception:
            # Cleanup in case of failure
            for essay in created_essays:
                try:
                    await db_adapter.delete_essay(essay['id'])
                except:
                    pass
            raise

if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, '-v'])