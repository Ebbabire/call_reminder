"""
Vapi Voice AI integration service.

This module provides a service class for interacting with the Vapi API
to trigger outbound phone calls with AI assistants.
"""

import httpx
import logging
from dataclasses import dataclass
from typing import Optional

from app.config import get_settings
from app.schemas.vapi import (
    VapiCreateCallRequest,
    VapiCallResponse,
    VapiAssistantOverride,
)

logger = logging.getLogger(__name__)


@dataclass
class VapiCallResult:
    """
    Result of a Vapi call attempt.
    
    Attributes:
        success: Whether the call was triggered successfully.
        call_id: The Vapi call ID if successful.
        error_message: Error details if the call failed.
    """
    success: bool
    call_id: Optional[str] = None
    error_message: Optional[str] = None


class VapiService:
    """
    Service for interacting with the Vapi Voice AI API.
    
    Handles authentication, request formatting, and error handling
    for outbound call creation.
    """
    
    def __init__(self):
        """Initialize the Vapi service with configuration settings."""
        self.settings = get_settings()
        self.api_url = self.settings.vapi_api_url
        self.api_key = self.settings.vapi_api_key
        self.assistant_id = self.settings.vapi_assistant_id
        self.phone_number_id = self.settings.vapi_phone_number_id
    
    def _get_headers(self) -> dict[str, str]:
        """
        Get the authorization headers for Vapi API requests.
        
        Returns:
            Dictionary containing Authorization and Content-Type headers.
        """
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
    
    def _validate_configuration(self) -> Optional[str]:
        """
        Validate that all required Vapi configuration is present.
        
        Returns:
            Error message if configuration is invalid, None otherwise.
        """
        if not self.api_key:
            return "Vapi API key is not configured"
        if not self.assistant_id:
            return "Vapi assistant ID is not configured"
        if not self.phone_number_id:
            return "Vapi phone number ID is not configured"
        return None
    
    async def trigger_call(
        self,
        phone_number: str,
        message: str,
        reminder_title: str,
    ) -> VapiCallResult:
        """
        Trigger an outbound call via Vapi API.
        
        Creates an outbound phone call using the configured Vapi assistant.
        The assistant will speak the reminder message to the recipient.
        
        Args:
            phone_number: The recipient's phone number in E.164 format.
            message: The reminder message for the assistant to speak.
            reminder_title: The title of the reminder (used in first message).
            
        Returns:
            VapiCallResult indicating success or failure with details.
        """
        # Validate configuration
        config_error = self._validate_configuration()
        if config_error:
            logger.error(f"Vapi configuration error: {config_error}")
            logger.error(
                f"Vapi config check - API Key: {'Set' if self.api_key else 'Missing'}, "
                f"Assistant ID: {'Set' if self.assistant_id else 'Missing'}, "
                f"Phone Number ID: {'Set' if self.phone_number_id else 'Missing'}"
            )
            return VapiCallResult(
                success=False,
                error_message=config_error,
            )
        
        # Build the request payload
        first_message = (
            f"Hello! This is your reminder about: {reminder_title}. "
            f"{message}"
        )
        
        request_data = VapiCreateCallRequest(
            assistant_id=self.assistant_id,
            assistant_overrides=VapiAssistantOverride(
                first_message=first_message,
            ),
            phone_number_id=self.phone_number_id,
            customer={
                "number": phone_number,
            },
        )
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Vapi API endpoint is /calls (plural)
                url = f"{self.api_url}/calls"
                payload = request_data.model_dump(by_alias=True, exclude_none=True)
                
                logger.debug(f"Vapi API request URL: {url}")
                logger.debug(f"Vapi API request payload: {payload}")
                
                response = await client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload,
                )
                
                logger.debug(f"Vapi API response status: {response.status_code}")
                logger.debug(f"Vapi API response body: {response.text}")
                
                if response.status_code in (200, 201):
                    # Parse successful response
                    try:
                        response_json = response.json()
                        call_response = VapiCallResponse.model_validate(response_json)
                        logger.info(
                            f"Vapi call triggered successfully. "
                            f"Call ID: {call_response.id}, Phone: {phone_number}"
                        )
                        return VapiCallResult(
                            success=True,
                            call_id=call_response.id,
                        )
                    except Exception as e:
                        logger.error(f"Error parsing Vapi response: {e}, Response: {response.text}")
                        return VapiCallResult(
                            success=False,
                            error_message=f"Error parsing Vapi response: {str(e)}",
                        )
                else:
                    # Handle API error response
                    error_body = response.text
                    try:
                        error_json = response.json()
                        error_message = error_json.get("message", error_json.get("error", error_body))
                    except:
                        error_message = error_body
                    
                    logger.error(
                        f"Vapi API error. Status: {response.status_code}, "
                        f"Response: {error_message}"
                    )
                    return VapiCallResult(
                        success=False,
                        error_message=f"Vapi API error ({response.status_code}): {error_message}",
                    )
                    
        except httpx.TimeoutException:
            error_msg = "Vapi API request timed out"
            logger.error(error_msg)
            return VapiCallResult(
                success=False,
                error_message=error_msg,
            )
        except httpx.RequestError as e:
            error_msg = f"Vapi API request failed: {str(e)}"
            logger.error(error_msg)
            return VapiCallResult(
                success=False,
                error_message=error_msg,
            )
        except Exception as e:
            error_msg = f"Unexpected error calling Vapi API: {str(e)}"
            logger.exception(error_msg)
            return VapiCallResult(
                success=False,
                error_message=error_msg,
            )
    
    async def health_check(self) -> bool:
        """
        Check if the Vapi API is reachable and credentials are valid.
        
        Returns:
            True if the API is accessible, False otherwise.
        """
        if not self.api_key:
            return False
            
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try to list calls (minimal endpoint to verify auth)
                response = await client.get(
                    f"{self.api_url}/calls",
                    headers=self._get_headers(),
                    params={"limit": 1},
                )
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Vapi health check failed: {e}")
            return False
