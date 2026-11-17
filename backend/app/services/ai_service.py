import os
import re
import json
import logging
from typing import List, Literal, Optional
from dotenv import load_dotenv, set_key
from pydantic import BaseModel, Field, ValidationError

from app.models import ALLOWED_CATEGORIES, ALLOWED_PRIORITIES
from app.services.prompts import SYSTEM_PROMPT, build_enquiry_analysis_prompt

# Path to .env file
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(ENV_PATH)

logger = logging.getLogger("kiwi_ai_service")
logging.basicConfig(level=logging.INFO)

CategoryLiteral = Literal[
    "Website Development",
    "Mobile Application Development",
    "AI Software Development",
    "Digital Marketing",
    "E-commerce Development",
    "Custom Software Development",
    "Other Services",
]

PriorityLiteral = Literal["Low", "Medium", "High"]


class AIAnalysisResult(BaseModel):
    """
    Strict Pydantic schema for the structured Gemini AI response.
    Enforces types and field completeness for every enquiry.
    """
    summary: str = Field(description="2-3 sentence executive summary of requirements")
    service_type: str = Field(description="Specific service requested, e.g. E-commerce Website")
    category: CategoryLiteral = Field(description="Must match exactly one of the 7 allowed categories")
    budget: str = Field(default="Not specified", description="Extracted budget or 'Not specified'")
    location: str = Field(default="Not specified", description="Extracted city/region or 'Not specified'")
    urgency: str = Field(default="Medium", description="Urgency level or timeline")
    priority: PriorityLiteral = Field(default="Medium", description="Assigned priority: Low, Medium, or High")
    priority_reason: str = Field(default="", description="One-line explanation for the priority assignment")
    requirements: List[str] = Field(default_factory=list, description="List of specific project requirements")
    missing_info: List[str] = Field(default_factory=list, description="Missing details needed from customer")
    suggested_response: str = Field(description="Professional customer email draft from Kiwi Connect Digital")
    next_steps: List[str] = Field(default_factory=list, description="Actionable next steps for client")
    follow_up_questions: List[str] = Field(default_factory=list, description="Questions to clarify missing info")
    lead_score: int = Field(default=50, ge=0, le=100, description="Lead readiness score 0 to 100")


