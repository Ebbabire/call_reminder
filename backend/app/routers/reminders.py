"""
Reminder CRUD API endpoints.

Provides Create, Read (with filtering and search), Update, and Delete operations
for reminder resources.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.reminder import Reminder, ReminderStatus
from app.schemas.reminder import (
    ReminderCreate,
    ReminderUpdate,
    ReminderResponse,
    ReminderListResponse,
)

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.post("/", response_model=ReminderResponse, status_code=201)
def create_reminder(
    reminder: ReminderCreate,
    db: Session = Depends(get_db)
) -> Reminder:
    """
    Create a new reminder.
    
    Args:
        reminder: The reminder data to create.
        db: Database session dependency.
        
    Returns:
        The created reminder with generated ID and timestamps.
    """
    db_reminder = Reminder(**reminder.model_dump())
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder


@router.get("/", response_model=ReminderListResponse)
def list_reminders(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    status: ReminderStatus | None = Query(None, description="Filter by status"),
    search: str | None = Query(None, description="Search by title (case-insensitive)"),
    db: Session = Depends(get_db)
) -> dict:
    """
    List all reminders with pagination, filtering, and search.
    
    Args:
        page: Page number (1-indexed).
        per_page: Number of items per page (max 100).
        status: Optional filter by reminder status.
        search: Optional case-insensitive search term for title.
        db: Database session dependency.
        
    Returns:
        Paginated list of reminders with total count.
    """
    query = db.query(Reminder)
    
    # Filter by status if provided
    if status:
        query = query.filter(Reminder.status == status)
    
    # Search by title if provided (case-insensitive)
    if search:
        query = query.filter(Reminder.title.ilike(f"%{search}%"))
    
    total = query.count()
    items = (
        query
        .order_by(Reminder.trigger_at.asc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{reminder_id}", response_model=ReminderResponse)
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db)
) -> Reminder:
    """
    Get a specific reminder by ID.
    
    Args:
        reminder_id: The unique identifier of the reminder.
        db: Database session dependency.
        
    Returns:
        The requested reminder.
        
    Raises:
        HTTPException: 404 if reminder not found.
    """
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@router.patch("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    reminder_update: ReminderUpdate,
    db: Session = Depends(get_db)
) -> Reminder:
    """
    Update an existing reminder.
    
    Only fields provided in the request body will be updated.
    
    Args:
        reminder_id: The unique identifier of the reminder.
        reminder_update: The fields to update.
        db: Database session dependency.
        
    Returns:
        The updated reminder.
        
    Raises:
        HTTPException: 404 if reminder not found.
    """
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    update_data = reminder_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reminder, field, value)
    
    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}", status_code=204)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db)
) -> None:
    """
    Delete a reminder.
    
    Args:
        reminder_id: The unique identifier of the reminder.
        db: Database session dependency.
        
    Raises:
        HTTPException: 404 if reminder not found.
    """
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    db.delete(reminder)
    db.commit()
