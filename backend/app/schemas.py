from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr, Field


# ----------------------------------------------------
# Request Schemas
# ----------------------------------------------------
class EnquiryCreate(BaseModel):
    """Schema for incoming customer enquiry submission."""
    customer_name: str = Field(..., min_length=2, max_length=100, example="Rajesh Sharma")
    phone_number: str = Field(..., min_length=7, max_length=20, example="+91 98765 43210")
    email: EmailStr = Field(..., example="rajesh@indoreclothing.com")
    message: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        example="I own a clothing store in Indore. I need an e-commerce website where customers can browse products, place orders and make online payments. My budget is around Rs 50,000.",
    )


class EnquiryStatusUpdate(BaseModel):
    """Schema for admin updating the enquiry status."""
    status: str = Field(..., example="In Progress")


class EnquiryResponseUpdate(BaseModel):
    """Schema for admin editing the AI-generated customer response."""
    edited_response: str = Field(..., min_length=5)


# ----------------------------------------------------
# Response Schemas
# ----------------------------------------------------
class EnquiryResponse(BaseModel):
    """Full enquiry schema returned to the frontend."""
    id: int
    customer_name: str
    phone_number: str
    email: str
    message: str

    status: str
    category: str
    priority: str

    summary: Optional[str] = None
    service_type: Optional[str] = None
    budget: Optional[str] = None
    location: Optional[str] = None
    urgency: Optional[str] = None
    requirements: List[str] = []
    missing_info: List[str] = []

    suggested_response: Optional[str] = None
    next_steps: List[str] = []
    follow_up_questions: List[str] = []
    edited_response: Optional[str] = None

    lead_score: int
    is_duplicate: bool = False
    duplicate_of_id: Optional[int] = None
    duplicate_count: int = 1
    ai_engine: Optional[str] = None
    ai_error: Optional[str] = None
    priority_reason: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    """Schema for admin dashboard summary metrics."""
    total: int
    new: int
    high_priority: int
    in_progress: int
    converted: int
    closed: int
    ai_pending: int
    average_lead_score: float
    category_distribution: Dict[str, int]

