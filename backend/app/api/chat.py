"""Chat assistant route. Public (no auth required) so the widget works on the
landing page too. Rate-limited by message count in the request schema."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.chat import chat_reply

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest):
    history = [{"role": m.role, "content": m.content} for m in payload.messages]
    reply, provider = chat_reply(history)
    return ChatResponse(reply=reply, provider=provider)
