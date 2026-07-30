"""
FastAPI Backend for 7 Days to Calm
Generates ElevenLabs ConvAI signed URLs and logs completions
"""

import logging
import os
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("em-backend")

app = FastAPI(title="7 Days to Calm API")

# ---- CORS: exact origins only. Extra origins can be added via the
# CORS_ORIGINS env var (comma-separated), e.g. in render.yaml.
DEFAULT_ALLOW_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
    "https://7-days-to-calm.vercel.app",
    "https://7dtc.elevatedmovements.com",
    "https://7-days-to-calm.elevatedmovements.com",
    "https://elevatedmovements.com",
    "https://www.elevatedmovements.com",
]


def _allow_origins() -> list:
    origins = list(DEFAULT_ALLOW_ORIGINS)
    for origin in os.getenv("CORS_ORIGINS", "").split(","):
        cleaned = origin.strip().rstrip("/")
        if cleaned and cleaned not in origins:
            origins.append(cleaned)
    return origins


DEFAULT_AGENT_ID = "agent_4201k708pqxsed39y0vsz05gn66e"
REQUIRED_ENV_VARS = ["ELEVENLABS_API_KEY"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
)

missing_at_start = [env for env in REQUIRED_ENV_VARS if not os.getenv(env)]
if missing_at_start:
    logger.error("Startup missing required environment variables: %s", missing_at_start)
else:
    logger.info("All required environment variables present.")

def _require_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        logger.error("Missing required environment variable: %s", name)
        raise RuntimeError(f"Missing required environment variable: {name}")
    return v


def _get_agent_id() -> str:
    # AGENT_ID is the documented name; ELEVENLABS_AGENT_ID is accepted because
    # the Render blueprint historically used it.
    agent_id = os.getenv("AGENT_ID") or os.getenv("ELEVENLABS_AGENT_ID")
    if agent_id:
        return agent_id
    logger.warning(
        "AGENT_ID not set; falling back to default %s. Configure AGENT_ID for production.",
        DEFAULT_AGENT_ID,
    )
    return DEFAULT_AGENT_ID


def _signed_url(agent_id: str) -> str:
    """
    Fetch a signed URL from ElevenLabs. Day context reaches the agent through
    the widget's dynamic-variables attribute, not through this URL.
    """
    api_key = _require_env("ELEVENLABS_API_KEY")
    client = ElevenLabs(api_key=api_key)

    response = client.conversational_ai.conversations.get_signed_url(agent_id=agent_id)
    signed_url = getattr(response, "signed_url", None) or getattr(response, "url", None)
    if not signed_url and isinstance(response, dict):
        signed_url = response.get("signed_url") or response.get("url")

    if not signed_url:
        raise RuntimeError("Signed URL missing from ElevenLabs response")
    return signed_url

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "agent_configured": bool(os.getenv("AGENT_ID") or os.getenv("ELEVENLABS_AGENT_ID")),
        "api_key_configured": bool(os.getenv("ELEVENLABS_API_KEY")),
        "agent_in_use": _get_agent_id(),
        "missing_env": [env for env in REQUIRED_ENV_VARS if not os.getenv(env)],
    }

@app.get("/convai/signed-url")
async def get_signed_url(challenge_day: int = 1):
    """
    Return a signed URL for the web component: <elevenlabs-convai signed-url="...">
    Includes challenge_day context for the agent to reference
    """
    try:
        agent_id = _get_agent_id()
        signed_url = _signed_url(agent_id)
        return {"signed_url": signed_url, "challenge_day": int(challenge_day)}
    except Exception as exc:
        logger.exception("Failed to generate signed URL for challenge_day=%s", challenge_day)
        raise HTTPException(status_code=500, detail=f"Failed to generate signed URL: {exc}") from exc

@app.post("/tool/log-goal")
async def log_goal(day: int, completed: bool = True, authorization: Optional[str] = Header(None)):
    # Optional bearer check
    expected = os.getenv("TOOL_BEARER_TOKEN", "")
    if expected:
        token = (authorization or "").replace("Bearer ", "")
        if token != expected:
            raise HTTPException(status_code=401, detail="Invalid token")

    log_data = {"day": day, "completed": completed, "timestamp": datetime.utcnow().isoformat()}
    print("Goal logged:", log_data)
    return {"success": True, "message": f"Day {day} logged", "data": log_data}