def get_gemini_client():
    """
    Safely retrieves and initializes the Google GenAI client.
    Returns None if the API key is not configured.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY is not set or using placeholder in .env file.")
        return None

    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Google GenAI client: {e}")
        return None


def extract_location(text: str) -> str:
    """Extracts city/location from message text."""
    common_cities = [
        "Indore", "Bhopal", "Mumbai", "Delhi", "Bangalore", "Bengaluru", "Pune",
        "Hyderabad", "Jaipur", "Ahmedabad", "Kolkata", "Chennai", "Ujjain",
        "Gwalior", "Jabalpur", "Surat", "Lucknow", "Chandigarh", "Noida", "Gurugram"
    ]
    for city in common_cities:
        if re.search(r'\b' + re.escape(city) + r'\b', text, re.IGNORECASE):
            return city.capitalize()

    # Pattern: "in <City>", "at <City>", "from <City>"
    match = re.search(r'\b(?:in|at|from|based in|located in)\s+([A-Z][a-zA-Z]+)', text)
    if match:
        candidate = match.group(1).strip()
        if candidate.lower() not in ["need", "want", "our", "the", "an", "a", "this"]:
            return candidate

    return "Not specified"


def extract_budget(text: str) -> str:
    """Extracts budget with clean currency notation."""
    patterns = [
        # Rs 50,000 / Rs. 50000 / INR 50,000 / ₹50,000 / Rs 1.5 Lakh
        r'(?:Rs\.?|INR|₹|\$)\s*[\d,\.]+(?:\s*(?:k|thousand|lakh|lac|crore))?',
        # 1.5 Lakh / 50,000 Rs / 50000 INR / 50k
        r'[\d,\.]+\s*(?:Rs|INR|rupees|lakh|lac|crore|k)\b',
        # budget around 50000 / budget of 30,000 / budget 1.5 Lakh
        r'budget(?:\s+is|\s+of|\s+around)?\s*[:=-]?\s*(?:Rs\.?|₹|INR|\$)?\s*[\d,\.]+(?:\s*(?:k|thousand|lakh|crore))?',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            clean_b = m.group(0).strip()
            # Clean up leading prefix and trailing punctuation
            clean_b = re.sub(r'(?i)^budget(?:\s+is|\s+of|\s+around)?\s*[:=-]?\s*', '', clean_b).strip()
            clean_b = clean_b.rstrip('.,;:')
            if not any(c in clean_b for c in ['Rs', 'INR', '₹', '$']):
                clean_b = f"Rs {clean_b}"
            return clean_b

    return "Not specified"


def extract_urgency(text: str) -> str:
    """Determines urgency level from message text. Returns Low, Medium, or High."""
    lower = text.lower()
    if any(k in lower for k in ["urgent", "asap", "immediate", "immediately", "right away"]):
        return "High"
    if any(k in lower for k in ["1 week", "2 weeks", "this week", "within days", "1 month", "a month", "30 days"]):
        return "Medium"
    return "Low"


def classify_category(text: str) -> tuple[CategoryLiteral, str]:
    """
    Accurately classifies the service into exactly one of the 7 official categories.
    Returns (category, specific_service_type).
    """
    lower = text.lower()

    # 1. E-commerce Development
    # Only if the customer explicitly mentions selling online, an online store/shop, cart, orders, checkout, or online payments.
    # A plain request for a "website" for a shop/store/business with no mention of selling online is NOT e-commerce.
    ecommerce_keywords = [
        "e-commerce", "ecommerce", "online store", "online shop", "web store",
        "sell online", "selling online", "cart", "orders", "checkout",
        "online payment", "online payments", "payment gateway",
    ]
    if any(k in lower for k in ecommerce_keywords):
        return "E-commerce Development", "E-commerce Web Platform"

    # 2. AI Software Development
    if any(k in lower for k in ["ai", "artificial intelligence", "chatbot", "bot", "llm", "automation", "machine learning", "smart assistant"]):
        return "AI Software Development", "AI-Powered Workflow Solution"

    # 3. Mobile Application Development
    if any(k in lower for k in ["mobile app", "app development", "android", "ios", "flutter", "react native", "iphone app"]):
        return "Mobile Application Development", "Cross-Platform Mobile App"

    # 4. Digital Marketing
    if any(k in lower for k in ["seo", "digital marketing", "google ads", "social media", "ppc", "branding", "marketing campaign", "facebook ads", "instagram"]):
        return "Digital Marketing", "Search Engine & Growth Marketing"

    # 5. Website Development
    # Conservative category for plain website requests (shop/store/business site with no explicit online selling)
    if any(k in lower for k in ["website", "web site", "landing page", "corporate site", "wordpress", "portfolio website", "web portal", "shop", "store", "products"]):
        return "Website Development", "Custom Business Website"

    # 6. Custom Software Development
    if any(k in lower for k in ["software", "crm", "erp", "saas", "dashboard", "internal tool", "management system"]):
        return "Custom Software Development", "Enterprise Software Application"

    return "Other Services", "Consulting & Technical Services"


def create_intelligent_analysis(
    customer_name: str,
    message: str,
    reason: str = "Heuristic Analysis",
) -> AIAnalysisResult:
    """
    Intelligent NLP extraction engine: extracts budget, location, urgency,
    category, project scope, and generates tailored response.
    Guarantees the system accurately understands client needs even without API quota.
    """
    category, service_type = classify_category(message)
    budget = extract_budget(message)
    location = extract_location(message)
    urgency = extract_urgency(message)

    # Determine Priority (Priority Rules)
    # High: deadline/time pressure, OR budget >= Rs 1,50,000 with clear requirement
    # Medium: clear service request with stated budget or clear scope, but no time pressure
    # Low: vague/incomplete enquiries, no clear service/budget/timeline, or general info request
    is_urgent = urgency == "High"
    has_budget = budget != "Not specified"

    # Extract budget numeric value for Rs 1,50,000+ check
    budget_amount = 0
    if has_budget:
        import re as _re
        budget_digits = _re.sub(r"[^\d]", "", budget)
        if budget_digits:
            budget_amount = int(budget_digits)

    # Check for time pressure keywords in message
    lower_msg = message.lower()
    time_pressure = any(k in lower_msg for k in [
        "urgent", "asap", "by next week", "this month", "within days",
        "immediately", "right away", "fast", "quickly", "soon",
    ])

    # Check for clear requirement (specific service mentioned)
    clear_service = category not in ["Other Services", "Website Development"] or len(message) > 80

    if (is_urgent or time_pressure) or (budget_amount >= 150000 and clear_service):
        priority = "High"
        if budget_amount >= 150000:
            priority_reason = f"Budget of {budget} with clear requirement"
        else:
            priority_reason = "Customer shows deadline or time pressure"
    elif has_budget or clear_service:
        priority = "Medium"
        if has_budget and clear_service:
            priority_reason = "Clear service request with stated budget, no time pressure"
        elif has_budget:
            priority_reason = "Stated budget provided, but scope needs clarification"
        else:
            priority_reason = "Clear service scope identified, but no budget stated"
    else:
        priority = "Low"
        priority_reason = "Vague or incomplete enquiry with no clear service, budget, or timeline"

    # Compute Lead Score (0 to 100)
    score = 50
    if budget != "Not specified":
        score += 25
    if location != "Not specified":
        score += 15
    if len(message) > 80:
        score += 10
    score = min(score, 95)

    # Extract requirements
    requirements = []
    lower = message.lower()
    if "browse" in lower or "catalog" in lower or "products" in lower:
        requirements.append("Interactive product catalog and browsing")
    if "order" in lower:
        requirements.append("Order placement and checkout management")
    if "payment" in lower or "online payment" in lower:
        requirements.append("Secure online payment gateway integration")
    if "mobile" in lower or "responsive" in lower:
        requirements.append("Mobile-responsive design for smartphone users")
    if not requirements:
        requirements.append(f"Development of {service_type}")
        requirements.append("Requirements discovery and architecture definition")

    # Missing information
    missing_info = []
    if "timeline" not in lower and "month" not in lower and "week" not in lower:
        missing_info.append("Target project launch timeline")
    if "payment" in lower and not any(gw in lower for gw in ["razorpay", "paytm", "stripe", "phonepe"]):
        missing_info.append("Preferred payment gateway (e.g. Razorpay, Paytm, PhonePe)")
    if "product" in lower and not any(char.isdigit() for char in lower):
        missing_info.append("Estimated number of products to be listed")
    if budget == "Not specified":
        missing_info.append("Estimated budget range")
    if not missing_info:
        missing_info.append("Hosting and domain preferences")

    # When category depends on info the customer did not give (e.g., "website for a shop"
    # could be Website Development or E-commerce Development), choose the conservative
    # category (Website Development) and add the clarifying question to missing_info
    # and follow_up_questions.
    if category == "Website Development" and any(k in message.lower() for k in ["shop", "store", "business", "website", "products"]):
        missing_info.append("Do you want to sell products online through the website?")

    # Tailored customer response
    loc_phrase = f" in {location}" if location != "Not specified" else ""
    bud_phrase = f" within your indicated budget of {budget}" if budget != "Not specified" else ""

    suggested_response = (
        f"Dear {customer_name},\n\n"
        f"Thank you for contacting Kiwi Connect Digital! We would be delighted to assist you with your "
        f"{service_type}{loc_phrase}.\n\n"
        f"We understand your vision to build a robust solution{bud_phrase}. Our team specializes in end-to-end "
        f"{category.lower()}—including seamless customer experiences, secure payment gateways, and scalable architectures.\n\n"
        f"To help us prepare a customized proposal and technical roadmap for you, could you please confirm:\n"
        + "".join([f"• {q}\n" for q in missing_info[:3]]) +
        f"\nWe look forward to partnering with you to bring this project to life.\n\n"
        f"Best regards,\n"
        f"Solutions Architecture Team\n"
        f"Kiwi Connect Digital"
    )

    return AIAnalysisResult(
        summary=(
            f"The client ({customer_name}){loc_phrase} requires a {service_type.lower()}. "
            f"Key focus includes: {', '.join(requirements[:2])}. "
            f"Budget noted as {budget} with {urgency.lower()} urgency."
        ),
        service_type=service_type,
        category=category,
        budget=budget,
        location=location,
        urgency=urgency,
        priority=priority,
        requirements=requirements,
        missing_info=missing_info,
        suggested_response=suggested_response,
        next_steps=[
            "Schedule technical discovery session",
            "Finalize product requirements document (PRD)",
            "Deliver milestone estimate and commercial proposal",
        ],
        follow_up_questions=[f"What is your preference regarding {item.lower()}?" for item in missing_info],
        lead_score=score,
        priority_reason=priority_reason,
    )


def analyze_enquiry_with_gemini(
    customer_name: str,
    phone_number: str,
    email: str,
    message: str,
    max_retries: int = 1,
) -> tuple[AIAnalysisResult, str, str, Optional[str]]:
    """
    Orchestrates the AI analysis:
    1. If a valid Gemini API key is configured, calls Google Gemini with strict JSON mode.
    2. If no API key is present or Gemini errors, uses our intelligent rule engine so the
       application accurately extracts parameters without failing.
    Returns (analysis, status, engine_name, error_info).
    """
    client = get_gemini_client()
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

    # If no Gemini API key is configured, use our intelligent extraction engine
    if not client:
        logger.info("Using intelligent extraction engine (Gemini API key not configured).")
        analysis = create_intelligent_analysis(customer_name, message, "Heuristic Engine")
        return analysis, "New", "rules-fallback", None

    from google.genai import types

    user_prompt = build_enquiry_analysis_prompt(
        customer_name=customer_name,
        phone_number=phone_number,
        email=email,
        message=message,
    )

    last_error: Optional[str] = None

    for attempt in range(max_retries + 1):
        try:
            logger.info(f"Calling Gemini API (model: {model_name}, attempt: {attempt + 1})...")

            config = types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=AIAnalysisResult,
                temperature=0.2,
            )

            response = client.models.generate_content(
                model=model_name,
                contents=user_prompt,
                config=config,
            )

            raw_text = response.text.strip()
            data = json.loads(raw_text)

            analysis = AIAnalysisResult.model_validate(data)

            if analysis.category not in ALLOWED_CATEGORIES:
                raise ValueError(f"Category '{analysis.category}' not in allowed list.")

            logger.info(f"Engine used: {model_name}. Analysis succeeded.")
            return analysis, "New", model_name, None

        except Exception as err:
            err_type = type(err).__name__
            last_error = f"{err_type}: {err}"
            logger.warning(f"Gemini API error on attempt {attempt + 1}: {last_error}")
            if attempt < max_retries:
                continue

    logger.info(f"Engine used: rules-fallback (Gemini failed: {last_error}). Falling back to heuristic engine.")
    analysis = create_intelligent_analysis(customer_name, message, str(last_error) if last_error else "Fallback")
    return analysis, "AI Pending", "rules-fallback", last_error
