"""DETECTOMA FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import account, auth, billing, chat, content, reminders, reports
from app.core.config import settings
from app.core.database import init_db

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="DETECTOMA API",
    version="0.1.0",
    description="Bilingual (EN/AR) lab-report screening aid. Screening only — not a diagnosis.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(account.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(content.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/api/health", tags=["meta"])
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
        "ocr_provider": settings.ocr_provider,
    }
