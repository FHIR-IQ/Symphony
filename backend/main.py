from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
import logging

from app.routers import ingest, summarize, materialize, viewer, export

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(title="Symphony API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://web:3000",
        "https://frontend-joszqqcka-aks129s-projects.vercel.app",
        "https://*.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(summarize.router)
app.include_router(materialize.router)
app.include_router(viewer.router)
app.include_router(export.router)

class HealthResponse(BaseModel):
    status: str

@app.get("/api/health", response_model=HealthResponse)
async def health() -> Dict[str, str]:
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Symphony API"}