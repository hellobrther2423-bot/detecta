"""OCR provider interface and shared result types.

The pipeline is provider-agnostic: `extract()` returns raw text plus a list of
parsed marker candidates. Real providers (Google Vision, Azure) and a Mock
provider all implement the same `OCRProvider` protocol, so swapping them is a
config change, never a code change.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Protocol


@dataclass
class MarkerCandidate:
    marker_key: str
    raw_label: Optional[str]
    value: Optional[float]
    unit: Optional[str]
    confidence: float = 0.8


@dataclass
class OCRResult:
    provider: str
    raw_text: str
    language: str  # "en" | "ar" | "mixed"
    markers: List[MarkerCandidate] = field(default_factory=list)


class OCRProvider(Protocol):
    name: str

    def extract(self, data: bytes, content_type: str, hint_language: str = "auto") -> OCRResult:
        """Extract text and marker candidates from a report image/PDF."""
        ...
