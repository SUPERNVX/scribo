"""
Tests for query optimization and N+1 problem prevention
Tests for task 4: Refactor database operations to async - Query Optimization
"""
import pytest
import pytest_asyncio
import asyncio
import uuid
import os
from datetime import datetime, timedelta
from typing import Dict, List
import json
import time

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
        'content': 'This is a test essay content for testing query optimization with proper length to meet minimum requirements for testing purposes.',
        'theme': 'Test Theme',
        'theme_id': 'test_theme_1',
        'ai_model': 'deepseek',
        'status': 'draft',
        'grammar_errors': [{'message': 'Test error', 'offset': 0, 'length': 4}]
    }

@pytest.mark.asyncio
class TestQueryOptimization:
    """Test query optimization to prevent N+1 problems"""

    async def test_user_essays_single_query(self, db_adapter, sample_essay_data):
        """Test that getting user essays uses a single optimized query"""
        user_id = sample_essay_data['user_id']
        
        # Create essays with different creation times
        essay_ids = []
        base_time = datetime.utcnow()
        
        for i in range(10):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Query Test Essay {i+1}'
            essay_data['content'] = f'Content for query test essay {i+1} with sufficient length for testing optimization.'
            essay_data['created_at'] = (base_time - timedelta(hours=i)).isoformat()
            
            created_essay = await db_adapter.insert_essay(essay_data)
            essay_ids.append(created_essay['id'])
        
        try:
            # Measure query performance
            start_time = time.time()
            essays = await db_adapter.get_user_essays(user_id, page=1, size=5)
            query_time = time.time() - start_time
            
            # Should be fast (single query)
            assert query_time < 0.5, f"Query took too long: {query_time}s"
            assert len(essays) == 5
            
            # Verify essays are ordered by created_at DESC
            for i in range(len(essays) - 1):
                assert essays[i]['created_at'] >= essays[i+1]['created_at']
            
            # Test that additional data is included (indicates JOIN was used)
            for essay in essays:
                assert 'id' in essay
                assert 'theme_title' in essay or 'title' in essay  # Different field names in different backends
                assert 'content' in essay
                # correction_count might be included if using optimized query
                
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_user_statistics_aggregation(self, db_adapter, sample_essay_data):
        """Test that user statistics use aggregated queries"""
        user_id = sample_essay_data['user_id']
        
        # Create essays with various scores
        essay_ids = []
        scores = [650.0, 750.0, 800.0, 900.0, 700.0, 850.0, 600.0, 950.0]
        
        for i, score in enumerate(scores):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Stats Test Essay {i+1}'
            essay_data['content'] = f'Content for statistics test essay {i+1} with sufficient length.'
            
            created_essay = await db_adapter.insert_essay(essay_data)
            await db_adapter.update_essay(created_essay['id'], {'score': score})
            essay_ids.append(created_essay['id'])
        
        try:
            # Test aggregated statistics query
            start_time = time.time()
            stats = await db_adapter.get_user_essay_count(user_id)
            query_time = time.time() - start_time
            
            # Should be fast (single aggregated query)
            assert query_time < 0.3, f"Statistics query took too long: {query_time}s"
            
            # Verify aggregated results
            assert stats['total_essays'] == len(scores)
            assert stats['scored_essays'] == len(scores)
            assert abs(stats['avg_score'] - (sum(scores) / len(scores))) < 0.1
            assert stats['best_score'] == max(scores)
            assert stats['worst_score'] == min(scores)
            assert stats['last_essay_date'] is not None
            
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_ranking_query_efficiency(self, db_adapter, sample_user_data, sample_essay_data):
        """Test that ranking query is efficient and doesn't cause N+1 problems"""
        # Create multiple users with essays
        test_users = []
        essay_ids = []
        
        try:
            for i in range(5):
                user_data = sample_user_data.copy()
                user_data['email'] = f'ranking_efficiency_{i}_{uuid.uuid4().hex[:8]}@example.com'
                user_data['name'] = f'Ranking User {i+1}'
                
                created_user = await db_adapter.create_user(user_data)
                test_users.append(created_user)
                
                # Create multiple essays per user with different scores
                user_scores = [600 + (i * 40) + j * 20 for j in range(3)]
                for j, score in enumerate(user_scores):
                    essay_data = sample_essay_data.copy()
                    essay_data['user_id'] = created_user.get('id', created_user['email'])  # Use email as fallback for SQLite
                    essay_data['title'] = f'Ranking Essay {i}-{j}'
                    essay_data['content'] = f'Content for ranking essay {i}-{j} with sufficient length for testing.'
                    
                    created_essay = await db_adapter.insert_essay(essay_data)
                    await db_adapter.update_essay(created_essay['id'], {'score': float(score)})
                    essay_ids.append(created_essay['id'])
            
            # Test ranking query performance
            start_time = time.time()
            ranking = await db_adapter.get_user_ranking()
            query_time = time.time() - start_time
            
            # Should be fast (single JOIN query, not N+1)
            assert query_time < 1.0, f"Ranking query took too long: {query_time}s"
            
            # Verify ranking results
            assert len(ranking) >= len(test_users)
            
            # Verify ranking is sorted by average score
            for i in range(len(ranking) - 1):
                assert ranking[i]['avg_score'] >= ranking[i+1]['avg_score']
            
            # Verify all necessary data is included in single query
            for rank_entry in ranking:
                assert 'user_id' in rank_entry
                assert 'avg_score' in rank_entry
                assert isinstance(rank_entry['avg_score'], (int, float))
                
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_pagination_efficiency(self, db_adapter, sample_essay_data):
        """Test that pagination is efficient and uses LIMIT/OFFSET correctly"""
        user_id = sample_essay_data['user_id']
        
        # Create a larger dataset
        essay_ids = []
        for i in range(25):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Pagination Test Essay {i+1:02d}'
            essay_data['content'] = f'Content for pagination test essay {i+1} with sufficient length for testing.'
            
            created_essay = await db_adapter.insert_essay(essay_data)
            essay_ids.append(created_essay['id'])
        
        try:
            # Test first page
            start_time = time.time()
            page1 = await db_adapter.get_user_essays(user_id, page=1, size=10)
            page1_time = time.time() - start_time
            
            # Test second page
            start_time = time.time()
            page2 = await db_adapter.get_user_essays(user_id, page=2, size=10)
            page2_time = time.time() - start_time
            
            # Test third page
            start_time = time.time()
            page3 = await db_adapter.get_user_essays(user_id, page=3, size=10)
            page3_time = time.time() - start_time
            
            # All pages should be fast (efficient pagination)
            assert page1_time < 0.5, f"Page 1 query took too long: {page1_time}s"
            assert page2_time < 0.5, f"Page 2 query took too long: {page2_time}s"
            assert page3_time < 0.5, f"Page 3 query took too long: {page3_time}s"
            
            # Verify page sizes
            assert len(page1) == 10
            assert len(page2) == 10
            assert len(page3) == 5  # Remaining essays
            
            # Verify no overlap between pages
            page1_ids = {essay['id'] for essay in page1}
            page2_ids = {essay['id'] for essay in page2}
            page3_ids = {essay['id'] for essay in page3}
            
            assert len(page1_ids.intersection(page2_ids)) == 0
            assert len(page1_ids.intersection(page3_ids)) == 0
            assert len(page2_ids.intersection(page3_ids)) == 0
            
            # Verify total coverage
            all_ids = page1_ids.union(page2_ids).union(page3_ids)
            assert len(all_ids) == 25
            
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_scored_essays_optimization(self, db_adapter, sample_essay_data):
        """Test that getting scored essays is optimized"""
        user_id = sample_essay_data['user_id']
        
        # Create mix of scored and unscored essays
        essay_ids = []
        scored_count = 0
        
        for i in range(15):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Scored Test Essay {i+1}'
            essay_data['content'] = f'Content for scored test essay {i+1} with sufficient length.'
            
            created_essay = await db_adapter.insert_essay(essay_data)
            essay_ids.append(created_essay['id'])
            
            # Score only some essays
            if i % 2 == 0:  # Score every other essay
                await db_adapter.update_essay(created_essay['id'], {'score': 700.0 + (i * 10)})
                scored_count += 1
        
        try:
            # Test getting only scored essays
            start_time = time.time()
            scored_essays = await db_adapter.get_scored_essays(user_id)
            query_time = time.time() - start_time
            
            # Should be fast (filtered query)
            assert query_time < 0.5, f"Scored essays query took too long: {query_time}s"
            
            # Should only return scored essays
            assert len(scored_essays) == scored_count
            
            # All returned essays should have scores
            for essay in scored_essays:
                assert essay['score'] is not None
                assert isinstance(essay['score'], (int, float))
                
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

