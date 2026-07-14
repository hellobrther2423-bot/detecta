"""Report lifecycle routes: upload, OCR extraction, review, analysis, history, trends."""
from __future__ import annotations

import json
from datetime import datetime
from typing import List

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user
from app.core import audit
from app.core.config import settings
from app.core.database import get_db
from app.models.report import MarkerValue, Report, RiskResult
from app.models.user import User
from app.schemas.schemas import (
    MessageResponse,
    ReportDetailResponse,
    ReportResponse,
    ReviewSubmit,
    RiskResultResponse,
    TrendSeries,
)
from app.services import storage
from app.services.ocr.factory import get_ocr_provider
from app.services.risk_engine import MarkerReading, risk_engine

router = APIRouter(prefix="/reports", tags=["reports"])


def _owned_report(report_id: str, current: User, db: Session) -> Report:
    """Fetch a report AND enforce ownership — the single choke point for access."""
    report = db.get(Report, report_id)
    if report is None or report.user_id != current.id:
        # 404 (not 403) so we never confirm the existence of another user's report.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="report_not_found")
    return report


def _risk_result_response(result: RiskResult | None) -> RiskResultResponse | None:
    if result is None:
        return None
    return RiskResultResponse(
        level=result.level,
        score=result.score,
        flagged=json.loads(result.flagged or "[]"),
        engine_version=result.engine_version,
    )


