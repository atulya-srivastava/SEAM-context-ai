from fastapi import APIRouter
from app.api.endpoints import health, classify, chat

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(classify.router, prefix="/ai")
api_router.include_router(chat.router, prefix="/ai")

