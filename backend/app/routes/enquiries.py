import io
import csv
import difflib
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.auth import require_admin
from app.database import get_db
from app.models import Enquiry, ALLOWED_CATEGORIES, ALLOWED_PRIORITIES, ALLOWED_STATUSES
from app.schemas import (
    EnquiryCreate,
    EnquiryResponse,
    EnquiryStatusUpdate,
    EnquiryResponseUpdate,
)
from app.services.ai_service import analyze_enquiry_with_gemini

router = APIRouter(prefix="/enquiries", tags=["Enquiries"])


# ----------------------------------------------------
# 1. CREATE ENQUIRY (Full 9-Step AI Workflow)
# ----------------------------------------------------
@router.post("")
def create_enquiry(enquiry_in: EnquiryCreate, db: Session = Depends(get_db)):
    """
    Executes the full 9-step workflow required by Kiwi Connect Digital:
    Step 1: Customer submits enquiry (Form input received).
    Step 2: Backend receives and validates payload.
    Step 3: Duplicate detection check (before AI).
    Step 4: AI analyzes the customer's message via Gemini (only if not a near-identical recent duplicate).
    Step 5: AI extracts structured requirements, budget, location, urgency.
    Step 6: System categorizes into one of 7 official categories.
    Step 7: AI assigns priority level (Low, Medium, High).
    Step 8: AI generates suggested customer reply and next steps.
    Step 9: Enquiry and complete AI analysis are committed to SQLite.

    Public endpoint for customer form submission. Returns minimal response.
    """
    # Bonus Feature: Duplicate enquiry detection (BEFORE AI call)
    existing_enquiry = (
        db.query(Enquiry)
        .filter(
            or_(
                Enquiry.email.ilike(enquiry_in.email.strip()),
                Enquiry.phone_number == enquiry_in.phone_number.strip(),
            )
        )
        .order_by(desc(Enquiry.id))
        .first()
    )

    now = datetime.utcnow()

    if existing_enquiry:
        # Case (a): same contact, nearly identical message, within 24 hours → increment count, no AI, no new row
        existing_created = existing_enquiry.created_at or now

        message_similarity = difflib.SequenceMatcher(
            None, existing_enquiry.message, enquiry_in.message
        ).ratio()

        within_24h = (now - existing_created) < timedelta(hours=24)

        if message_similarity >= 0.9 and within_24h:
            existing_enquiry.duplicate_count = (existing_enquiry.duplicate_count or 1) + 1
            existing_enquiry.updated_at = now
            db.commit()
            db.refresh(existing_enquiry)

            response_data = EnquiryResponse.model_validate(existing_enquiry)
            response_data.is_duplicate = bool(existing_enquiry.is_duplicate)
            response_data.duplicate_count = existing_enquiry.duplicate_count
            return response_data

        # Case (b): same contact but different message → create new enquiry linked as duplicate
        duplicate_of_id = existing_enquiry.id

    else:
        duplicate_of_id = None

    # Execute AI Analysis with Gemini (only reached when creating a new enquiry)
    ai_analysis, initial_status, engine_name, engine_error = analyze_enquiry_with_gemini(
        customer_name=enquiry_in.customer_name,
        phone_number=enquiry_in.phone_number,
        email=enquiry_in.email,
        message=enquiry_in.message,
    )

    # Persist in SQLite
    new_enquiry = Enquiry(
        customer_name=enquiry_in.customer_name.strip(),
        phone_number=enquiry_in.phone_number.strip(),
        email=enquiry_in.email.strip().lower(),
        message=enquiry_in.message.strip(),
        status=initial_status,
        category=ai_analysis.category,
        priority=ai_analysis.priority,
        summary=ai_analysis.summary,
        service_type=ai_analysis.service_type,
        budget=ai_analysis.budget,
        location=ai_analysis.location,
        urgency=ai_analysis.urgency,
        requirements=ai_analysis.requirements,
        missing_info=ai_analysis.missing_info,
        suggested_response=ai_analysis.suggested_response,
        next_steps=ai_analysis.next_steps,
        follow_up_questions=ai_analysis.follow_up_questions,
        lead_score=ai_analysis.lead_score,
        priority_reason=ai_analysis.priority_reason,
        is_duplicate=1 if duplicate_of_id is not None else 0,
        duplicate_of_id=duplicate_of_id,
        duplicate_count=1,
        ai_engine=engine_name,
        ai_error=engine_error,
        created_at=now,
        updated_at=now,
    )

    db.add(new_enquiry)
    db.commit()
    db.refresh(new_enquiry)

    # Convert is_duplicate to boolean for response model
    response_data = EnquiryResponse.model_validate(new_enquiry)
    response_data.is_duplicate = bool(new_enquiry.is_duplicate)
    response_data.duplicate_count = new_enquiry.duplicate_count
    response_data.ai_engine = new_enquiry.ai_engine
    response_data.ai_error = new_enquiry.ai_error
    response_data.priority_reason = new_enquiry.priority_reason
    return {"status": "received"}


