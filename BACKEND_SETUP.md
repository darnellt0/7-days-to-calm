# Backend Setup - Complete ✅

## What Was Done

### 1. Fixed .env Loading
- Added `load_dotenv()` to main.py
- Backend now loads environment variables from `.env` file
- ELEVENLABS_API_KEY and AGENT_ID are now accessible

### 2. Expanded CORS Allowed Origins
Added to CORS whitelist:
- `http://localhost:3003` - Local frontend dev
- `https://7dtc.elevatedmovements.com` - Production domain
- `https://7-days-to-calm.elevatedmovements.com` - Alternative domain

### 3. Started Backend Server
```
FastAPI running on: http://127.0.0.1:8787
Status: ✅ Healthy
Environment variables: ✅ All loaded
Agent configured: ✅ agent_4201k708pqxsed39y0vsz05gn66e
```

---

## Endpoints Available

### 1. Health Check
```
GET http://127.0.0.1:8787/health
```
Returns:
```json
{
    "status": "healthy",
    "agent_configured": true,
    "api_key_configured": true,
    "agent_in_use": "agent_4201k708pqxsed39y0vsz05gn66e"
}
```

### 2. Generate Signed URL (Used by Widget)
```
GET http://127.0.0.1:8787/convai/signed-url?challenge_day=1
```
Returns:
```json
{
    "signed_url": "wss://api.elevenlabs.io/v1/convai/conversation?...",
    "challenge_day": 1
}
```

The frontend automatically calls this when the widget loads.

### 3. Log Goal (Optional)
```
POST http://127.0.0.1:8787/tool/log-goal
Body: {"day": 1, "completed": true}
```

---

## How It Works

### Frontend (Next.js)
1. Page loads at: `http://localhost:3003/7-days-to-calm`
2. Frontend has `NEXT_PUBLIC_BACKEND_URL=http://localhost:8787`
3. When user clicks "Continue Day X", widget initializes
4. Widget calls: `GET /convai/signed-url?challenge_day=1`
5. Backend returns signed WebSocket URL
6. ElevenLabs ConvAI connects via WebSocket
7. User can talk to Shria coach

### Backend (FastAPI)
1. Receives request for signed URL
2. Calls ElevenLabs API with challenge_day context
3. ElevenLabs returns signed WebSocket URL
4. Backend returns to frontend
5. Frontend passes to widget

---

## Testing Locally

### 1. Frontend Dev Server
Already running at: http://localhost:3003

### 2. Backend API Server
Now running at: http://127.0.0.1:8787

### 3. Test the Widget
1. Open: http://localhost:3003/7-days-to-calm
2. You should see:
   - Progress bar with 7 days
   - "Day 1: Arrive" title
   - Three buttons: Reset, Skip, Continue
   - ✅ **NO MORE "Unable to load Shria guide" error**

### 4. Click "Continue Day 1"
- Widget should load
- You should see Shria's avatar orb
- You should be able to start talking

---

## Environment Configuration

### Local Development (.env.local)
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
```

### Production (.env.production.local)
Update to:
```
NEXT_PUBLIC_BACKEND_URL=https://seven-days-to-calm.onrender.com
```
(Or whatever your production backend URL is)

---

## Backend Files Modified

### main.py
- Added: `from dotenv import load_dotenv`
- Added: `load_dotenv()` to load .env file
- Updated: ALLOW_ORIGINS to include new domains

---

## Troubleshooting

### "Unable to load Shria guide" still showing?

**1. Check backend is running:**
```bash
curl http://127.0.0.1:8787/health
```
Should return `{"status": "healthy"}`

**2. Check frontend env var:**
Open browser console and run:
```javascript
// Should show: http://localhost:8787
console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL)
```

**3. Hard refresh browser:**
- Press: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- This clears the widget cache

**4. Check browser Network tab (F12):**
- Should see: `GET /convai/signed-url?challenge_day=1` → Status 200
- Response should have `signed_url` field

### Backend won't start?

**Check Python installed:**
```bash
python --version
```

**Check requirements installed:**
```bash
cd em-backend
pip install -r requirements.txt
```

**Check .env file exists:**
```bash
ls -la em-backend/.env
```

### CORS error?

**Error:** "Access to XMLHttpRequest has been blocked by CORS policy"

**Solution:** The frontend domain needs to be in `ALLOW_ORIGINS` in main.py

Current whitelist:
- `http://localhost:3003` ✅
- `https://7dtc.elevatedmovements.com` ✅
- `https://7-days-to-calm.vercel.app` ✅

If using a different domain, add it to ALLOW_ORIGINS.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│  Loads: http://localhost:3003/7-days-to-calm               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├──► GET /convai/signed-url?challenge_day=1
                       │     (calls Backend API)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│           FastAPI Backend (Port 8787)                        │
│  - main.py running with uvicorn                             │
│  - .env variables loaded (ELEVENLABS_API_KEY, AGENT_ID)    │
│  - Calls ElevenLabs API to generate signed URL             │
│  - Returns signed WebSocket URL to frontend                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├──► Calls ElevenLabs API
                       │     (returns signed WebSocket URL)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              ElevenLabs ConvAI API                           │
│  - Processes challenge_day context                         │
│  - Generates WebSocket connection                          │
│  - Manages Shria conversation                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

### Local Testing (Done ✅)
- [x] Backend running
- [x] Frontend running
- [x] Widget loading
- [ ] Click "Continue Day 1" and test conversation

### Production Deployment
When ready to deploy backend to production:
1. Push backend changes to GitHub
2. Connect to Render or similar
3. Set environment variables there
4. Update frontend `NEXT_PUBLIC_BACKEND_URL` to production URL

---

## Support

**Backend docs:**
- FastAPI: https://fastapi.tiangolo.com
- Uvicorn: https://www.uvicorn.org
- ElevenLabs Python: https://github.com/elevenlabs/elevenlabs-python

**Check logs:**
```bash
# Window 1: Frontend
cd em-frontend && npm run dev

# Window 2: Backend
cd em-backend && python -m uvicorn main:app --host 127.0.0.1 --port 8787 --reload
```

Both servers now running locally with hot-reload! 🚀

---

**Status:** Backend running ✅ | Widget ready ✅ | Ready to test conversations ✅
