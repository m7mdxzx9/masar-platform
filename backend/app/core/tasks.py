import logging
import asyncio
from typing import Callable, Any

logger = logging.getLogger(__name__)

class BackgroundTaskManager:
    """
    A lightweight task manager for long running operations 
    using FastAPI's BackgroundTasks or asyncio tasks.
    In a true production environment, this could be replaced with Celery or ARQ.
    """
    
    @staticmethod
    def run_task(task_func: Callable, *args, **kwargs) -> asyncio.Task:
        """
        Run an async task in the background, independently of a specific request lifecycle.
        Useful for long-running AI operations.
        """
        logger.info(f"Scheduling background task: {task_func.__name__}")
        
        async def _wrapper():
            try:
                await task_func(*args, **kwargs)
                logger.info(f"Background task {task_func.__name__} completed successfully.")
            except Exception as e:
                logger.exception(f"Background task {task_func.__name__} failed: {e}")

        task = asyncio.create_task(_wrapper())
        return task

task_manager = BackgroundTaskManager()
