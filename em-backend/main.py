"""
FastAPI Backend for 7 Days to Calm
Generates ElevenLabs ConvAI signed URLs and logs completions
"""

import os
from datetime import datetime
from typing import Optional

from elevenlabs.client import ElevenLabs
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="7 Days to Calm API")

# ---- CORS: exact origins only
ALLOW_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://7-days-to-calm.vercel.app",
    "https://elevatedmovements.com",
    "https://www.elevatedmovements.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
)

def _require_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return v


def _signed_url(agent_id: str, challenge_day: int = 1) -> str:
    api_key = _require_env("ELEVENLABS_API_KEY")
    client = ElevenLabs(api_key=api_key)
    # Pass challenge day as custom data to the agent
    response = client.conversational_ai.agents.create_signed_url(
        agent_id=agent_id,
        custom_llm_extra_body={"challenge_day": challenge_day}
    )
    if isinstance(response, dict):
        return response.get("signed_url") or response.get("url")  # defensive fallback
    return getattr(response, "signed_url", None) or getattr(response, "url")

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "agent_configured": bool(os.getenv("AGENT_ID")),
        "api_key_configured": bool(os.getenv("ELEVENLABS_API_KEY")),
    }

@app.get("/convai/signed-url")
async def get_signed_url(challenge_day: int = 1):
    """
    Return a signed URL for the web component: <elevenlabs-convai signed-url="...">
    Includes challenge_day context for the agent to reference
    """
    try:
        agent_id = _require_env("AGENT_ID")
        signed_url = _signed_url(agent_id, challenge_day)
        if not signed_url:
            raise RuntimeError("Signed URL missing from ElevenLabs response")
        return {"signed_url": signed_url, "challenge_day": int(challenge_day)}
    except Exception as exc:
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