@pytest.mark.asyncio
class TestIndexOptimization:
    """Test that queries benefit from proper indexing"""

    async def test_user_id_index_performance(self, db_adapter, sample_essay_data):
        """Test that user_id queries are fast (indicating proper indexing)"""
        # Create essays for multiple users
        user_ids = [f'user_{i}_{uuid.uuid4().hex[:8]}@example.com' for i in range(5)]
        essay_ids = []
        
        for user_id in user_ids:
            for i in range(10):
                essay_data = sample_essay_data.copy()
                essay_data['user_id'] = user_id
                essay_data['title'] = f'Index Test Essay {i+1}'
                essay_data['content'] = f'Content for index test essay {i+1} with sufficient length.'
                
                created_essay = await db_adapter.insert_essay(essay_data)
                essay_ids.append(created_essay['id'])
        
        try:
            # Test queries for each user (should be fast due to indexing)
            for user_id in user_ids:
                start_time = time.time()
                user_essays = await db_adapter.get_user_essays(user_id, page=1, size=10)
                query_time = time.time() - start_time
                
                # Should be fast (indexed query)
                assert query_time < 0.3, f"User query took too long: {query_time}s"
                assert len(user_essays) == 10
                
                # All essays should belong to the user
                for essay in user_essays:
                    assert essay['user_id'] == user_id
                    
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_essay_id_index_performance(self, db_adapter, sample_essay_data):
        """Test that essay ID lookups are fast (indicating proper indexing)"""
        # Create multiple essays
        essay_ids = []
        for i in range(20):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'ID Index Test Essay {i+1}'
            essay_data['content'] = f'Content for ID index test essay {i+1} with sufficient length.'
            
            created_essay = await db_adapter.insert_essay(essay_data)
            essay_ids.append(created_essay['id'])
        
        try:
            # Test individual essay lookups (should be fast due to primary key index)
            for essay_id in essay_ids:
                start_time = time.time()
                essay = await db_adapter.get_essay(essay_id)
                query_time = time.time() - start_time
                
                # Should be very fast (primary key lookup)
                assert query_time < 0.1, f"Essay lookup took too long: {query_time}s"
                assert essay is not None
                assert essay['id'] == essay_id
                
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

