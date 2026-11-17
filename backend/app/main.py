from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.database import engine, Base
from app import models
from app.routes import enquiries, stats, settings
from app.auth import router as auth_router

ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(ENV_PATH)

enable_docs = os.getenv("ENABLE_DOCS", "true").lower() == "true"

# Create database tables automatically upon startup
Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(
    title="Kiwi Connect - AI Enquiry Automation API",
    description="Automated enquiry processing, AI analysis, categorization, and lead management",
    version="1.0.0",
    docs_url="/docs" if enable_docs else None,
    redoc_url="/redoc" if enable_docs else None,
    openapi_url="/openapi.json" if enable_docs else None,
)

# Configure CORS (Cross-Origin Resource Sharing)
# Only allow the frontend origins, not "*"
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(enquiries.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(settings.router, prefix="/api")


@app.get("/")
def read_root():
    """Root endpoint to verify the API is up."""
    return {
        "message": "Welcome to Kiwi Connect AI Enquiry Automation API",
        "docs_url": "/docs",
        "health_check": "/api/health",
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint to test backend status and connectivity."""
    return {
        "status": "ok",
        "service": "Kiwi Enquiry AI Backend",
        "version": "1.0.0",
    }
