"""Chat assistant service. Provider interface with a mock default that activates
when no API key is configured, so the chatbot works out-of-the-box. Add an
OpenAI or Anthropic key (see .env.example) to switch to a real LLM.

The system prompt keeps the assistant firmly in "screening aid, not diagnosis"
territory and bilingual (EN/AR)."""
from __future__ import annotations

import json
import urllib.request
import urllib.error

from app.core.config import settings

SYSTEM_PROMPT = (
    "You are DETECTA's assistant, a friendly, careful health-literacy helper. "
    "DETECTA is a bilingual (English/Arabic) lab-report screening aid — NOT a diagnostic tool. "
    "Help users understand general information about lab markers (e.g. CEA, CA-125, PSA, AFP), "
    "reference ranges, and how to use the app. "
    "ALWAYS remind users that DETECTA is a screening aid and only a qualified doctor can diagnose. "
    "Never give a diagnosis, never tell someone they do or don't have cancer, and encourage "
    "follow-up with a healthcare professional for anything concerning. "
    "If the user writes in Arabic, reply in Arabic; if in English, reply in English. "
    "Keep answers concise, warm, and non-alarming."
)

# Canned bilingual responses for the mock provider — keyed by simple intent.
_MOCK = {
    "en": {
        "greeting": "Hi! I'm the DETECTA assistant. I can explain lab markers, reference ranges, "
        "and how to use the app. Remember: I'm a screening aid, not a doctor. What would you like to know?",
        "marker": "That marker is one of several the report may include. In general, a value inside the "
        "reference range is reassuring, while a higher value can have many causes — not only cancer. "
        "DETECTA flags values worth a second look, but only a doctor can interpret them for you.",
        "fallback": "I can help explain markers, results, or how DETECTA works. For anything about your "
        "specific health, please follow up with a doctor — DETECTA is a screening aid, not a diagnosis.",
    },
    "ar": {
        "greeting": "مرحبًا! أنا مساعد DETECTA. يمكنني شرح مؤشرات المختبر والنطاقات المرجعية وكيفية استخدام "
        "التطبيق. تذكّر أنني أداة فحص أولي ولست طبيبًا. بماذا تحب أن أساعدك؟",
        "marker": "هذا المؤشر واحد من عدة مؤشرات قد يتضمّنها التقرير. عمومًا، القيمة ضمن النطاق المرجعي مطمئنة، "
        "بينما القيمة الأعلى قد يكون لها أسباب كثيرة — ليست السرطان فقط. يشير DETECTA إلى القيم التي تستحق نظرة "
        "ثانية، لكن الطبيب وحده من يفسّرها لك.",
        "fallback": "يمكنني شرح المؤشرات أو النتائج أو كيفية عمل DETECTA. لأي أمر يخص صحتك تحديدًا، يُرجى مراجعة "
        "طبيب — DETECTA أداة فحص أولي وليست تشخيصًا.",
    },
}

MARKER_HINTS = ("cea", "ca-125", "ca125", "psa", "afp", "marker", "مؤشر", "تحليل", "نتيجة", "range", "نطاق")


def _detect_lang(text: str) -> str:
    return "ar" if any("؀" <= ch <= "ۿ" for ch in text) else "en"


def _mock_reply(message: str) -> str:
    lang = _detect_lang(message)
    low = message.lower().strip()
    bank = _MOCK[lang]
    if len(low) < 12 and any(g in low for g in ("hi", "hello", "hey", "مرحبا", "السلام", "اهلا")):
        return bank["greeting"]
    if any(h in low for h in MARKER_HINTS):
        return bank["marker"]
    return bank["fallback"]


def _openai_reply(history: list[dict]) -> str:
    body = {
        "model": settings.openai_model,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *history],
        "temperature": 0.3,
        "max_tokens": 400,
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data["choices"][0]["message"]["content"].strip()


def _anthropic_reply(history: list[dict]) -> str:
    body = {
        "model": settings.anthropic_model,
        "system": SYSTEM_PROMPT,
        "max_tokens": 400,
        "messages": history,
    }
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode(),
        headers={
            "x-api-key": settings.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return "".join(block.get("text", "") for block in data.get("content", [])).strip()


def _resolve_provider() -> str:
    p = settings.chat_provider.lower()
    if p != "auto":
        return p
    if settings.anthropic_api_key:
        return "anthropic"
    if settings.openai_api_key:
        return "openai"
    return "mock"


def chat_reply(history: list[dict]) -> tuple[str, str]:
    """history: list of {role: 'user'|'assistant', content: str}. Returns (reply, provider)."""
    provider = _resolve_provider()
    last_user = next((m["content"] for m in reversed(history) if m["role"] == "user"), "")
    try:
        if provider == "openai":
            return _openai_reply(history), "openai"
        if provider == "anthropic":
            return _anthropic_reply(history), "anthropic"
    except (urllib.error.URLError, KeyError, TimeoutError, ValueError):
        # Any provider failure degrades gracefully to the mock reply.
        return _mock_reply(last_user), "mock-fallback"
    return _mock_reply(last_user), "mock"
