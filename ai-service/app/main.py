import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.services.classifier import classifier_service
from app.api.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("seam.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup & shutdown events for the FastAPI application.
    Pre-warms ML models and sessions in memory.
    """
    logger.info("Initializing SEAM AI Microservice...")
    try:
        classifier_service.load()
        logger.info("Model pre-warming complete.")
    except Exception as e:
        logger.error(f"Error during model pre-warm: {e}")

    yield

    logger.info("Shutting down SEAM AI Microservice...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Dedicated AI and LLM microservice for SEAM Context AI.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.api_route("/", methods=["GET", "HEAD"], tags=["Root"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", settings.PORT or 8000))
    host = os.environ.get("HOST", settings.HOST or "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port)

