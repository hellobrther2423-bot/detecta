"""Mock OCR provider — returns realistic, deterministic marker candidates so the
full app flow works with zero external accounts. Auto-selected when no cloud
OCR keys are configured.

Determinism note: values are derived from a hash of the uploaded bytes, so the
same file always yields the same reading (no Math.random-style flakiness), and
different files yield different, plausible readings. This is NOT real OCR — it
does not read the actual document.
"""
from __future__ import annotations

import hashlib
from typing import List

from app.services.content import markers_catalog
from app.services.ocr.base import MarkerCandidate, OCRResult


class MockOCRProvider:
    name = "mock"

    def extract(self, data: bytes, content_type: str, hint_language: str = "auto") -> OCRResult:
        seed = int.from_bytes(hashlib.sha256(data).digest()[:8], "big")
        markers = self._synth_markers(seed)
        lang = "ar" if hint_language == "ar" else "en"
        raw_text = self._render_text(markers, lang)
        return OCRResult(provider=self.name, raw_text=raw_text, language=lang, markers=markers)

    def _synth_markers(self, seed: int) -> List[MarkerCandidate]:
        out: List[MarkerCandidate] = []
        for i, (key, spec) in enumerate(markers_catalog().items()):
            low = float(spec.get("reference_low", 0.0))
            high = float(spec.get("reference_high", 10.0))
            span = max(high - low, 1.0)
            # Spread values across a plausible band: mostly normal, occasionally elevated.
            bucket = (seed >> (i * 3)) % 10
            if bucket < 6:
                value = round(low + span * ((bucket + 1) / 10.0), 1)          # normal
            elif bucket < 9:
                value = round(high * (1.1 + 0.3 * (bucket - 6)), 1)           # elevated
            else:
                value = round(float(spec.get("high_threshold", high * 4)) * 1.2, 1)  # high
            out.append(
                MarkerCandidate(
                    marker_key=key,
                    raw_label=spec.get("name", {}).get("en", key),
                    value=value,
                    unit=spec.get("unit"),
                    confidence=0.72,
                )
            )
        return out

    def _render_text(self, markers: List[MarkerCandidate], lang: str) -> str:
        header = "تقرير مختبر (نموذج توضيحي)" if lang == "ar" else "Laboratory Report (demo sample)"
        lines = [header]
        for m in markers:
            lines.append(f"{m.raw_label}: {m.value} {m.unit or ''}".strip())
        return "\n".join(lines)
