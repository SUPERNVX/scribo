"""
Task handlers for Scribo backend operations
Implements handlers for heavy operations that should run in background
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

# Import existing services
from ai_service import ai_service
from deep_analysis import deep_analysis_service
from database_adapter import db_adapter
from cache import cache_manager

logger = logging.getLogger(__name__)

class TaskHandlers:
    """Collection of task handlers for background processing"""
    
    @staticmethod
    async def process_essay_correction(
        essay_id: str,
        content: str,
        theme: str,
        user_id: str,
        model: str = "nvidia/llama-3.1-nemotron-70b-instruct",
        **kwargs
    ) -> Dict[str, Any]:
        """Process essay correction in background"""
        try:
            logger.info(f"Processing essay correction for essay {essay_id}")
            
            # Get correction from AI service
            correction_result = await ai_service.correct_essay(content, theme, model)
            
            # Store correction in database
            correction_data = {
                "essay_id": essay_id,
                "model": model,
                "score": correction_result.get("score", 0),
                "feedback": correction_result.get("feedback", {}),
                "created_at": datetime.utcnow().isoformat(),
                "processing_time": correction_result.get("processing_time", 0)
            }
            
            # Save to database (assuming we have a corrections table)
            await db_adapter.save_essay_correction(correction_data)
            
            # Invalidate cache for this essay
            cache_key = f"essay_corrections:{essay_id}"
            await cache_manager.delete(cache_key)
            
            logger.info(f"Essay correction completed for essay {essay_id}")
            return {
                "essay_id": essay_id,
                "correction": correction_result,
                "status": "completed"
            }
            
        except Exception as e:
            logger.error(f"Error processing essay correction for {essay_id}: {e}")
            raise

    @staticmethod
    async def process_deep_analysis(
        essay_id: str,
        content: str,
        theme: str,
        user_id: str,
        models: List[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Process deep analysis with multiple AI models in background"""
        try:
            logger.info(f"Processing deep analysis for essay {essay_id}")
            
            if models is None:
                models = [
                    "nvidia/llama-3.1-nemotron-70b-instruct",
                    "meta/llama-3.1-8b-instruct",
                    "microsoft/phi-3-medium-4k-instruct"
                ]
            
            # Perform deep analysis
            analysis_result = await deep_analysis_service.analyze_essay(
                content=content,
                theme=theme,
                models=models
            )
            
            # Store analysis in database
            analysis_data = {
                "essay_id": essay_id,
                "models": models,
                "consensus_score": analysis_result.consensus_score,
                "individual_scores": analysis_result.individual_scores,
                "agreement_level": analysis_result.agreement_level,
                "detailed_feedback": analysis_result.detailed_feedback,
                "reliability_score": analysis_result.reliability_score,
                "created_at": datetime.utcnow().isoformat(),
                "processing_time": analysis_result.processing_time
            }
            
            # Save to database
            await db_adapter.save_deep_analysis(analysis_data)
            
            # Cache the result
            cache_key = f"deep_analysis:{essay_id}"
            await cache_manager.set(cache_key, analysis_data, expire=3600)  # 1 hour
            
            logger.info(f"Deep analysis completed for essay {essay_id}")
            return {
                "essay_id": essay_id,
                "analysis": analysis_result.dict(),
                "status": "completed"
            }
            
        except Exception as e:
            logger.error(f"Error processing deep analysis for {essay_id}: {e}")
            raise

    @staticmethod
    async def batch_process_essays(
        essay_ids: List[str],
        operation: str,
        user_id: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Process multiple essays in batch"""
        try:
            logger.info(f"Batch processing {len(essay_ids)} essays for user {user_id}")
            
            results = []
            errors = []
            
            for essay_id in essay_ids:
                try:
                    # Get essay data
                    essay = await db_adapter.get_essay(essay_id)
                    if not essay:
                        errors.append(f"Essay {essay_id} not found")
                        continue
                    
                    if operation == "correction":
                        result = await TaskHandlers.process_essay_correction(
                            essay_id=essay_id,
                            content=essay["content"],
                            theme=essay["theme"],
                            user_id=user_id,
                            **kwargs
                        )
                    elif operation == "deep_analysis":
                        result = await TaskHandlers.process_deep_analysis(
                            essay_id=essay_id,
                            content=essay["content"],
                            theme=essay["theme"],
                            user_id=user_id,
                            **kwargs
                        )
                    else:
                        errors.append(f"Unknown operation: {operation}")
                        continue
                    
                    results.append(result)
                    
                except Exception as e:
                    errors.append(f"Error processing essay {essay_id}: {str(e)}")
            
            logger.info(f"Batch processing completed: {len(results)} successful, {len(errors)} errors")
            return {
                "processed_count": len(results),
                "error_count": len(errors),
                "results": results,
                "errors": errors,
                "status": "completed"
            }
            
        except Exception as e:
            logger.error(f"Error in batch processing: {e}")
            raise

    @staticmethod
    async def generate_user_statistics(
        user_id: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate comprehensive user statistics"""
        try:
            logger.info(f"Generating statistics for user {user_id}")
            
            # Get user essays
            essays = await db_adapter.get_user_essays(user_id)
            
            # Calculate statistics
            stats = {
                "total_essays": len(essays),
                "average_score": 0,
                "improvement_trend": [],
                "theme_performance": {},
                "writing_frequency": {},
                "generated_at": datetime.utcnow().isoformat()
            }
            
            if essays:
                # Calculate average score
                scores = []
                theme_scores = {}
                monthly_counts = {}
                
                for essay in essays:
                    # Get latest correction for each essay
                    corrections = await db_adapter.get_essay_corrections(essay["id"])
                    if corrections:
                        latest_correction = max(corrections, key=lambda x: x["created_at"])
                        score = latest_correction.get("score", 0)
                        scores.append(score)
                        
                        # Theme performance
                        theme = essay["theme"]
                        if theme not in theme_scores:
                            theme_scores[theme] = []
                        theme_scores[theme].append(score)
                        
                        # Monthly frequency
                        month_key = essay["created_at"][:7]  # YYYY-MM
                        monthly_counts[month_key] = monthly_counts.get(month_key, 0) + 1
                
                if scores:
                    stats["average_score"] = sum(scores) / len(scores)
                    
                    # Calculate improvement trend (last 10 essays)
                    if len(scores) >= 2:
                        recent_scores = scores[-10:]
                        if len(recent_scores) >= 2:
                            trend = (recent_scores[-1] - recent_scores[0]) / len(recent_scores)
                            stats["improvement_trend"] = trend
                
                # Theme performance averages
                for theme, theme_score_list in theme_scores.items():
                    stats["theme_performance"][theme] = {
                        "average_score": sum(theme_score_list) / len(theme_score_list),
                        "essay_count": len(theme_score_list)
                    }
                
                stats["writing_frequency"] = monthly_counts
            
            # Cache the statistics
            cache_key = f"user_stats:{user_id}"
            await cache_manager.set(cache_key, stats, expire=1800)  # 30 minutes
            
            logger.info(f"Statistics generated for user {user_id}")
            return stats
            
        except Exception as e:
            logger.error(f"Error generating statistics for user {user_id}: {e}")
            raise

    @staticmethod
    async def cleanup_old_data(
        days_old: int = 30,
        **kwargs
    ) -> Dict[str, Any]:
        """Clean up old data from the system"""
        try:
            logger.info(f"Starting cleanup of data older than {days_old} days")
            
            cleanup_results = {
                "deleted_corrections": 0,
                "deleted_cache_entries": 0,
                "deleted_notifications": 0,
                "status": "completed"
            }
            
            # Clean up old corrections (keep only latest for each essay)
            deleted_corrections = await db_adapter.cleanup_old_corrections(days_old)
            cleanup_results["deleted_corrections"] = deleted_corrections
            
            # Clean up cache entries
            deleted_cache = await cache_manager.cleanup_expired()
            cleanup_results["deleted_cache_entries"] = deleted_cache
            
            logger.info(f"Cleanup completed: {cleanup_results}")
            return cleanup_results
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            raise

    @staticmethod
    async def cleanup_free_user_essays(
        days_old: int = 30,
        **kwargs
    ) -> Dict[str, Any]:
        """Clean up essays from free users older than specified days (default 30 days)"""
        try:
            logger.info(f"Starting cleanup of free user essays older than {days_old} days")
            
            # Clean up essays from free users
            cleanup_results = await db_adapter.cleanup_free_user_essays(days_old)
            cleanup_results["status"] = "completed"
            cleanup_results["days_old"] = days_old
            cleanup_results["cleanup_type"] = "free_user_essays"
            
            # Also clean up cache entries related to deleted essays
            deleted_cache = await cache_manager.cleanup_expired()
            cleanup_results["deleted_cache_entries"] = deleted_cache
            
            logger.info(f"Free user essay cleanup completed: {cleanup_results}")
            return cleanup_results
            
        except Exception as e:
            logger.error(f"Error during free user essay cleanup: {e}")
            raise

    @staticmethod
    async def export_user_data(
        user_id: str,
        format: str = "json",
        **kwargs
    ) -> Dict[str, Any]:
        """Export user data for backup or transfer"""
        try:
            logger.info(f"Exporting data for user {user_id} in {format} format")
            
            # Get all user data
            user_data = await db_adapter.get_user(user_id)
            essays = await db_adapter.get_user_essays(user_id)
            
            # Get corrections for each essay
            for essay in essays:
                corrections = await db_adapter.get_essay_corrections(essay["id"])
                essay["corrections"] = corrections
            
            export_data = {
                "user": user_data,
                "essays": essays,
                "exported_at": datetime.utcnow().isoformat(),
                "format": format
            }
            
            # Store export temporarily (could be extended to save to file storage)
            cache_key = f"export:{user_id}:{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            await cache_manager.set(cache_key, export_data, expire=86400)  # 24 hours
            
            logger.info(f"Data export completed for user {user_id}")
            return {
                "export_key": cache_key,
                "record_count": len(essays),
                "status": "completed"
            }
            
        except Exception as e:
            logger.error(f"Error exporting data for user {user_id}: {e}")
            raise


def register_task_handlers(task_queue):
    """Register all task handlers with the task queue"""
    task_queue.register_task("process_essay_correction", TaskHandlers.process_essay_correction)
    task_queue.register_task("process_deep_analysis", TaskHandlers.process_deep_analysis)
    task_queue.register_task("batch_process_essays", TaskHandlers.batch_process_essays)
    task_queue.register_task("generate_user_statistics", TaskHandlers.generate_user_statistics)
    task_queue.register_task("cleanup_old_data", TaskHandlers.cleanup_old_data)
    task_queue.register_task("cleanup_free_user_essays", TaskHandlers.cleanup_free_user_essays)
    task_queue.register_task("export_user_data", TaskHandlers.export_user_data)
    
    logger.info("All task handlers registered")