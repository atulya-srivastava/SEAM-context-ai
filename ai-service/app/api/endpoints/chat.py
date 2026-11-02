import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm import llm_service
from app.services.classifier import classifier_service
from app.core.config import settings

router = APIRouter()

@router.post("/chat", response_model=ChatResponse, tags=["AI Services"])
async def handle_chat(payload: ChatRequest):
    """
    Synchronous general chat completion with automatic intent tagging.
    """
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    # Detect query intent
    intent_result = classifier_service.predict(payload.prompt)
    intent = intent_result.get("intent", "general")

    try:
        reply_text = await llm_service.generate_response(
            prompt=payload.prompt,
            history=payload.history,
            temperature=payload.temperature,
            system_prompt=payload.system_prompt,
        )
        return ChatResponse(
            text=reply_text,
            model=settings.GROQ_MODEL,
            intent=intent,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM execution error: {str(e)}")

@router.post("/chat/stream", tags=["AI Services"])
async def handle_chat_stream(payload: ChatRequest):
    """
    High-performance token streaming endpoint via Server-Sent Events (SSE).
    """
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    intent_result = classifier_service.predict(payload.prompt)
    intent = intent_result.get("intent", "general")

    async def event_generator():
        # First event: deliver metadata (intent & model)
        init_meta = {
            "type": "meta",
            "intent": intent,
            "model": settings.GROQ_MODEL,
        }
        yield f"data: {json.dumps(init_meta)}\n\n"

        try:
            async for chunk_item in llm_service.stream_response(
                prompt=payload.prompt,
                history=payload.history,
                temperature=payload.temperature,
                system_prompt=payload.system_prompt,
            ):
                yield f"data: {json.dumps(chunk_item)}\n\n"

            # Completion marker
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            error_data = {"type": "error", "error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
