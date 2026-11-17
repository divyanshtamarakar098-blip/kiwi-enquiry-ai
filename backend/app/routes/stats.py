from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth import require_admin
from app.database import get_db
from app.models import Enquiry, ALLOWED_CATEGORIES
from app.schemas import StatsResponse

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])


@router.get("", response_model=StatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: str = Depends(require_admin),
):
    """
    Computes key performance indicators (KPIs) and category distribution
    for the Kiwi Connect Digital admin dashboard.
    """
    total = db.query(Enquiry).count()
    new_count = db.query(Enquiry).filter(Enquiry.status == "New").count()
    in_progress = db.query(Enquiry).filter(Enquiry.status == "In Progress").count()
    converted = db.query(Enquiry).filter(Enquiry.status == "Converted").count()
    closed = db.query(Enquiry).filter(Enquiry.status == "Closed").count()
    ai_pending = db.query(Enquiry).filter(Enquiry.status == "AI Pending").count()
    high_priority = db.query(Enquiry).filter(Enquiry.priority == "High").count()

    # Calculate average lead score
    avg_score_res = db.query(func.avg(Enquiry.lead_score)).scalar()
    avg_score = round(float(avg_score_res), 1) if avg_score_res else 0.0

    # Category distribution
    cat_counts_raw = (
        db.query(Enquiry.category, func.count(Enquiry.id))
        .group_by(Enquiry.category)
        .all()
    )
    cat_map = {cat: 0 for cat in ALLOWED_CATEGORIES}
    for cat_name, count in cat_counts_raw:
        cat_map[cat_name] = count

    return StatsResponse(
        total=total,
        new=new_count,
        high_priority=high_priority,
        in_progress=in_progress,
        converted=converted,
        closed=closed,
        ai_pending=ai_pending,
        average_lead_score=avg_score,
        category_distribution=cat_map,
    )

