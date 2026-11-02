from fastapi import APIRouter, HTTPException
from app.schemas.classify import ClassifyRequest, ClassifyResponse
from app.services.classifier import classifier_service

router = APIRouter()

@router.post("/classify", response_model=ClassifyResponse, tags=["AI Services"])
async def classify_intent(payload: ClassifyRequest):
    """
    Classifies a developer query into intents:
    - 'github': Code search, commits, PRs, branch queries
    - 'integration': Slack, Notion, Gmail, Teams, webhooks
    - 'general': Coding concepts, general assistance
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    result = classifier_service.predict(payload.text)
    return ClassifyResponse(
        intent=result["intent"],
        confidence=result["confidence"],
        inference_ms=result["inference_ms"],
        probabilities=result.get("probabilities"),
    )

