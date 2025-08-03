#!/usr/bin/env python3
"""
Test script for the task queue system
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from task_queue import task_queue, TaskPriority
from task_handlers import register_task_handlers

async def test_task_handler(message: str, delay: int = 1):
    """Simple test task handler"""
    print(f"Processing task: {message}")
    await asyncio.sleep(delay)
    return f"Completed: {message}"

async def main():
    """Test the task queue system"""
    try:
        print("Testing Task Queue System...")
        
        # Try to use fakeredis for testing if Redis is not available
        try:
            await task_queue.connect()
            print("✓ Connected to Redis")
        except Exception as e:
            print(f"Redis not available, using fakeredis for testing: {e}")
            try:
                import fakeredis.aioredis
                # Replace the redis client with fakeredis
                task_queue.redis_client = fakeredis.aioredis.FakeRedis(decode_responses=True)
                print("✓ Connected to FakeRedis for testing")
            except ImportError:
                print("✗ fakeredis not available. Install with: pip install fakeredis")
                return
            except Exception as fake_e:
                print(f"✗ Failed to connect to FakeRedis: {fake_e}")
                return
        
        # Register test handler
        task_queue.register_task("test_task", test_task_handler)
        print("✓ Registered test task handler")
        
        # Register all production handlers
        register_task_handlers(task_queue)
        print("✓ Registered production task handlers")
        
        # Start workers
        await task_queue.start_workers(num_workers=2)
        print("✓ Started 2 workers")
        
        # Submit test tasks
        task_ids = []
        for i in range(3):
            task_id = await task_queue.enqueue(
                task_name="test_task",
                kwargs={"message": f"Test message {i+1}", "delay": 1},
                priority=TaskPriority.NORMAL
            )
            task_ids.append(task_id)
            print(f"✓ Enqueued task {i+1}: {task_id}")
        
        # Wait for tasks to complete
        print("Waiting for tasks to complete...")
        await asyncio.sleep(5)
        
        # Check task results
        for task_id in task_ids:
            task = await task_queue.get_task(task_id)
            if task:
                print(f"Task {task_id}: Status = {task.status}")
                if task.result:
                    print(f"  Result: {task.result}")
                if task.error:
                    print(f"  Error: {task.error}")
        
        # Get queue stats
        stats = await task_queue.get_queue_stats()
        print(f"✓ Queue stats: {stats}")
        
        # Get notifications
        notifications = await task_queue.get_notifications(limit=5)
        print(f"✓ Found {len(notifications)} notifications")
        
        print("✓ Task queue system test completed successfully!")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        try:
            await task_queue.stop_workers()
            await task_queue.disconnect()
            print("✓ Cleaned up task queue")
        except Exception as e:
            print(f"Warning: Cleanup error: {e}")

if __name__ == "__main__":
    asyncio.run(main())