from typing import Optional, Dict
from pydantic import BaseModel, Field

class ClassifyRequest(BaseModel):
    text: str = Field(..., description="Query text to classify into intent")

class ClassifyResponse(BaseModel):
    intent: str = Field(..., description="Predicted intent: 'github' | 'integration' | 'general'")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    inference_ms: float = Field(..., description="Inference latency in milliseconds")
    probabilities: Optional[Dict[str, float]] = None

