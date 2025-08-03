"""
FastAPI endpoints for task queue management and dashboard
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from task_queue import task_queue, TaskPriority, TaskStatus
from auth import create_get_current_user_dependency
from database_adapter import db_adapter

# Create router
router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# Get current user dependency
get_current_user = create_get_current_user_dependency(db_adapter)

# Request/Response models
class TaskRequest(BaseModel):
    name: str
    args: List[Any] = []
    kwargs: Dict[str, Any] = {}
    priority: TaskPriority = TaskPriority.NORMAL
    max_retries: int = 3
    retry_delay: float = 1.0
    timeout: float = 300.0
    metadata: Dict[str, Any] = {}

class TaskResponse(BaseModel):
    id: str
    name: str
    status: TaskStatus
    priority: TaskPriority
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int
    max_retries: int
    user_id: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = {}

class TaskStatsResponse(BaseModel):
    pending_critical: int
    pending_high: int
    pending_normal: int
    pending_low: int
    processing: int
    completed: int
    failed: int
    total_tasks: int

class NotificationResponse(BaseModel):
    task_id: str
    task_name: str
    status: str
    user_id: Optional[str]
    completed_at: str
    success: bool
    error: Optional[str]
    execution_time: float

@router.post("/submit", response_model=Dict[str, str])
async def submit_task(
    task_request: TaskRequest,
    current_user = Depends(get_current_user)
):
    """Submit a new task to the queue"""
    try:
        task_id = await task_queue.enqueue(
            task_name=task_request.name,
            args=task_request.args,
            kwargs=task_request.kwargs,
            priority=task_request.priority,
            max_retries=task_request.max_retries,
            retry_delay=task_request.retry_delay,
            timeout=task_request.timeout,
            user_id=current_user.id,
            metadata=task_request.metadata
        )
        
        return {"task_id": task_id, "status": "submitted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit task: {str(e)}")

@router.get("/status/{task_id}", response_model=TaskResponse)
async def get_task_status(
    task_id: str,
    current_user = Depends(get_current_user)
):
    """Get status of a specific task"""
    task = await task_queue.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user owns this task or is admin
    if task.user_id != current_user.id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    return TaskResponse(
        id=task.id,
        name=task.name,
        status=task.status,
        priority=task.priority,
        created_at=task.created_at,
        started_at=task.started_at,
        completed_at=task.completed_at,
        retry_count=task.retry_count,
        max_retries=task.max_retries,
        user_id=task.user_id,
        result=task.result,
        error=task.error,
        metadata=task.metadata
    )

@router.get("/my-tasks", response_model=List[TaskResponse])
async def get_my_tasks(
    status: Optional[TaskStatus] = Query(None, description="Filter by task status"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of tasks to return"),
    current_user = Depends(get_current_user)
):
    """Get tasks for the current user"""
    # This would require implementing a method to get tasks by user_id
    # For now, we'll return a placeholder response
    return []

@router.get("/stats", response_model=TaskStatsResponse)
async def get_queue_stats(current_user = Depends(get_current_user)):
    """Get queue statistics"""
    stats = await task_queue.get_queue_stats()
    return TaskStatsResponse(**stats)

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    limit: int = Query(50, ge=1, le=100, description="Maximum number of notifications"),
    current_user = Depends(get_current_user)
):
    """Get task notifications for the current user"""
    notifications = await task_queue.get_notifications(
        user_id=current_user.id,
        limit=limit
    )
    
    return [NotificationResponse(**notification) for notification in notifications]

@router.post("/essay/{essay_id}/correct")
async def submit_essay_correction(
    essay_id: str,
    model: str = "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    priority: TaskPriority = TaskPriority.NORMAL,
    current_user = Depends(get_current_user)
):
    """Submit essay correction task"""
    try:
        # Get essay data (this would need to be implemented in database_adapter)
        # For now, we'll assume the essay exists and belongs to the user
        
        task_id = await task_queue.enqueue(
            task_name="process_essay_correction",
            kwargs={
                "essay_id": essay_id,
                "user_id": current_user.id,
                "model": model
            },
            priority=priority,
            user_id=current_user.id,
            metadata={"essay_id": essay_id, "operation": "correction"}
        )
        
        return {"task_id": task_id, "status": "submitted", "message": "Essay correction queued"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit correction task: {str(e)}")

@router.post("/essay/{essay_id}/deep-analysis")
async def submit_deep_analysis(
    essay_id: str,
    models: List[str] = None,
    priority: TaskPriority = TaskPriority.HIGH,
    current_user = Depends(get_current_user)
):
    """Submit deep analysis task"""
    try:
        if models is None:
            models = [
                "nvidia/llama-3.1-nemotron-ultra-253b-v1",
                "nvidia/llama-3.1-nemotron-70b-instruct",
                "deepseek-ai/deepseek-r1-0528"
            ]
        
        task_id = await task_queue.enqueue(
            task_name="process_deep_analysis",
            kwargs={
                "essay_id": essay_id,
                "user_id": current_user.id,
                "models": models
            },
            priority=priority,
            user_id=current_user.id,
            metadata={"essay_id": essay_id, "operation": "deep_analysis"}
        )
        
        return {"task_id": task_id, "status": "submitted", "message": "Deep analysis queued"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit deep analysis task: {str(e)}")

@router.post("/batch/process")
async def submit_batch_processing(
    essay_ids: List[str],
    operation: str,
    priority: TaskPriority = TaskPriority.NORMAL,
    current_user = Depends(get_current_user)
):
    """Submit batch processing task"""
    try:
        if operation not in ["correction", "deep_analysis"]:
            raise HTTPException(status_code=400, detail="Invalid operation. Must be 'correction' or 'deep_analysis'")
        
        task_id = await task_queue.enqueue(
            task_name="batch_process_essays",
            kwargs={
                "essay_ids": essay_ids,
                "operation": operation,
                "user_id": current_user.id
            },
            priority=priority,
            user_id=current_user.id,
            metadata={"operation": "batch_processing", "essay_count": len(essay_ids)}
        )
        
        return {
            "task_id": task_id, 
            "status": "submitted", 
            "message": f"Batch {operation} queued for {len(essay_ids)} essays"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit batch task: {str(e)}")

@router.post("/user/generate-stats")
async def generate_user_statistics(
    priority: TaskPriority = TaskPriority.LOW,
    current_user = Depends(get_current_user)
):
    """Generate comprehensive user statistics"""
    try:
        task_id = await task_queue.enqueue(
            task_name="generate_user_statistics",
            kwargs={"user_id": current_user.id},
            priority=priority,
            user_id=current_user.id,
            metadata={"operation": "generate_statistics"}
        )
        
        return {"task_id": task_id, "status": "submitted", "message": "Statistics generation queued"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit statistics task: {str(e)}")

@router.post("/user/export-data")
async def export_user_data(
    format: str = "json",
    priority: TaskPriority = TaskPriority.LOW,
    current_user = Depends(get_current_user)
):
    """Export user data"""
    try:
        if format not in ["json", "csv"]:
            raise HTTPException(status_code=400, detail="Invalid format. Must be 'json' or 'csv'")
        
        task_id = await task_queue.enqueue(
            task_name="export_user_data",
            kwargs={
                "user_id": current_user.id,
                "format": format
            },
            priority=priority,
            user_id=current_user.id,
            metadata={"operation": "data_export", "format": format}
        )
        
        return {"task_id": task_id, "status": "submitted", "message": "Data export queued"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit export task: {str(e)}")

# Admin endpoints (require admin privileges)
@router.post("/admin/cleanup")
async def admin_cleanup_old_data(
    days_old: int = 30,
    current_user = Depends(get_current_user)
):
    """Admin: Clean up old data"""
    # Check if user is admin (this would need to be implemented)
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    try:
        task_id = await task_queue.enqueue(
            task_name="cleanup_old_data",
            kwargs={"days_old": days_old},
            priority=TaskPriority.LOW,
            user_id=current_user.id,
            metadata={"operation": "admin_cleanup"}
        )
        
        return {"task_id": task_id, "status": "submitted", "message": f"Cleanup queued for data older than {days_old} days"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit cleanup task: {str(e)}")

@router.post("/admin/cleanup-free-essays")
async def admin_cleanup_free_user_essays(
    days_old: int = 30,
    current_user = Depends(get_current_user)
):
    """Admin: Clean up essays from free users older than specified days"""
    # Check if user is admin
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    try:
        task_id = await task_queue.enqueue(
            task_name="cleanup_free_user_essays",
            kwargs={"days_old": days_old},
            priority=TaskPriority.LOW,
            user_id=current_user.id,
            metadata={
                "operation": "free_user_essay_cleanup",
                "admin_user": getattr(current_user, "email", "unknown")
            }
        )
        
        return {
            "task_id": task_id, 
            "status": "submitted",
            "message": f"Free user essay cleanup queued for essays older than {days_old} days",
            "note": "This will delete essays from free users (identified by essay count < 50) older than the specified days"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit free user essay cleanup task: {str(e)}")

@router.get("/admin/all-stats")
async def admin_get_all_stats(current_user = Depends(get_current_user)):
    """Admin: Get comprehensive system statistics"""
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    stats = await task_queue.get_queue_stats()
    return stats