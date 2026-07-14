"""Localized content layer — loads editable JSON so UI text, marker catalog, and
result explanations can be maintained in both languages without code changes.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

_CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"


def _load(name: str) -> Dict[str, Any]:
    with open(_CONTENT_DIR / name, encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache
def markers_catalog() -> Dict[str, Any]:
    return _load("markers.json")["markers"]


@lru_cache
def results_content() -> Dict[str, Any]:
    return _load("results.json")


@lru_cache
def education_content() -> Dict[str, Any]:
    return _load("education.json")


def get_marker(marker_key: str) -> Optional[Dict[str, Any]]:
    return markers_catalog().get(marker_key)


def resolve_alias(text: str) -> Optional[str]:
    """Map a raw report label to a canonical marker key via the alias table."""
    needle = text.strip().lower()
    for key, spec in markers_catalog().items():
        if needle == key:
            return key
        for alias in spec.get("aliases", []):
            if needle == alias.strip().lower():
                return key
    return None


def localized(node: Dict[str, Any], lang: str, fallback: str = "en") -> str:
    """Pick a language variant from an {en, ar} dict, falling back gracefully."""
    if not isinstance(node, dict):
        return str(node)
    return node.get(lang) or node.get(fallback) or next(iter(node.values()), "")