# ----------------------------------------------------
# 2. LIST ENQUIRIES (Search, Filter, Pagination)
# ----------------------------------------------------
@router.get("", response_model=List[EnquiryResponse])
def get_enquiries(
    q: Optional[str] = Query(None, description="Search term for name, email, phone, or message"),
    status: Optional[str] = Query(None, description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: str = Depends(require_admin),
):
    """
    Retrieves previous enquiries with flexible search and filtering.
    """
    query = db.query(Enquiry)

    # Search filter
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Enquiry.customer_name.ilike(term),
                Enquiry.email.ilike(term),
                Enquiry.phone_number.ilike(term),
                Enquiry.message.ilike(term),
                Enquiry.summary.ilike(term),
                Enquiry.service_type.ilike(term),
                Enquiry.location.ilike(term),
            )
        )

    # Category filter
    if category and category.strip():
        query = query.filter(Enquiry.category == category.strip())

    # Status filter
    if status and status.strip():
        query = query.filter(Enquiry.status == status.strip())

    # Priority filter
    if priority and priority.strip():
        query = query.filter(Enquiry.priority == priority.strip())

    records = query.order_by(desc(Enquiry.created_at)).offset(skip).limit(limit).all()

    # Format response
    results = []
    for r in records:
        item = EnquiryResponse.model_validate(r)
        item.is_duplicate = bool(r.is_duplicate)
        item.duplicate_count = r.duplicate_count or 1
        item.ai_engine = r.ai_engine
        item.ai_error = r.ai_error
        item.priority_reason = r.priority_reason
        results.append(item)

    return results


# ----------------------------------------------------
# 3. CSV EXPORT (Bonus Feature)
# ----------------------------------------------------
@router.get("/export/csv")
def export_enquiries_csv(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: str = Depends(require_admin),
):
    """
    Exports enquiries to a downloadable CSV file.
    """
    query = db.query(Enquiry)
    if status:
        query = query.filter(Enquiry.status == status)
    if category:
        query = query.filter(Enquiry.category == category)
    if priority:
        query = query.filter(Enquiry.priority == priority)

    enquiries = query.order_by(desc(Enquiry.created_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # CSV Header
    writer.writerow([
        "ID",
        "Submitted (IST)",
        "Customer Name",
        "Email",
        "Phone",
        "Category",
        "Priority",
        "Status",
        "Lead Score",
        "Budget",
        "Location",
        "Summary",
        "Original Message",
    ])

    ist_offset = timedelta(hours=5, minutes=30)

    for e in enquiries:
        created_utc = e.created_at
        if created_utc:
            # Treat stored datetime as UTC, convert to IST (UTC+5:30)
            created_ist = created_utc.replace(tzinfo=timezone.utc) + ist_offset
            created_str = created_ist.strftime("%Y-%m-%d %H:%M:%S IST")
        else:
            created_str = ""
        writer.writerow([
            e.id,
            created_str,
            e.customer_name,
            e.email,
            e.phone_number,
            e.category,
            e.priority,
            e.status,
            e.lead_score,
            e.budget or "",
            e.location or "",
            e.summary or "",
            e.message,
        ])

    output.seek(0)
    filename = f"kiwi_enquiries_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ----------------------------------------------------
# 4. DELETE ENQUIRY
# ----------------------------------------------------
@router.delete("/{enquiry_id}")
def delete_enquiry(enquiry_id: int, db: Session = Depends(get_db), current_admin: str = Depends(require_admin)):
    """
    Deletes an enquiry by ID. Returns 404 if not found.
    """
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail=f"Enquiry with ID {enquiry_id} not found.")

    db.delete(enquiry)
    db.commit()
    return {"deleted": enquiry_id}


# ----------------------------------------------------
# 5. GET SINGLE ENQUIRY DETAILS
# ----------------------------------------------------
@router.get("/{enquiry_id}", response_model=EnquiryResponse)
def get_enquiry_by_id(enquiry_id: int, db: Session = Depends(get_db), current_admin: str = Depends(require_admin)):
    """
    Retrieves full details of a specific enquiry including AI analysis and responses.
    """
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail=f"Enquiry with ID {enquiry_id} not found.")

    res = EnquiryResponse.model_validate(enquiry)
    res.is_duplicate = bool(enquiry.is_duplicate)
    res.duplicate_count = enquiry.duplicate_count or 1
    res.ai_engine = enquiry.ai_engine
    res.ai_error = enquiry.ai_error
    res.priority_reason = enquiry.priority_reason
    return res


