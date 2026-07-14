"""OCR provider factory — selects a provider from config, with safe fallback to mock."""
from __future__ import annotations

import logging

from app.core.config import settings
from app.services.ocr.base import OCRProvider
from app.services.ocr.mock_provider import MockOCRProvider

logger = logging.getLogger("detectoma.ocr")


def get_ocr_provider() -> OCRProvider:
    choice = (settings.ocr_provider or "auto").lower()

    def _google() -> OCRProvider:
        from app.services.ocr.cloud_providers import GoogleVisionProvider

        return GoogleVisionProvider()

    def _azure() -> OCRProvider:
        from app.services.ocr.cloud_providers import AzureVisionProvider

        return AzureVisionProvider()

    try:
        if choice == "google":
            return _google()
        if choice == "azure":
            return _azure()
        if choice == "mock":
            return MockOCRProvider()
        # auto: prefer a configured cloud provider, else mock.
        if settings.google_vision_credentials_json:
            return _google()
        if settings.azure_vision_endpoint and settings.azure_vision_key:
            return _azure()
    except Exception as exc:  # noqa: BLE001 - degrade gracefully to mock
        logger.warning("OCR provider '%s' unavailable (%s); falling back to mock", choice, exc)

    return MockOCRProvider()
