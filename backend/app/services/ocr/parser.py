"""Shared text→marker parsing used by real OCR providers.

Given raw OCR text (English and/or Arabic), find lines that look like
"<label> <value> <unit>" and map the label to a canonical marker key. Arabic
reports may use Arabic-Indic digits and RTL punctuation, which we normalize.
"""
from __future__ import annotations

import re
from typing import List, Optional

from app.services.content import markers_catalog, resolve_alias
from app.services.ocr.base import MarkerCandidate

# Arabic-Indic and Eastern Arabic-Indic digit maps → ASCII.
_ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")

_NUM_RE = re.compile(r"(\d+(?:[.,]\d+)?)")


def normalize_text(text: str) -> str:
    text = text.translate(_ARABIC_DIGITS)
    # Normalize Arabic decimal separator and common OCR artifacts.
    text = text.replace("٫", ".").replace("،", ",")
    return text


def detect_language(text: str) -> str:
    has_arabic = any("؀" <= ch <= "ۿ" for ch in text)
    has_latin = any("a" <= ch.lower() <= "z" for ch in text)
    if has_arabic and has_latin:
        return "mixed"
    if has_arabic:
        return "ar"
    return "en"


def _to_float(token: str) -> Optional[float]:
    try:
        return float(token.replace(",", "."))
    except ValueError:
        return None


def parse_markers(raw_text: str) -> List[MarkerCandidate]:
    """Best-effort extraction of marker readings from OCR text."""
    text = normalize_text(raw_text)
    candidates: List[MarkerCandidate] = []
    seen: set[str] = set()

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        # Try to find a marker alias anywhere in the line.
        key = _match_marker(line)
        if not key or key in seen:
            continue
        num_match = _NUM_RE.search(line)
        if not num_match:
            continue
        value = _to_float(num_match.group(1))
        if value is None:
            continue
        spec = markers_catalog().get(key, {})
        unit = _find_unit(line) or spec.get("unit")
        candidates.append(
            MarkerCandidate(
                marker_key=key,
                raw_label=line[:120],
                value=value,
                unit=unit,
                confidence=0.75,
            )
        )
        seen.add(key)
    return candidates


def _match_marker(line: str) -> Optional[str]:
    lowered = line.lower()
    for key, spec in markers_catalog().items():
        if key in lowered:
            return key
        for alias in spec.get("aliases", []):
            if alias.strip().lower() in lowered:
                return key
    # Fall back to exact alias resolution on the leading token.
    first = line.split()[0] if line.split() else ""
    return resolve_alias(first)


_UNIT_RE = re.compile(r"(ng/mL|U/mL|mg/dL|g/dL|ng/dl|u/ml)", re.IGNORECASE)


def _find_unit(line: str) -> Optional[str]:
    m = _UNIT_RE.search(line)
    return m.group(1) if m else None
