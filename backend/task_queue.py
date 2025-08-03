"""
Async Task Queue System for Scribo Backend
Implements background task processing with Redis, workers, notifications, and retry mechanisms
"""

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Callable, Union
from dataclasses import dataclass, asdict
import redis.asyncio as redis
from pydantic import BaseModel
import traceback

# Configure logging
logger = logging.getLogger(__name__)

class TaskStatus(str, Enum):
    """Task status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    """Task priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class TaskResult:
    """Task execution result"""
    success: bool
    result: Any = None
    error: Optional[str] = None
    execution_time: float = 0.0
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

class Task(BaseModel):
    """Task model for queue operations"""
    id: str
    name: str
    args: List[Any] = []
    kwargs: Dict[str, Any] = {}
    priority: TaskPriority = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int = 0
    max_retries: int = 3
    retry_delay: float = 1.0  # seconds
    timeout: float = 300.0  # 5 minutes default
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = {}

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class TaskQueue:
    """Redis-based async task queue with worker management"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379", queue_name: str = "scribo_tasks"):
        self.redis_url = redis_url
        self.queue_name = queue_name
        self.processing_queue = f"{queue_name}:processing"
        self.completed_queue = f"{queue_name}:completed"
        self.failed_queue = f"{queue_name}:failed"
        self.task_data_key = f"{queue_name}:data"
        self.task_results_key = f"{queue_name}:results"
        self.notifications_key = f"{queue_name}:notifications"
        
        self.redis_client: Optional[redis.Redis] = None
        self.task_handlers: Dict[str, Callable] = {}
        self.workers: List[asyncio.Task] = []
        self.is_running = False
        self.using_redis = True  # Default to using Redis, will be set to False if connection fails
        
    async def connect(self):
        """Initialize Redis connection with fallback to in-memory implementation"""
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            await self.redis_client.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
            self.using_redis = True
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Using in-memory queue instead.")
            # Initialize in-memory storage as fallback
            self.using_redis = False
            self._init_memory_storage()
            logger.info("Initialized in-memory task queue (Redis not available)")
            
    def _init_memory_storage(self):
        """Initialize in-memory storage structures when Redis is not available"""
        # In-memory queues for different priorities
        self._memory_queues = {
            f"{self.queue_name}:{TaskPriority.CRITICAL.value}": [],
            f"{self.queue_name}:{TaskPriority.HIGH.value}": [],
            f"{self.queue_name}:{TaskPriority.NORMAL.value}": [],
            f"{self.queue_name}:{TaskPriority.LOW.value}": [],
            self.processing_queue: [],
            self.completed_queue: [],
            self.failed_queue: []
        }
        # In-memory hash storage
        self._memory_hashes = {
            self.task_data_key: {},
            self.task_results_key: {}
        }
        # In-memory list storage
        self._memory_lists = {
            self.notifications_key: []
        }

    async def disconnect(self):
        """Close Redis connection"""
        if self.using_redis and self.redis_client:
            await self.redis_client.close()
            logger.info("Disconnected from Redis")
        elif not self.using_redis:
            logger.info("Cleaned up in-memory task queue")

    def register_task(self, name: str, handler: Callable):
        """Register a task handler"""
        self.task_handlers[name] = handler
        logger.info(f"Registered task handler: {name}")

    async def enqueue(
        self,
        task_name: str,
        args: List[Any] = None,
        kwargs: Dict[str, Any] = None,
        priority: TaskPriority = TaskPriority.NORMAL,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        timeout: float = 300.0,
        user_id: Optional[str] = None,
        metadata: Dict[str, Any] = None
    ) -> str:
        """Enqueue a task for processing"""
        if not self.redis_client and not hasattr(self, '_memory_queues'):
            raise RuntimeError("Task queue not initialized")
            
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            name=task_name,
            args=args or [],
            kwargs=kwargs or {},
            priority=priority,
            created_at=datetime.utcnow(),
            max_retries=max_retries,
            retry_delay=retry_delay,
            timeout=timeout,
            user_id=user_id,
            metadata=metadata or {}
        )
        
        # Queue key for the appropriate priority
        queue_key = f"{self.queue_name}:{priority.value}"
        
        if self.using_redis:
            # Store task data in Redis
            await self.redis_client.hset(
                self.task_data_key,
                task_id,
                task.json()
            )
            
            # Add to appropriate priority queue
            await self.redis_client.lpush(queue_key, task_id)
        else:
            # Store in memory
            self._memory_hashes[self.task_data_key][task_id] = task.json()
            self._memory_queues[queue_key].insert(0, task_id)  # Insert at beginning (LPUSH equivalent)
        
        logger.info(f"Enqueued task {task_id}: {task_name}")
        return task_id

    async def get_task(self, task_id: str) -> Optional[Task]:
        """Get task by ID"""
        if self.using_redis:
            if not self.redis_client:
                return None
                
            task_data = await self.redis_client.hget(self.task_data_key, task_id)
            if task_data:
                return Task.parse_raw(task_data)
        else:
            # Get from in-memory storage
            task_data = self._memory_hashes[self.task_data_key].get(task_id)
            if task_data:
                return Task.parse_raw(task_data)
                
        return None

    async def update_task_status(self, task_id: str, status: TaskStatus, **kwargs):
        """Update task status and additional fields"""
        task = await self.get_task(task_id)
        if not task:
            return
            
        task.status = status
        for key, value in kwargs.items():
            if hasattr(task, key):
                setattr(task, key, value)
        
        if self.using_redis:
            await self.redis_client.hset(
                self.task_data_key,
                task_id,
                task.json()
            )
        else:
            # Update in-memory storage
            self._memory_hashes[self.task_data_key][task_id] = task.json()

    async def get_next_task(self) -> Optional[Task]:
        """Get next task from priority queues"""
        if not self.using_redis and not hasattr(self, '_memory_queues'):
            return None
            
        # Check queues in priority order
        priority_queues = [
            f"{self.queue_name}:{TaskPriority.CRITICAL.value}",
            f"{self.queue_name}:{TaskPriority.HIGH.value}",
            f"{self.queue_name}:{TaskPriority.NORMAL.value}",
            f"{self.queue_name}:{TaskPriority.LOW.value}"
        ]
        
        for queue_key in priority_queues:
            if self.using_redis:
                task_id = await self.redis_client.rpop(queue_key)
            else:
                # Pop from the end of the list (RPOP equivalent)
                task_id = self._memory_queues[queue_key].pop() if self._memory_queues[queue_key] else None
                
            if task_id:
                task = await self.get_task(task_id)
                if task:
                    # Move to processing queue
                    if self.using_redis:
                        await self.redis_client.lpush(self.processing_queue, task_id)
                    else:
                        self._memory_queues[self.processing_queue].insert(0, task_id)  # LPUSH equivalent
                        
                    await self.update_task_status(
                        task_id, 
                        TaskStatus.PROCESSING,
                        started_at=datetime.utcnow()
                    )
                    return task
        
        return None

    async def complete_task(self, task_id: str, result: TaskResult):
        """Mark task as completed"""
        # Remove from processing queue
        if self.using_redis:
            await self.redis_client.lrem(self.processing_queue, 1, task_id)
        else:
            if task_id in self._memory_queues[self.processing_queue]:
                self._memory_queues[self.processing_queue].remove(task_id)
        
        # Update task status
        status = TaskStatus.COMPLETED if result.success else TaskStatus.FAILED
        await self.update_task_status(
            task_id,
            status,
            completed_at=datetime.utcnow(),
            result=asdict(result) if result.success else None,
            error=result.error if not result.success else None
        )
        
        # Store result
        result_json = json.dumps(asdict(result))
        if self.using_redis:
            await self.redis_client.hset(
                self.task_results_key,
                task_id,
                result_json
            )
        else:
            self._memory_hashes[self.task_results_key][task_id] = result_json
        
        # Add to completed/failed queue for cleanup
        target_queue = self.completed_queue if result.success else self.failed_queue
        if self.using_redis:
            await self.redis_client.lpush(target_queue, task_id)
        else:
            self._memory_queues[target_queue].insert(0, task_id)  # LPUSH equivalent
        
        # Send notification
        await self.send_notification(task_id, status, result)

    async def retry_task(self, task_id: str, error: str):
        """Retry a failed task"""
        task = await self.get_task(task_id)
        if not task:
            return
            
        task.retry_count += 1
        
        if task.retry_count <= task.max_retries:
            # Remove from processing queue
            if self.using_redis:
                await self.redis_client.lrem(self.processing_queue, 1, task_id)
            else:
                if task_id in self._memory_queues[self.processing_queue]:
                    self._memory_queues[self.processing_queue].remove(task_id)
            
            # Update status and schedule retry
            await self.update_task_status(
                task_id,
                TaskStatus.RETRYING,
                retry_count=task.retry_count,
                error=error
            )
            
            # Calculate retry delay with exponential backoff
            delay = task.retry_delay * (2 ** (task.retry_count - 1))
            
            # Schedule retry
            await asyncio.sleep(delay)
            queue_key = f"{self.queue_name}:{task.priority.value}"
            
            if self.using_redis:
                await self.redis_client.lpush(queue_key, task_id)
            else:
                self._memory_queues[queue_key].insert(0, task_id)  # LPUSH equivalent
            
            logger.info(f"Retrying task {task_id} (attempt {task.retry_count}/{task.max_retries})")
        else:
            # Max retries exceeded
            result = TaskResult(
                success=False,
                error=f"Max retries exceeded: {error}",
                execution_time=0.0
            )
            await self.complete_task(task_id, result)

    async def send_notification(self, task_id: str, status: TaskStatus, result: TaskResult):
        """Send task completion notification"""
        task = await self.get_task(task_id)
        if not task:
            return
            
        notification = {
            "task_id": task_id,
            "task_name": task.name,
            "status": status.value,
            "user_id": task.user_id,
            "completed_at": datetime.utcnow().isoformat(),
            "success": result.success,
            "error": result.error,
            "execution_time": result.execution_time
        }
        
        notification_json = json.dumps(notification)
        
        # Store notification
        if self.using_redis:
            await self.redis_client.lpush(
                self.notifications_key,
                notification_json
            )
            
            # Set expiration for notifications (7 days)
            await self.redis_client.expire(self.notifications_key, 604800)
        else:
            # Store in memory
            self._memory_lists[self.notifications_key].insert(0, notification_json)  # LPUSH equivalent
            
            # Limit in-memory notifications to 100 to prevent memory issues
            if len(self._memory_lists[self.notifications_key]) > 100:
                self._memory_lists[self.notifications_key] = self._memory_lists[self.notifications_key][:100]
        
        logger.info(f"Sent notification for task {task_id}: {status.value}")

    async def get_notifications(self, user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Get task notifications"""
        if self.using_redis:
            if not self.redis_client:
                return []
                
            notifications = await self.redis_client.lrange(self.notifications_key, 0, limit - 1)
        else:
            # Get from in-memory storage
            notifications = self._memory_lists[self.notifications_key][:limit]
            
        result = []
        
        for notification_data in notifications:
            try:
                notification = json.loads(notification_data)
                if user_id is None or notification.get("user_id") == user_id:
                    result.append(notification)
            except json.JSONDecodeError:
                continue
                
        return result

    async def worker(self, worker_id: str):
        """Background worker to process tasks"""
        logger.info(f"Worker {worker_id} started")
        
        while self.is_running:
            try:
                task = await self.get_next_task()
                if not task:
                    await asyncio.sleep(1)  # No tasks available
                    continue
                
                logger.info(f"Worker {worker_id} processing task {task.id}: {task.name}")
                
                # Get task handler
                handler = self.task_handlers.get(task.name)
                if not handler:
                    error = f"No handler registered for task: {task.name}"
                    result = TaskResult(success=False, error=error)
                    await self.complete_task(task.id, result)
                    continue
                
                # Execute task with timeout
                start_time = time.time()
                try:
                    task_result = await asyncio.wait_for(
                        handler(*task.args, **task.kwargs),
                        timeout=task.timeout
                    )
                    
                    execution_time = time.time() - start_time
                    result = TaskResult(
                        success=True,
                        result=task_result,
                        execution_time=execution_time
                    )
                    await self.complete_task(task.id, result)
                    
                except asyncio.TimeoutError:
                    error = f"Task timed out after {task.timeout} seconds"
                    await self.retry_task(task.id, error)
                    
                except Exception as e:
                    error = f"Task execution failed: {str(e)}\n{traceback.format_exc()}"
                    await self.retry_task(task.id, error)
                    
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                await asyncio.sleep(5)  # Wait before retrying
        
        logger.info(f"Worker {worker_id} stopped")

    async def start_workers(self, num_workers: int = 3):
        """Start background workers"""
        if self.is_running:
            return
            
        self.is_running = True
        
        for i in range(num_workers):
            worker_id = f"worker-{i+1}"
            worker_task = asyncio.create_task(self.worker(worker_id))
            self.workers.append(worker_task)
        
        logger.info(f"Started {num_workers} workers")

    async def stop_workers(self):
        """Stop all background workers"""
        self.is_running = False
        
        if self.workers:
            await asyncio.gather(*self.workers, return_exceptions=True)
            self.workers.clear()
        
        logger.info("All workers stopped")

    async def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        stats = {}
        
        if self.using_redis:
            if not self.redis_client:
                return {}
                
            # Count tasks in each priority queue
            for priority in TaskPriority:
                queue_key = f"{self.queue_name}:{priority.value}"
                count = await self.redis_client.llen(queue_key)
                stats[f"pending_{priority.value}"] = count
            
            # Count processing tasks
            stats["processing"] = await self.redis_client.llen(self.processing_queue)
            
            # Count completed/failed tasks
            stats["completed"] = await self.redis_client.llen(self.completed_queue)
            stats["failed"] = await self.redis_client.llen(self.failed_queue)
            
            # Total tasks in system
            total_tasks = await self.redis_client.hlen(self.task_data_key)
            stats["total_tasks"] = total_tasks
        else:
            # Get stats from in-memory storage
            for priority in TaskPriority:
                queue_key = f"{self.queue_name}:{priority.value}"
                stats[f"pending_{priority.value}"] = len(self._memory_queues[queue_key])
            
            stats["processing"] = len(self._memory_queues[self.processing_queue])
            stats["completed"] = len(self._memory_queues[self.completed_queue])
            stats["failed"] = len(self._memory_queues[self.failed_queue])
            stats["total_tasks"] = len(self._memory_hashes[self.task_data_key])
        
        return stats

    async def cleanup_old_tasks(self, days: int = 7):
        """Clean up old completed/failed tasks"""
        if not self.redis_client:
            return
            
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        cleaned_count = 0
        
        # Get all task IDs
        all_task_ids = await self.redis_client.hkeys(self.task_data_key)
        
        for task_id in all_task_ids:
            task = await self.get_task(task_id)
            if task and task.completed_at and task.completed_at < cutoff_date:
                # Remove task data
                await self.redis_client.hdel(self.task_data_key, task_id)
                await self.redis_client.hdel(self.task_results_key, task_id)
                
                # Remove from completed/failed queues
                await self.redis_client.lrem(self.completed_queue, 0, task_id)
                await self.redis_client.lrem(self.failed_queue, 0, task_id)
                
                cleaned_count += 1
        
        logger.info(f"Cleaned up {cleaned_count} old tasks")
        return cleaned_count


# Global task queue instance
task_queue = TaskQueue()