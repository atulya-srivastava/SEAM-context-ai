from fastapi import APIRouter
from app.core.config import settings
from app.services.classifier import classifier_service

router = APIRouter()

@router.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "classifier_ready": classifier_service._is_ready,
        "classifier_model_path": str(classifier_service.model_dir),
    }

