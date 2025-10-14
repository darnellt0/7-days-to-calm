"""
FastAPI Backend for 7 Days to Calm
Handles ElevenLabs ConvAI integration and meditation tracking
"""

# Updated CORS config for Vercel frontend - 2025-10-14T00:00:00Z

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import jwt
import os
from datetime import datetime, timedelta
from typing import Optional

app = FastAPI(title="7 Days to Calm API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:3000",
        "http://localhost:3001",
        "https://www.elevatedmovements.com",
        "https://elevatedmovements.com",
        "https://7-days-to-calm.vercel.app",
        "https://www.7-days-to-calm.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "f6b8a3229da9c68e87305f9f58abc36c7e707e6e1386ee03427b88c0886ff4a2")
AGENT_ID = os.getenv("AGENT_ID", "agent_4201k708pqxsed39y0vsz05gn66e")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this")

@app.get("/")
async def root():
    return {"message": "7 Days to Calm API", "status": "running"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "agent_configured": bool(AGENT_ID),
        "api_key_configured": bool(ELEVENLABS_API_KEY)
    }

@app.get("/convai/signed-url")
async def get_signed_url(challenge_day: int = 1):
    """
    Generate a signed URL for ElevenLabs ConvAI widget
    Includes challenge_day as a dynamic variable
    """
    try:
        # Create JWT payload
        payload = {
            "agent_id": AGENT_ID,
            "challenge_day": challenge_day,
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow()
        }
        
        # Sign the token
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        
        # Construct signed URL
        signed_url = f"https://api.elevenlabs.io/v1/convai/conversation?agent_id={AGENT_ID}&signed_url={token}"
        
        return {
            "signed_url": signed_url,
            "challenge_day": challenge_day,
            "expires_in": 86400  # 24 hours
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate signed URL: {str(e)}")

@app.post("/tool/log-goal")
async def log_goal(
    day: int,
    completed: bool = True,
    authorization: Optional[str] = Header(None)
):
    """
    Log meditation completion
    Can be called by ElevenLabs agent or frontend
    """
    try:
        # Verify bearer token if provided
        if authorization:
            token = authorization.replace("Bearer ", "")
            expected_token = os.getenv("TOOL_BEARER_TOKEN", "")
            if token != expected_token:
                raise HTTPException(status_code=401, detail="Invalid token")
        
        # Log the completion (extend this to write to Sheets/Notion)
        log_data = {
            "day": day,
            "completed": completed,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        print(f"Goal logged: {log_data}")
        
        return {
            "success": True,
            "message": f"Day {day} logged successfully",
            "data": log_data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log goal: {str(e)}")

@app.post("/tts/closing")
async def generate_closing_tts(day: int):
    """
    Generate TTS audio for day completion closing message
    """
    try:
        closing_messages = {
            1: "Beautiful work today. You showed up, you breathed, you arrived. Day 1 complete.",
            2: "Wonderful. You're learning to downshift with your breath. Day 2 complete.",
            3: "Excellent. You scanned through your body with awareness. Day 3 complete.",
            4: "Well done. You practiced noticing thoughts without getting caught. Day 4 complete.",
            5: "Fantastic. You found steadiness with box breathing. Day 5 complete.",
            6: "Beautiful. You opened your awareness to the present moment. Day 6 complete.",
            7: "Amazing work. Seven days of practice complete. You've built a foundation for calm."
        }
        
        message = closing_messages.get(day, f"Day {day} complete. Well done.")
        
        # TODO: Integrate with ElevenLabs TTS API
        # For now, return the message text
        
        return {
            "success": True,
            "day": day,
            "message": message,
            "audio_url": None  # TODO: Generate actual audio
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate TTS: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8787)
