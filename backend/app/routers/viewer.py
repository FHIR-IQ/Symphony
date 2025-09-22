"""FHIR resource viewer endpoints."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import httpx
import os

router = APIRouter()

HAPI_BASE = os.getenv("HAPI_BASE", "http://localhost:8080/fhir")

@router.get("/api/viewer/{resource_type}/{resource_id}")
async def view_resource(resource_type: str, resource_id: str):
    """Proxy requests to HAPI FHIR server for resource viewing."""
    url = f"{HAPI_BASE}/{resource_type}/{resource_id}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)

        if response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"{resource_type}/{resource_id} not found")
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="HAPI server error")

        return response.json()

    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="HAPI server unavailable")

@router.get("/api/viewer/{resource_type}/{resource_id}/raw")
async def view_resource_raw(resource_type: str, resource_id: str):
    """Redirect to HAPI FHIR server for direct viewing."""
    url = f"{HAPI_BASE}/{resource_type}/{resource_id}"
    return RedirectResponse(url=url, status_code=302)