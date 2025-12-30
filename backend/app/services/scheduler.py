"""
Background scheduler for processing due reminders.

This module implements a background worker that periodically checks for
reminders that are due and triggers Vapi calls for them.
"""

import asyncio
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.reminder import Reminder, ReminderStatus
from app.services.vapi import VapiService
from app.config import get_settings

logger = logging.getLogger(__name__)


class ReminderScheduler:
    """
    Background scheduler for processing due reminders.
    
    Runs a periodic task that checks for reminders where trigger_at <= now
    and status is 'scheduled', then triggers Vapi calls for each.
    """
    
    def __init__(self):
        """Initialize the scheduler with configuration settings."""
        self.settings = get_settings()
        self.vapi_service = VapiService()
        self._running = False
        self._task: asyncio.Task | None = None
    
    def _get_db(self) -> Session:
        """
        Create a new database session for the scheduler.
        
        Returns:
            A new SQLAlchemy session.
        """
        return SessionLocal()
    
    def _get_due_reminders(self, db: Session) -> list[Reminder]:
        """
        Fetch all reminders that are due for processing.
        
        Args:
            db: Database session.
            
        Returns:
            List of reminders where trigger_at <= now and status is 'scheduled'.
        """
        now = datetime.now(timezone.utc)
        return (
            db.query(Reminder)
            .filter(
                Reminder.status == ReminderStatus.scheduled,
                Reminder.trigger_at <= now,
            )
            .all()
        )
    
    async def _process_reminder(self, reminder: Reminder, db: Session) -> None:
        """
        Process a single due reminder by triggering a Vapi call.
        
        Args:
            reminder: The reminder to process.
            db: Database session for updating the reminder status.
        """
        logger.info(
            f"Processing reminder {reminder.id}: '{reminder.title}' "
            f"for {reminder.phone_number}"
        )
        
        try:
            # Trigger the Vapi call
            result = await self.vapi_service.trigger_call(
                phone_number=reminder.phone_number,
                message=reminder.message,
                reminder_title=reminder.title,
            )
            
            if result.success:
                # Mark as completed
                reminder.status = ReminderStatus.completed
                logger.info(
                    f"Reminder {reminder.id} completed successfully. "
                    f"Vapi call ID: {result.call_id}"
                )
            else:
                # Mark as failed
                reminder.status = ReminderStatus.failed
                logger.error(
                    f"Reminder {reminder.id} failed: {result.error_message}"
                )
            
            db.commit()
            
        except Exception as e:
            # Handle unexpected errors
            logger.exception(f"Error processing reminder {reminder.id}: {e}")
            try:
                reminder.status = ReminderStatus.failed
                db.commit()
            except Exception:
                db.rollback()
    
    async def _check_and_process_reminders(self) -> None:
        """
        Check for due reminders and process them.
        
        This is the main task that runs periodically.
        """
        db = self._get_db()
        try:
            due_reminders = self._get_due_reminders(db)
            
            if due_reminders:
                logger.info(f"Found {len(due_reminders)} due reminder(s) to process")
                
                for reminder in due_reminders:
                    await self._process_reminder(reminder, db)
            else:
                logger.debug("No due reminders found")
                # Log every 10th check to show scheduler is running
                if hasattr(self, '_check_count'):
                    self._check_count += 1
                else:
                    self._check_count = 1
                
                if self._check_count % 10 == 0:
                    logger.info(f"Scheduler running (check #{self._check_count}) - no due reminders")
                
        except Exception as e:
            logger.exception(f"Error checking for due reminders: {e}")
        finally:
            db.close()
    
    async def _run_loop(self) -> None:
        """
        Main scheduler loop that runs until stopped.
        
        Checks for due reminders every scheduler_interval_seconds.
        """
        interval = self.settings.scheduler_interval_seconds
        logger.info(
            f"Reminder scheduler started. "
            f"Checking every {interval} seconds."
        )
        
        while self._running:
            try:
                await self._check_and_process_reminders()
            except Exception as e:
                logger.exception(f"Scheduler loop error: {e}")
            
            # Wait for the next interval
            await asyncio.sleep(interval)
        
        logger.info("Reminder scheduler stopped.")
    
    async def start(self) -> None:
        """
        Start the background scheduler.
        
        Creates an asyncio task that runs the scheduler loop.
        """
        if self._running:
            logger.warning("Scheduler is already running")
            return
        
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Reminder scheduler task created")
    
    async def stop(self) -> None:
        """
        Stop the background scheduler gracefully.
        
        Signals the loop to stop and waits for the task to complete.
        """
        if not self._running:
            logger.warning("Scheduler is not running")
            return
        
        logger.info("Stopping reminder scheduler...")
        self._running = False
        
        if self._task:
            # Give the task a chance to finish its current iteration
            try:
                await asyncio.wait_for(self._task, timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning("Scheduler task did not stop gracefully, cancelling")
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass
            self._task = None
    
    @property
    def is_running(self) -> bool:
        """Check if the scheduler is currently running."""
        return self._running


# Global scheduler instance
_scheduler: ReminderScheduler | None = None


def get_scheduler() -> ReminderScheduler:
    """
    Get or create the global scheduler instance.
    
    Returns:
        The global ReminderScheduler instance.
    """
    global _scheduler
    if _scheduler is None:
        _scheduler = ReminderScheduler()
    return _scheduler


@asynccontextmanager
async def scheduler_lifespan() -> AsyncGenerator[ReminderScheduler, None]:
    """
    Async context manager for scheduler lifecycle.
    
    Starts the scheduler on enter and stops it on exit.
    Useful for integrating with FastAPI's lifespan.
    
    Yields:
        The running scheduler instance.
    """
    scheduler = get_scheduler()
    await scheduler.start()
    try:
        yield scheduler
    finally:
        await scheduler.stop()