# ----------------------------------------------------
# 6. UPDATE STATUS (Admin workflow)
# ----------------------------------------------------
@router.patch("/{enquiry_id}/status", response_model=EnquiryResponse)
def update_enquiry_status(
    enquiry_id: int,
    payload: EnquiryStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: str = Depends(require_admin),
):
    """
    Updates the status of an enquiry (New, In Progress, Converted, Closed).
    """
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(ALLOWED_STATUSES)}",
        )

    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail=f"Enquiry with ID {enquiry_id} not found.")

    enquiry.status = payload.status
    enquiry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(enquiry)

    res = EnquiryResponse.model_validate(enquiry)
    res.is_duplicate = bool(enquiry.is_duplicate)
    res.duplicate_count = enquiry.duplicate_count or 1
    res.ai_engine = enquiry.ai_engine
    res.ai_error = enquiry.ai_error
    res.priority_reason = enquiry.priority_reason
    return res


# ----------------------------------------------------
# 7. EDIT CUSTOMER RESPONSE (Admin workflow)
# ----------------------------------------------------
@router.patch("/{enquiry_id}/response", response_model=EnquiryResponse)
def update_customer_response(
    enquiry_id: int,
    payload: EnquiryResponseUpdate,
    db: Session = Depends(get_db),
    current_admin: str = Depends(require_admin),
):
    """
    Allows the admin to review and edit the suggested customer response.
    """
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail=f"Enquiry with ID {enquiry_id} not found.")

    enquiry.edited_response = payload.edited_response
    enquiry.updated_at = datetime.utcnow()

    # Automatic status transition: New → In Progress when admin saves a response
    if enquiry.status == "New":
        enquiry.status = "In Progress"

    db.commit()
    db.refresh(enquiry)

    res = EnquiryResponse.model_validate(enquiry)
    res.is_duplicate = bool(enquiry.is_duplicate)
    res.duplicate_count = enquiry.duplicate_count or 1
    res.ai_engine = enquiry.ai_engine
    res.ai_error = enquiry.ai_error
    res.priority_reason = enquiry.priority_reason
    return res


# ----------------------------------------------------
# 7. RE-ANALYZE ENQUIRY WITH AI (Bonus Utility)
# ----------------------------------------------------
@router.post("/{enquiry_id}/reanalyze", response_model=EnquiryResponse)
def reanalyze_enquiry(enquiry_id: int, db: Session = Depends(get_db), current_admin: str = Depends(require_admin)):
    """
    Re-runs AI analysis on an enquiry (useful if previously saved in 'AI Pending' state).
    """
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail=f"Enquiry with ID {enquiry_id} not found.")

    ai_analysis, new_status, engine_name, engine_error = analyze_enquiry_with_gemini(
        customer_name=enquiry.customer_name,
        phone_number=enquiry.phone_number,
        email=enquiry.email,
        message=enquiry.message,
    )

    enquiry.category = ai_analysis.category
    enquiry.priority = ai_analysis.priority
    enquiry.summary = ai_analysis.summary
    enquiry.service_type = ai_analysis.service_type
    enquiry.budget = ai_analysis.budget
    enquiry.location = ai_analysis.location
    enquiry.urgency = ai_analysis.urgency
    enquiry.requirements = ai_analysis.requirements
    enquiry.missing_info = ai_analysis.missing_info
    enquiry.suggested_response = ai_analysis.suggested_response
    enquiry.next_steps = ai_analysis.next_steps
    enquiry.follow_up_questions = ai_analysis.follow_up_questions
    enquiry.lead_score = ai_analysis.lead_score
    enquiry.ai_engine = engine_name
    enquiry.ai_error = engine_error
    if enquiry.status == "AI Pending" and new_status == "New":
        enquiry.status = "New"
    enquiry.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(enquiry)

    res = EnquiryResponse.model_validate(enquiry)
    res.is_duplicate = bool(enquiry.is_duplicate)
    res.duplicate_count = enquiry.duplicate_count or 1
    res.ai_engine = enquiry.ai_engine
    res.ai_error = enquiry.ai_error
    res.priority_reason = enquiry.priority_reason
    return res

