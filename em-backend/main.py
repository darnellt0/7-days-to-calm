"""
FastAPI Backend for 7 Days to Calm
Generates ElevenLabs ConvAI signed URLs and logs completions
"""

import json
import logging
import os
from datetime import datetime
from typing import Optional
from urllib.parse import quote

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("em-backend")

app = FastAPI(title="7 Days to Calm API")

# ---- CORS: exact origins only
ALLOW_ORIGINS = [
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

DEFAULT_AGENT_ID = "agent_4201k708pqxsed39y0vsz05gn66e"
REQUIRED_ENV_VARS = ["ELEVENLABS_API_KEY"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
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
    agent_id = os.getenv("AGENT_ID")
    if agent_id:
        return agent_id
    logger.warning(
        "AGENT_ID not set; falling back to default %s. Configure AGENT_ID for production.",
        DEFAULT_AGENT_ID,
    )
    return DEFAULT_AGENT_ID


def _signed_url(agent_id: str, challenge_day: int = 1) -> str:
    """
    Fetch a signed URL from ElevenLabs, passing the current challenge day when possible.
    Falls back to the conversation endpoint if the agent API is unavailable.
    """
    api_key = _require_env("ELEVENLABS_API_KEY")
    client = ElevenLabs(api_key=api_key)

    # Preferred path: agent widget API that accepts custom data.
    try:
        httpx_client = client._client_wrapper.httpx_client  # type: ignore[attr-defined]
        response = httpx_client.request(
            f"v1/convai/agents/{agent_id}/signed-url",
            method="POST",
            json={"custom_llm_extra_body": {"challenge_day": challenge_day}},
            headers={
                "content-type": "application/json",
            },
        )
        response.raise_for_status()
        payload = response.json()
        signed_url = payload.get("signed_url") or payload.get("url")
        if signed_url:
            return signed_url
        raise RuntimeError("Missing signed_url in agent response")
    except Exception as exc:
        logger.warning("Primary signed-url request failed, attempting fallback: %s", exc)

    # Fallback: conversation endpoint (no extra body support). Append contextual hint.
    response = client.conversational_ai.conversations.get_signed_url(agent_id=agent_id)
    signed_url = getattr(response, "signed_url", None) or getattr(response, "url", None)
    if not signed_url and isinstance(response, dict):
        signed_url = response.get("signed_url") or response.get("url")

    if not signed_url:
        raise RuntimeError("Signed URL missing from ElevenLabs response")

    fallback_context = quote(json.dumps({"challenge_day": challenge_day}))
    separator = "&" if "?" in signed_url else "?"
    return f"{signed_url}{separator}custom_llm_extra_body={fallback_context}"

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "agent_configured": bool(os.getenv("AGENT_ID")),
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
        signed_url = _signed_url(agent_id, challenge_day)
        if not signed_url:
            raise RuntimeError("Signed URL missing from ElevenLabs response")
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
