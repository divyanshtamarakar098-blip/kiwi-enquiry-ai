from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from app.database import Base

# Allowed categories strictly as defined in the assignment requirements
ALLOWED_CATEGORIES = [
    "Website Development",
    "Mobile Application Development",
    "AI Software Development",
    "Digital Marketing",
    "E-commerce Development",
    "Custom Software Development",
    "Other Services",
]

# Allowed priorities and statuses
ALLOWED_PRIORITIES = ["Low", "Medium", "High"]
ALLOWED_STATUSES = ["New", "In Progress", "Converted", "Closed", "AI Pending"]


class Enquiry(Base):
    """
    SQLAlchemy ORM model representing a customer enquiry and its AI-generated analysis.
    Stores the full lifecycle from raw submission to AI categorization and admin edits.
    """
    __tablename__ = "enquiries"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Section A: Enquiry Input System (submitted by customer/admin)
    customer_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(120), nullable=False, index=True)
    message = Column(Text, nullable=False)

    # Section F & C: Status, Categorization & Priority
    status = Column(String(30), default="New", nullable=False, index=True)
    category = Column(String(50), default="Other Services", nullable=False, index=True)
    priority = Column(String(20), default="Medium", nullable=False, index=True)

    # Section B: AI-Powered Analysis
    summary = Column(Text, nullable=True)
    service_type = Column(String(100), nullable=True)
    budget = Column(String(50), nullable=True)
    location = Column(String(100), nullable=True)
    urgency = Column(String(50), nullable=True)
    requirements = Column(JSON, default=list)        # List of important project requirements
    missing_info = Column(JSON, default=list)        # List of missing project information

    # Section D: AI-Generated Customer Response
    suggested_response = Column(Text, nullable=True)
    next_steps = Column(JSON, default=list)          # List of suggested next steps
    follow_up_questions = Column(JSON, default=list) # Follow-up questions for missing info
    edited_response = Column(Text, nullable=True)    # Stores admin's customized reply

    # Bonus: AI Lead Scoring (0 to 100)
    lead_score = Column(Integer, default=50)

    # Bonus: Duplicate Enquiry Detection
    is_duplicate = Column(Integer, default=0) # 0 = false, 1 = true
    duplicate_of_id = Column(Integer, nullable=True)
    duplicate_count = Column(Integer, default=1) # Number of times this contact has enquired

    # AI engine used to analyze this enquiry
    ai_engine = Column(String(100), nullable=True)

    # Error message if Gemini analysis failed (fallback used)
    ai_error = Column(Text, nullable=True)

    # One-line explanation for priority assignment
    priority_reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

