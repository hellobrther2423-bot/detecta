"""Public localized content routes: marker catalog, education, result explanations."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.services.content import education_content, markers_catalog, results_content

router = APIRouter(prefix="/content", tags=["content"])


@router.get("/markers")
def get_markers(lang: str = Query("en", pattern="^(en|ar)$")):
    """Marker catalog localized to `lang` (names + per-status explanations + ranges)."""
    out = []
    for key, spec in markers_catalog().items():
        out.append({
            "marker_key": key,
            "name": spec.get("name", {}).get(lang) or spec.get("name", {}).get("en"),
            "unit": spec.get("unit"),
            "reference_low": spec.get("reference_low"),
            "reference_high": spec.get("reference_high"),
            "explanations": {
                status_key: (spec.get("explanation", {}).get(status_key, {}).get(lang)
                             or spec.get("explanation", {}).get(status_key, {}).get("en"))
                for status_key in ("normal", "elevated", "high")
            },
        })
    return {"lang": lang, "markers": out}


@router.get("/results")
def get_result_content(lang: str = Query("en", pattern="^(en|ar)$")):
    """Localized overall result-level titles/summaries and the disclaimer."""
    content = results_content()
    levels = {
        key: {"title": v["title"].get(lang) or v["title"]["en"],
              "summary": v["summary"].get(lang) or v["summary"]["en"]}
        for key, v in content["levels"].items()
    }
    disclaimer = content["disclaimer"].get(lang) or content["disclaimer"]["en"]
    return {"lang": lang, "levels": levels, "disclaimer": disclaimer}


@router.get("/education")
def get_education(lang: str = Query("en", pattern="^(en|ar)$")):
    articles = [
        {"id": a["id"], "title": a["title"].get(lang) or a["title"]["en"],
         "body": a["body"].get(lang) or a["body"]["en"]}
        for a in education_content()["articles"]
    ]
    return {"lang": lang, "articles": articles}
