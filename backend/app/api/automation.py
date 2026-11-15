from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import AutomationLog, User
from app.schemas import AutomationLogOut
from app.services.n8n import retry_n8n_event

router = APIRouter(prefix="/automation", tags=["automation"])


@router.post("/webhook")
async def mock_webhook(request: Request):
    """
    Simulated local webhook receiver for n8n workflows.
    Accepts NetraX automation events, logs headers/payload, and confirms receipt with HTTP 200.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}
    return {
        "status": "success",
        "message": "Event received and processed by NetraX automation runner",
        "event": request.headers.get("X-NetraX-Event", "unknown"),
        "payload_summary": {
            "screening_id": body.get("screening_id"),
            "patient_id": body.get("patient_id"),
        },
    }


@router.get("/logs", response_model=list[AutomationLogOut])
def list_automation_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Retrieve recent outbound automation events (n8n webhooks) and delivery statuses."""
    return (
        db.query(AutomationLog)
        .order_by(AutomationLog.id.desc())
        .limit(min(limit, 100))
        .all()
    )


@router.post("/logs/{log_id}/retry", response_model=AutomationLogOut)
def retry_automation_log(
    log_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Retry an outbound automation event."""
    try:
        return retry_n8n_event(db, log_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
