from datetime import datetime
from pydantic import BaseModel, Field, field_validator
import re

from app.models.reminder import ReminderStatus


class ReminderBase(BaseModel):
    """Base schema for reminder data."""
    
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=1000)
    phone_number: str = Field(..., description="Phone number in E.164 format")
    trigger_at: datetime = Field(..., description="UTC datetime when reminder should trigger")
    timezone: str = Field(..., description="IANA timezone identifier")

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        """Validate phone number is in E.164 format."""
        e164_pattern = r"^\+[1-9]\d{1,14}$"
        if not re.match(e164_pattern, v):
            raise ValueError(
                "Phone number must be in E.164 format (e.g., +14155551234)"
            )
        return v


class ReminderCreate(ReminderBase):
    """Schema for creating a new reminder."""
    pass


class ReminderUpdate(BaseModel):
    """Schema for updating an existing reminder."""
    
    title: str | None = Field(None, min_length=1, max_length=255)
    message: str | None = Field(None, min_length=1, max_length=1000)
    phone_number: str | None = Field(None, description="Phone number in E.164 format")
    trigger_at: datetime | None = Field(None, description="UTC datetime when reminder should trigger")
    timezone: str | None = Field(None, description="IANA timezone identifier")
    status: ReminderStatus | None = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str | None) -> str | None:
        """Validate phone number is in E.164 format if provided."""
        if v is None:
            return v
        e164_pattern = r"^\+[1-9]\d{1,14}$"
        if not re.match(e164_pattern, v):
            raise ValueError(
                "Phone number must be in E.164 format (e.g., +14155551234)"
            )
        return v


class ReminderResponse(ReminderBase):
    """Schema for reminder response."""
    
    id: int
    status: ReminderStatus
    created_at: datetime

    class Config:
        from_attributes = True


class ReminderListResponse(BaseModel):
    """Schema for paginated reminder list response."""
    
    items: list[ReminderResponse]
    total: int
    page: int
    per_page: int
