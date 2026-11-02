import logging
from typing import List, AsyncGenerator
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.core.config import settings
from app.schemas.chat import MessageItem

logger = logging.getLogger("seam.llm")

SEAM_SYSTEM_PROMPT = """You are SEAM (Context AI), an intelligent workspace assistant and developer context bot.
Your role is to help users navigate and manage their development workspace and team integrations:
- GitHub Context: Searching code, analyzing repositories, explaining commits, branches, PRs, and issue tracking.
- Team Integrations: Sending messages and syncing context with Slack, Notion, Gmail, MS Teams, Google Drive, and webhooks.
- General AI Assistance: Answering technical queries, debugging code, explaining concepts, and assisting developers.

When asked questions such as "what can you do?", "who are you?", or general questions, introduce yourself as SEAM, summarize how you assist with GitHub, Slack, Notion, and workspace context, and offer your help naturally. Always respond dynamically and conversationally without hardcoded responses."""

class LLMService:
    def __init__(self):
        self._model = None

    def _get_model(self, temperature: float = 0.2):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY is not configured in settings or environment")
        return ChatGroq(
            api_key=api_key,
            model=settings.GROQ_MODEL or "llama-3.3-70b-versatile",
            temperature=temperature,
        )

    def _format_messages(self, prompt: str, history: List[MessageItem], system_prompt: str = None):
        messages = [SystemMessage(content=system_prompt or SEAM_SYSTEM_PROMPT)]
        for item in history[-10:]:
            role = item.get_role()
            text = item.get_text()
            if not text:
                continue
            if role == "assistant":
                messages.append(AIMessage(content=text))
            elif role == "system":
                messages.append(SystemMessage(content=text))
            else:
                messages.append(HumanMessage(content=text))
        messages.append(HumanMessage(content=prompt))
        return messages

    async def generate_response(
        self,
        prompt: str,
        history: List[MessageItem] = None,
        temperature: float = 0.2,
        system_prompt: str = None
    ) -> str:
        model = self._get_model(temperature=temperature)
        messages = self._format_messages(prompt, history or [], system_prompt)
        response = await model.ainvoke(messages)
        return response.content

    async def stream_response(
        self,
        prompt: str,
        history: List[MessageItem] = None,
        temperature: float = 0.2,
        system_prompt: str = None
    ) -> AsyncGenerator[dict, None]:
        model = self._get_model(temperature=temperature)
        messages = self._format_messages(prompt, history or [], system_prompt)
        async for chunk in model.astream(messages):
            # Check for reasoning/thinking tokens (supported in models like gpt-oss-20b, deepseek-r1)
            reasoning = chunk.additional_kwargs.get("reasoning_content") if hasattr(chunk, "additional_kwargs") else None
            if reasoning:
                yield {"type": "reasoning", "content": reasoning}

            # Standard content tokens
            if chunk.content:
                yield {"type": "token", "content": chunk.content}

llm_service = LLMService()
