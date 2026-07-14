"""Cloud OCR adapters (Google Vision / Azure Vision).

These are wired but inert unless the corresponding SDK + credentials are present.
They deliberately raise a clear error if selected without configuration, so the
factory can fall back to mock. To enable:

  Google:  pip install google-cloud-vision   + set GOOGLE_VISION_CREDENTIALS_JSON
  Azure:   pip install azure-cognitiveservices-vision-computervision
           + set AZURE_VISION_ENDPOINT / AZURE_VISION_KEY

Both use the shared parser to turn recognized text into marker candidates, so
EN + AR reports are handled identically downstream.
"""
from __future__ import annotations

from app.core.config import settings
from app.services.ocr.base import OCRResult
from app.services.ocr.parser import detect_language, parse_markers


class GoogleVisionProvider:
    name = "google"

    def __init__(self) -> None:
        if not settings.google_vision_credentials_json:
            raise RuntimeError("Google Vision selected but GOOGLE_VISION_CREDENTIALS_JSON is not set")
        try:
            from google.cloud import vision  # noqa: F401
        except ImportError as exc:  # pragma: no cover - optional dep
            raise RuntimeError("google-cloud-vision is not installed") from exc

    def extract(self, data: bytes, content_type: str, hint_language: str = "auto") -> OCRResult:
        # pragma: no cover - requires live credentials
        import json

        from google.cloud import vision
        from google.oauth2 import service_account

        creds = service_account.Credentials.from_service_account_info(
            json.loads(settings.google_vision_credentials_json)
        )
        client = vision.ImageAnnotatorClient(credentials=creds)
        image = vision.Image(content=data)
        # Document text detection handles dense report layouts and Arabic script.
        resp = client.document_text_detection(
            image=image, image_context={"language_hints": ["en", "ar"]}
        )
        if resp.error.message:
            raise RuntimeError(f"Google Vision error: {resp.error.message}")
        text = resp.full_text_annotation.text or ""
        return OCRResult(
            provider=self.name,
            raw_text=text,
            language=detect_language(text),
            markers=parse_markers(text),
        )


class AzureVisionProvider:
    name = "azure"

    def __init__(self) -> None:
        if not (settings.azure_vision_endpoint and settings.azure_vision_key):
            raise RuntimeError("Azure Vision selected but endpoint/key are not set")
        try:
            from azure.cognitiveservices.vision.computervision import (  # noqa: F401
                ComputerVisionClient,
            )
        except ImportError as exc:  # pragma: no cover - optional dep
            raise RuntimeError("azure vision SDK is not installed") from exc

    def extract(self, data: bytes, content_type: str, hint_language: str = "auto") -> OCRResult:
        # pragma: no cover - requires live credentials
        import io
        import time

        from azure.cognitiveservices.vision.computervision import ComputerVisionClient
        from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
        from msrest.authentication import CognitiveServicesCredentials

        client = ComputerVisionClient(
            settings.azure_vision_endpoint,
            CognitiveServicesCredentials(settings.azure_vision_key),
        )
        op = client.read_in_stream(io.BytesIO(data), raw=True)
        op_id = op.headers["Operation-Location"].split("/")[-1]
        while True:
            result = client.get_read_result(op_id)
            if result.status not in (OperationStatusCodes.not_started, OperationStatusCodes.running):
                break
            time.sleep(1)
        lines = []
        if result.status == OperationStatusCodes.succeeded:
            for page in result.analyze_result.read_results:
                for line in page.lines:
                    lines.append(line.text)
        text = "\n".join(lines)
        return OCRResult(
            provider=self.name,
            raw_text=text,
            language=detect_language(text),
            markers=parse_markers(text),
        )
