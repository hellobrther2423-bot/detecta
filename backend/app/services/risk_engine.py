"""Risk-scoring engine (PLACEHOLDER).

⚠️ This is deliberately simple, transparent rule logic for the skeleton — it is
NOT a validated clinical model and must not be treated as medically meaningful.
It exists to (a) make the flow work end-to-end and (b) define a stable interface
so a real, validated model can drop in behind `RiskEngine.assess()` later.

Logic: each marker is compared to its reference range from the content layer.
  value <= reference_high            -> normal
  reference_high < value < high_thr  -> elevated
  value >= high_threshold            -> high
Overall level is the worst individual status, mapped to normal/monitor/follow_up.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from app.services.content import get_marker

ENGINE_VERSION = "placeholder-0.1"


@dataclass
class MarkerReading:
    marker_key: str
    value: Optional[float]
    unit: Optional[str]


@dataclass
class FlaggedResult:
    marker_key: str
    value: Optional[float]
    unit: Optional[str]
    reference_low: Optional[float]
    reference_high: Optional[float]
    status: str  # normal | elevated | high
    explanation_key: str


@dataclass
class Assessment:
    level: str  # normal | monitor | follow_up
    score: float
    flagged: List[FlaggedResult]
    engine_version: str = ENGINE_VERSION


_STATUS_WEIGHT = {"normal": 0.0, "elevated": 0.5, "high": 1.0}
_STATUS_TO_LEVEL = {"normal": "normal", "elevated": "monitor", "high": "follow_up"}


class RiskEngine:
    """Interface point for risk scoring. Swap the body of `assess` for a real model."""

    def assess(self, readings: List[MarkerReading]) -> Assessment:
        flagged: List[FlaggedResult] = []
        worst = "normal"
        total = 0.0
        counted = 0

        for r in readings:
            spec = get_marker(r.marker_key)
            if not spec or r.value is None:
                continue
            ref_low = spec.get("reference_low")
            ref_high = spec.get("reference_high")
            high_thr = spec.get("high_threshold", (ref_high or 0) * 4)

            if ref_high is not None and r.value >= high_thr:
                status = "high"
            elif ref_high is not None and r.value > ref_high:
                status = "elevated"
            else:
                status = "normal"

            total += _STATUS_WEIGHT[status]
            counted += 1
            if _STATUS_WEIGHT[status] > _STATUS_WEIGHT[worst]:
                worst = status

            flagged.append(
                FlaggedResult(
                    marker_key=r.marker_key,
                    value=r.value,
                    unit=r.unit or spec.get("unit"),
                    reference_low=ref_low,
                    reference_high=ref_high,
                    status=status,
                    explanation_key=status,
                )
            )

        score = round(total / counted, 3) if counted else 0.0
        level = _STATUS_TO_LEVEL[worst]
        return Assessment(level=level, score=score, flagged=flagged)


risk_engine = RiskEngine()
