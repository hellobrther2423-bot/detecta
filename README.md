# DETECTOMA

A bilingual (English / العربية) lab-report screening aid. Users upload a photo or PDF of a
lab report (blood test, tumor-marker panel, biopsy, or pathology report); DETECTOMA extracts the
values, compares them against reference ranges, and produces a **screening risk indicator** with
plain-language explanations in the user's language.

> ⚠️ **DETECTOMA is a screening aid, not a medical diagnosis.** It cannot confirm or rule out
> cancer or any disease. Only a qualified doctor can interpret a lab report. Always follow up with
> a healthcare professional.

---

## What's real vs. placeholder (be honest with yourself)

This repository is an **end-to-end working skeleton**. The full flow runs today, but several
pieces are deliberately pluggable placeholders with clean interfaces so real implementations can
drop in later:

| Area | State | How to make it "real" |
|------|-------|-----------------------|
| Auth (email+password, JWT, reset) | **Real** | — |
| Database + per-user isolation | **Real** (SQLite dev, Postgres-ready) | Set `DATABASE_URL` to Postgres |
| Encrypted file storage at rest | **Real** (Fernet/AES) | Point `STORAGE_DIR` at durable disk / swap for S3 adapter |
| Audit logging | **Real** | — |
| Bilingual UI + full RTL mirroring | **Real** | — |
| Localized content layer (EN/AR) | **Real** (JSON, no code changes to edit) | Edit files in `backend/app/content/` |
| OCR / value extraction | **Mock by default**, Google/Azure adapters wired | Add `GOOGLE_VISION_*` or `AZURE_VISION_*` env vars |
| Risk-scoring engine | **Placeholder** rules vs. reference ranges | Implement `RiskEngine` behind the same interface |
| Email (reset codes, reminders) | **Console/mock by default** | Add SMTP env vars |

The mock OCR and mock email providers **auto-activate when no API keys are present**, so you can
run and demo the entire app with zero external accounts.

---

## Architecture

```
detectoma/
├── backend/        FastAPI + SQLAlchemy (Python)
│   └── app/
│       ├── core/         config, database, security, audit
│       ├── models/       SQLAlchemy ORM models
│       ├── schemas/      Pydantic request/response models
│       ├── services/     ocr/, risk engine, storage, email, reminders
│       ├── content/      localized JSON (markers, education, result text)
│       ├── api/          route handlers
│       └── main.py       app entrypoint
└── frontend/       Vite + React + i18next (EN/AR, RTL-aware)
```

## Quick start

### Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:  .venv\Scripts\Activate.ps1
# bash:                source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed          # optional: seed demo content
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:5173

## Configuration

Copy `backend/.env.example` to `backend/.env` and adjust. With **no** cloud keys set, the app
runs fully on mock OCR + console email. See the table above for what each key unlocks.

## Security & compliance posture

- Per-user row ownership enforced on **every** query — no cross-user access path exists.
- Uploaded reports are **encrypted at rest**; filenames are opaque UUIDs.
- Every access to protected health data is **audit-logged** (who, what, when, from where).
- Users can **export all their data** and **permanently delete their account** (privacy rights).
- Structured toward HIPAA-style handling. **Not** a certified/compliant system as-is — a real
  deployment needs a BAA-covered host, TLS everywhere, key management (KMS), backups, and a
  formal risk assessment. This scaffold is designed to make that path straightforward.
