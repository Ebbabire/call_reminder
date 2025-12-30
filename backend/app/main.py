"""
Call Me Reminder API - Main Application Entry Point.

This module configures and runs the FastAPI application with:
- CORS middleware for frontend communication
- Background scheduler for processing due reminders
- RESTful API endpoints for reminder management
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routers import reminders_router
from app.services.scheduler import get_scheduler
from app.services.vapi import VapiService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Create database tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    
    Handles startup and shutdown events:
    - Startup: Initialize and start the background scheduler
    - Shutdown: Gracefully stop the scheduler
    """
    # Startup
    logger.info("Starting Call Me Reminder API...")
    
    # Start the reminder scheduler
    scheduler = get_scheduler()
    await scheduler.start()
    logger.info("Background scheduler started")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Call Me Reminder API...")
    await scheduler.stop()
    logger.info("Background scheduler stopped")


app = FastAPI(
    title=settings.app_name,
    description="A premium Call Me Reminder SaaS API with Vapi voice AI integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(reminders_router, prefix="/api/v1")


@app.get("/")
def root():
    """
    Root endpoint.
    
    Returns basic API information and links to documentation.
    """
    return {
        "message": "Welcome to Call Me Reminder API",
        "docs": "/docs",
        "redoc": "/redoc",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns the health status of the API and its dependencies.
    """
    scheduler = get_scheduler()
    vapi_service = VapiService()
    
    # Check Vapi connectivity (non-blocking)
    vapi_healthy = await vapi_service.health_check()
    
    return {
        "status": "healthy",
        "scheduler_running": scheduler.is_running,
        "vapi_configured": bool(settings.vapi_api_key),
        "vapi_healthy": vapi_healthy,
    }


@app.post("/api/v1/test/trigger-scheduler")
async def trigger_scheduler_manually():
    """
    Manually trigger the scheduler to check for due reminders.
    
    Useful for testing and debugging.
    """
    from app.services.scheduler import get_scheduler
    
    scheduler = get_scheduler()
    if not scheduler.is_running:
        return {
            "error": "Scheduler is not running",
            "status": "scheduler_not_running"
        }
    
    # Manually trigger a check
    await scheduler._check_and_process_reminders()
    
    return {
        "message": "Scheduler check triggered manually",
        "status": "success"
    }
