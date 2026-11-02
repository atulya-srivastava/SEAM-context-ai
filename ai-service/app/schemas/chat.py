from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class MessageItem(BaseModel):
    role: Optional[Literal["user", "assistant", "system", "ai"]] = "user"
    sender: Optional[str] = None
    content: Optional[str] = None
    text: Optional[str] = None

    def get_role(self) -> str:
        if self.role in ("assistant", "ai") or self.sender in ("assistant", "ai"):
            return "assistant"
        if self.role == "system" or self.sender == "system":
            return "system"
        return "user"

    def get_text(self) -> str:
        return self.text or self.content or ""

class ChatRequest(BaseModel):
    prompt: str = Field(..., description="User prompt or question")
    history: List[MessageItem] = Field(default_factory=list, description="Recent conversation history")
    temperature: float = Field(0.2, ge=0.0, le=1.0)
    system_prompt: Optional[str] = None

class ChatResponse(BaseModel):
    text: str
    model: str
    intent: Optional[str] = None