def _report_detail(report: Report) -> ReportDetailResponse:
    """Build a detail response, decoding the risk_result relationship explicitly
    (its `flagged` column is a JSON string, so it can't be auto-validated)."""
    base = ReportResponse.model_validate(report)
    return ReportDetailResponse(
        **base.model_dump(),
        risk_result=_risk_result_response(report.risk_result),
    )


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def upload_report(
    request: Request,
    file: UploadFile = File(...),
    report_type: str = Form("other"),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty_file")
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail="file_too_large")
    allowed = {"image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=415, detail="unsupported_file_type")

    storage_key = storage.save_encrypted(data)
    report = Report(
        user_id=current.id,
        report_type=report_type if report_type in
        {"blood_panel", "tumor_markers", "biopsy", "pathology", "other"} else "other",
        status="uploaded",
        storage_key=storage_key,
        original_filename=file.filename,
        content_type=file.content_type,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    audit.record(db, action="report.upload", user_id=current.id, resource_type="report",
                 resource_id=report.id, ip_address=client_ip(request),
                 user_agent=request.headers.get("user-agent"))
    return ReportResponse.model_validate(report)


@router.post("/{report_id}/extract", response_model=ReportResponse)
def extract_report(
    report_id: str,
    request: Request,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run OCR + marker extraction. Idempotent: re-running replaces prior candidates."""
    report = _owned_report(report_id, current, db)
    if not report.storage_key:
        raise HTTPException(status_code=400, detail="no_file")
    report.status = "extracting"
    db.commit()

    data = storage.load_decrypted(report.storage_key)
    provider = get_ocr_provider()
    hint = current.language  # bias mock/language hints toward the user's language
    result = provider.extract(data, report.content_type or "", hint_language=hint)

    # Replace any existing markers with fresh extraction.
    db.query(MarkerValue).filter(MarkerValue.report_id == report.id).delete()
    for cand in result.markers:
        db.add(MarkerValue(
            report_id=report.id,
            marker_key=cand.marker_key,
            raw_label=cand.raw_label,
            value=cand.value,
            unit=cand.unit,
            confidence=cand.confidence,
        ))
    report.source_language = result.language
    report.ocr_provider = result.provider
    report.status = "review"
    db.commit()
    db.refresh(report)
    audit.record(db, action="report.extract", user_id=current.id, resource_type="report",
                 resource_id=report.id, detail=f"provider={result.provider};lang={result.language}")
    return ReportResponse.model_validate(report)


@router.put("/{report_id}/review", response_model=ReportResponse)
def review_report(
    report_id: str,
    payload: ReviewSubmit,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apply user confirmations/corrections to extracted markers before analysis."""
    report = _owned_report(report_id, current, db)
    existing = {m.marker_key: m for m in report.markers}
    for corr in payload.markers:
        if corr.marker_key in existing:
            m = existing[corr.marker_key]
            m.value = corr.value
            if corr.unit is not None:
                m.unit = corr.unit
            m.user_corrected = 1
        else:
            db.add(MarkerValue(
                report_id=report.id, marker_key=corr.marker_key,
                value=corr.value, unit=corr.unit, user_corrected=1,
            ))
    db.commit()
    db.refresh(report)
    return ReportResponse.model_validate(report)


@router.post("/{report_id}/analyze", response_model=ReportDetailResponse)
def analyze_report(
    report_id: str,
    request: Request,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run the risk engine over the (reviewed) markers and persist the result."""
    report = _owned_report(report_id, current, db)
    readings = [MarkerReading(m.marker_key, m.value, m.unit) for m in report.markers]
    assessment = risk_engine.assess(readings)

    flagged_json = json.dumps([{
        "marker_key": f.marker_key, "value": f.value, "unit": f.unit,
        "reference_low": f.reference_low, "reference_high": f.reference_high,
        "status": f.status, "explanation_key": f.explanation_key,
    } for f in assessment.flagged], ensure_ascii=False)

    if report.risk_result:
        report.risk_result.level = assessment.level
        report.risk_result.score = assessment.score
        report.risk_result.flagged = flagged_json
        report.risk_result.engine_version = assessment.engine_version
    else:
        db.add(RiskResult(
            report_id=report.id, level=assessment.level, score=assessment.score,
            flagged=flagged_json, engine_version=assessment.engine_version,
        ))
    report.status = "analyzed"
    db.commit()
    db.refresh(report)
    audit.record(db, action="report.analyze", user_id=current.id, resource_type="report",
                 resource_id=report.id, detail=f"level={assessment.level}")
    return _report_detail(report)


@router.get("", response_model=List[ReportResponse])
def list_reports(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = (
        db.query(Report)
        .filter(Report.user_id == current.id)
        .order_by(Report.created_at.desc())
        .all()
    )
    return [ReportResponse.model_validate(r) for r in reports]


@router.get("/trends", response_model=List[TrendSeries])
def marker_trends(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Time series per marker across all of the user's analyzed reports."""
    reports = (
        db.query(Report)
        .filter(Report.user_id == current.id)
        .order_by(Report.created_at.asc())
        .all()
    )
    series: dict[str, list] = {}
    for r in reports:
        flagged = {f["marker_key"]: f for f in json.loads(r.risk_result.flagged or "[]")} if r.risk_result else {}
        for m in r.markers:
            if m.value is None:
                continue
            series.setdefault(m.marker_key, []).append({
                "report_id": r.id,
                "date": r.created_at,
                "value": m.value,
                "unit": m.unit,
                "status": flagged.get(m.marker_key, {}).get("status", "normal"),
            })
    return [TrendSeries(marker_key=k, points=v) for k, v in series.items()]


@router.get("/{report_id}", response_model=ReportDetailResponse)
def get_report(
    report_id: str,
    request: Request,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _owned_report(report_id, current, db)
    audit.record(db, action="report.view", user_id=current.id, resource_type="report",
                 resource_id=report.id, ip_address=client_ip(request),
                 user_agent=request.headers.get("user-agent"))
    return _report_detail(report)


@router.delete("/{report_id}", response_model=MessageResponse)
def delete_report(
    report_id: str,
    request: Request,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _owned_report(report_id, current, db)
    if report.storage_key:
        try:
            storage.delete(report.storage_key)
        except Exception:  # noqa: BLE001
            pass
    audit.record(db, action="report.delete", user_id=current.id, resource_type="report",
                 resource_id=report.id, ip_address=client_ip(request))
    db.delete(report)
    db.commit()
    return MessageResponse(detail="report_deleted")
