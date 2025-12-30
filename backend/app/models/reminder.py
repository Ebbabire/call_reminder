from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import enum

from app.database import Base


class ReminderStatus(str, enum.Enum):
    """Status of a reminder."""
    scheduled = "scheduled"
    completed = "completed"
    failed = "failed"


class Reminder(Base):
    """SQLAlchemy model for reminders."""
    
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(String(1000), nullable=False)
    phone_number = Column(String(20), nullable=False)  # E.164 format (e.g., +14155551234)
    trigger_at = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String(50), nullable=False)  # IANA timezone (e.g., America/New_York)
    status = Column(
        SQLEnum(ReminderStatus),
        default=ReminderStatus.scheduled,
        nullable=False
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<Reminder(id={self.id}, title='{self.title}', status={self.status})>"
