"""
Pydantic schemas for Vapi API integration.

These schemas define the request and response structures for interacting
with the Vapi voice AI API.
"""

from pydantic import BaseModel, Field
from typing import Any
from enum import Enum


class VapiCallStatus(str, Enum):
    """Status of a Vapi call."""
    queued = "queued"
    ringing = "ringing"
    in_progress = "in-progress"
    forwarding = "forwarding"
    ended = "ended"


class VapiAssistantOverride(BaseModel):
    """
    Override settings for the Vapi assistant during a call.
    
    Allows customizing the assistant's first message for the specific reminder.
    """
    first_message: str | None = Field(
        None,
        alias="firstMessage",
        description="Custom first message for the assistant to speak"
    )
    
    class Config:
        populate_by_name = True


class VapiCreateCallRequest(BaseModel):
    """
    Request schema for creating a new outbound call via Vapi API.
    
    Reference: https://docs.vapi.ai/api-reference/calls/create-call
    """
    assistant_id: str | None = Field(
        None,
        alias="assistantId",
        description="The ID of the Vapi assistant to use for the call"
    )
    assistant_overrides: VapiAssistantOverride | None = Field(
        None,
        alias="assistantOverrides",
        description="Overrides for the assistant configuration"
    )
    phone_number_id: str = Field(
        ...,
        alias="phoneNumberId",
        description="The ID of the Vapi phone number to call from"
    )
    customer: dict[str, Any] = Field(
        ...,
        description="Customer information including phone number"
    )
    
    class Config:
        populate_by_name = True


class VapiCallResponse(BaseModel):
    """
    Response schema from Vapi API when creating a call.
    
    Contains the call ID and initial status information.
    """
    id: str = Field(..., description="Unique identifier for the call")
    org_id: str | None = Field(None, alias="orgId", description="Organization ID")
    created_at: str | None = Field(None, alias="createdAt", description="Call creation timestamp")
    updated_at: str | None = Field(None, alias="updatedAt", description="Last update timestamp")
    type: str | None = Field(None, description="Call type (outboundPhoneCall)")
    status: VapiCallStatus | None = Field(None, description="Current call status")
    phone_number_id: str | None = Field(None, alias="phoneNumberId")
    assistant_id: str | None = Field(None, alias="assistantId")
    
    class Config:
        populate_by_name = True


class VapiErrorResponse(BaseModel):
    """
    Error response schema from Vapi API.
    """
    message: str = Field(..., description="Error message")
    error: str | None = Field(None, description="Error type")
    status_code: int | None = Field(None, alias="statusCode", description="HTTP status code")
    
    class Config:
        populate_by_name = True