@pytest.mark.asyncio
class TestQueryComplexity:
    """Test complex queries and their optimization"""

    async def test_complex_statistics_query(self, db_adapter, sample_essay_data):
        """Test complex statistics queries are optimized"""
        user_id = sample_essay_data['user_id']
        
        # Create essays with various attributes
        essay_ids = []
        themes = ['Theme A', 'Theme B', 'Theme C']
        models = ['deepseek', 'llama', 'gpt4o']
        
        for i in range(30):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Complex Stats Essay {i+1}'
            essay_data['content'] = f'Content for complex statistics essay {i+1} with sufficient length.'
            essay_data['theme'] = themes[i % len(themes)]
            essay_data['ai_model'] = models[i % len(models)]
            
            created_essay = await db_adapter.insert_essay(essay_data)
            
            # Score some essays
            if i % 3 == 0:
                score = 600 + (i * 5) % 400  # Vary scores
                await db_adapter.update_essay(created_essay['id'], {'score': float(score)})
            
            essay_ids.append(created_essay['id'])
        
        try:
            # Test complex aggregation query
            start_time = time.time()
            stats = await db_adapter.get_user_essay_count(user_id)
            query_time = time.time() - start_time
            
            # Should handle complex aggregation efficiently
            assert query_time < 0.5, f"Complex statistics query took too long: {query_time}s"
            
            # Verify results
            assert stats['total_essays'] == 30
            assert stats['scored_essays'] == 10  # Every 3rd essay was scored
            assert stats['avg_score'] is not None
            assert stats['best_score'] is not None
            assert stats['worst_score'] is not None
            
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

    async def test_concurrent_query_performance(self, db_adapter, sample_essay_data):
        """Test that concurrent queries perform well"""
        user_id = sample_essay_data['user_id']
        
        # Create base dataset
        essay_ids = []
        for i in range(20):
            essay_data = sample_essay_data.copy()
            essay_data['title'] = f'Concurrent Test Essay {i+1}'
            essay_data['content'] = f'Content for concurrent test essay {i+1} with sufficient length.'
            
            created_essay = await db_adapter.insert_essay(essay_data)
            essay_ids.append(created_essay['id'])
        
        try:
            # Test concurrent queries
            async def run_query(query_type: str):
                if query_type == 'essays':
                    return await db_adapter.get_user_essays(user_id, page=1, size=10)
                elif query_type == 'stats':
                    return await db_adapter.get_user_essay_count(user_id)
                elif query_type == 'ranking':
                    return await db_adapter.get_user_ranking()
                elif query_type == 'scored':
                    return await db_adapter.get_scored_essays(user_id)
            
            # Run multiple query types concurrently
            start_time = time.time()
            tasks = [
                run_query('essays'),
                run_query('stats'),
                run_query('ranking'),
                run_query('scored'),
                run_query('essays'),  # Duplicate to test caching/performance
            ]
            results = await asyncio.gather(*tasks)
            total_time = time.time() - start_time
            
            # Concurrent queries should complete reasonably fast
            assert total_time < 2.0, f"Concurrent queries took too long: {total_time}s"
            
            # Verify all queries returned results
            assert len(results) == 5
            for result in results:
                assert result is not None
                
        finally:
            # Cleanup
            for essay_id in essay_ids:
                await db_adapter.delete_essay(essay_id)

if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, '-v'])