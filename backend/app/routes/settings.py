import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from dotenv import set_key, load_dotenv

from app.auth import require_admin

router = APIRouter(prefix="/settings", tags=["Settings"])

ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")


class ApiKeyPayload(BaseModel):
    api_key: str = Field(..., min_length=10)


@router.get("")
def get_settings(current_admin: str = Depends(require_admin)):
    """Returns AI engine status and whether a Gemini API key is active."""
    key = os.getenv("GEMINI_API_KEY", "").strip()
    has_key = bool(key and key != "your_gemini_api_key_here")
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    engine_label = f"Google Gemini ({model})" if has_key else "Intelligent NLP Engine (Heuristic)"
    return {
        "has_gemini_key": has_key,
        "engine": engine_label,
        "model": model,
    }


@router.post("/api-key")
def update_api_key(
    payload: ApiKeyPayload,
    current_admin: str = Depends(require_admin),
):
    """
    Allows user or admin to configure their Google Gemini API key directly from the UI.
    Saves to .env and updates runtime environment.
    """
    clean_key = payload.api_key.strip()
    if not clean_key.startswith("AIza"):
        # Google Gemini API keys almost always start with AIza
        pass

    try:
        set_key(ENV_PATH, "GEMINI_API_KEY", clean_key)
        os.environ["GEMINI_API_KEY"] = clean_key
        load_dotenv(ENV_PATH, override=True)
        return {
            "status": "success",
            "message": "Gemini API Key saved and activated successfully!",
            "has_gemini_key": True,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update API key: {e}")
