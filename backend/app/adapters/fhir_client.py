"""FHIR client adapters for interacting with FHIR servers."""

import os
from typing import Dict, Any, Optional, List
import httpx
from httpx import Response, TimeoutException, HTTPStatusError
import logging

logger = logging.getLogger(__name__)


class FHIRClientError(Exception):
    """Base exception for FHIR client errors."""
    pass


class FHIRValidationError(FHIRClientError):
    """Exception raised for FHIR validation errors."""
    pass


class FHIRServerError(FHIRClientError):
    """Exception raised for FHIR server errors."""
    def __init__(self, message: str, status_code: int = None, response_body: str = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class BaseFHIRClient:
    """Base FHIR client with common functionality."""

    def __init__(self, base_url: str, timeout: float = 30.0):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.headers = {
            "Accept": "application/fhir+json",
            "Content-Type": "application/fhir+json"
        }

    def _validate_resource(self, resource: Dict[str, Any]) -> None:
        """Validate minimal FHIR resource structure."""
        if not isinstance(resource, dict):
            raise FHIRValidationError("Resource must be a dictionary")

        if "resourceType" not in resource:
            raise FHIRValidationError("Resource must have a 'resourceType' field")

        if not resource["resourceType"]:
            raise FHIRValidationError("'resourceType' cannot be empty")

    def _handle_response(self, response: Response) -> Dict[str, Any]:
        """Handle HTTP response and return JSON data."""
        try:
            response.raise_for_status()
            return response.json()
        except HTTPStatusError as e:
            error_body = response.text
            logger.error(f"HTTP error {response.status_code}: {error_body}")
            raise FHIRServerError(
                f"Server returned {response.status_code}",
                status_code=response.status_code,
                response_body=error_body
            )
        except Exception as e:
            logger.error(f"Error processing response: {str(e)}")
            raise FHIRClientError(f"Failed to process response: {str(e)}")


class SourceFHIRClient(BaseFHIRClient):
    """Client for reading from source FHIR server."""

    async def get_patient(self, patient_id: str) -> Dict[str, Any]:
        """Retrieve a patient by ID."""
        if not patient_id:
            raise ValueError("Patient ID is required")

        url = f"{self.base_url}/Patient/{patient_id}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, headers=self.headers)
                data = self._handle_response(response)
                self._validate_resource(data)
                return data
            except TimeoutException:
                raise FHIRClientError(f"Timeout retrieving patient {patient_id}")
            except Exception as e:
                if isinstance(e, (FHIRClientError, FHIRServerError)):
                    raise
                raise FHIRClientError(f"Failed to retrieve patient: {str(e)}")

    async def search(self, resource_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Search for resources with given parameters."""
        if not resource_type:
            raise ValueError("Resource type is required")

        url = f"{self.base_url}/{resource_type}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, params=params, headers=self.headers)
                data = self._handle_response(response)

                if data.get("resourceType") != "Bundle":
                    raise FHIRValidationError("Search response must be a Bundle")

                return data
            except TimeoutException:
                raise FHIRClientError(f"Timeout searching {resource_type}")
            except Exception as e:
                if isinstance(e, (FHIRClientError, FHIRServerError)):
                    raise
                raise FHIRClientError(f"Failed to search {resource_type}: {str(e)}")

    async def get_patient_resources(self, patient_id: str, resource_types: List[str]) -> Dict[str, List[Dict]]:
        """Retrieve multiple resource types for a patient."""
        resources = {}

        for resource_type in resource_types:
            try:
                if resource_type == "Patient":
                    patient = await self.get_patient(patient_id)
                    resources["Patient"] = [patient]
                else:
                    search_params = {"patient": patient_id}
                    bundle = await self.search(resource_type, search_params)
                    entries = bundle.get("entry", [])
                    resources[resource_type] = [entry["resource"] for entry in entries if "resource" in entry]
            except Exception as e:
                logger.warning(f"Failed to retrieve {resource_type} for patient {patient_id}: {str(e)}")
                resources[resource_type] = []

        return resources


class HapiFHIRClient(BaseFHIRClient):
    """Client for writing to HAPI FHIR server."""

    def __init__(self, base_url: str = None, timeout: float = 30.0):
        base_url = base_url or os.getenv("HAPI_BASE", "http://hapi:8080/fhir")
        super().__init__(base_url, timeout)

    async def create(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new resource."""
        self._validate_resource(resource)

        resource_type = resource["resourceType"]
        url = f"{self.base_url}/{resource_type}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=resource, headers=self.headers)
                return self._handle_response(response)
            except TimeoutException:
                raise FHIRClientError(f"Timeout creating {resource_type}")
            except Exception as e:
                if isinstance(e, (FHIRClientError, FHIRServerError)):
                    raise
                raise FHIRClientError(f"Failed to create {resource_type}: {str(e)}")

    async def read(self, resource_type: str, resource_id: str) -> Dict[str, Any]:
        """Read a resource by type and ID."""
        if not resource_type or not resource_id:
            raise ValueError("Resource type and ID are required")

        url = f"{self.base_url}/{resource_type}/{resource_id}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, headers=self.headers)
                data = self._handle_response(response)
                self._validate_resource(data)
                return data
            except TimeoutException:
                raise FHIRClientError(f"Timeout reading {resource_type}/{resource_id}")
            except Exception as e:
                if isinstance(e, (FHIRClientError, FHIRServerError)):
                    raise
                raise FHIRClientError(f"Failed to read {resource_type}/{resource_id}: {str(e)}")

    async def search(self, resource_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Search for resources with given parameters."""
        if not resource_type:
            raise ValueError("Resource type is required")

        url = f"{self.base_url}/{resource_type}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, params=params, headers=self.headers)
                data = self._handle_response(response)

                if data.get("resourceType") != "Bundle":
                    raise FHIRValidationError("Search response must be a Bundle")

                return data
            except TimeoutException:
                raise FHIRClientError(f"Timeout searching {resource_type}")
            except Exception as e:
                if isinstance(e, (FHIRClientError, FHIRServerError)):
                    raise
                raise FHIRClientError(f"Failed to search {resource_type}: {str(e)}")

    async def transaction(self, bundle: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a transaction bundle."""
        if bundle.get("resourceType") != "Bundle":
            raise FHIRValidationError("Transaction must be a Bundle resource")

        bundle_type = bundle.get("type")
        if bundle_type not in ["transaction", "batch"]:
            raise FHIRValidationError("Bundle type must be 'transaction' or 'batch'")

        entries = bundle.get("entry", [])
        if not entries:
            raise FHIRValidationError("Bundle must contain at least one entry")

        for entry in entries:
            if "request" not in entry:
                raise FHIRValidationError("Each bundle entry must have a 'request' field")
            if "method" not in entry["request"] or "url" not in entry["request"]:
                raise FHIRValidationError("Each request must have 'method' and 'url' fields")

        url = self.base_url

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=bundle, headers=self.headers)
                return self._handle_response(response)
            except TimeoutException:
                raise FHIRClientError("Timeout executing transaction bundle")
            except Exception as e:
                if isinstance(e, (FHIRClientError, FHIRServerError)):
                    raise
                raise FHIRClientError(f"Failed to execute transaction: {str(e)}")