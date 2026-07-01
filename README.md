# 7 Days to Calm – Elevated Movements

Guided mindfulness challenge powered by the ElevenLabs Conversational AI widget.

## Features
- Seven-day progressive curriculum with local progress tracking in `localStorage`.
- Inline ElevenLabs ConvAI guide loaded via secure backend-signed URLs.
- FastAPI backend for signed URL issuance, health checks, and goal logging.
- Next.js 14 frontend styled with Tailwind CSS.

## Architecture
| Layer    | Tech            | Key Endpoints / Routes                     |
|----------|-----------------|---------------------------------------------|
| Frontend | Next.js 14      | `/7-days-to-calm`                           |
| Backend  | FastAPI (uvicorn) | `/convai/signed-url`, `/tool/log-goal`, `/health` |

## How to Run Locally

1. **Backend**
   ```bash
   cd em-backend
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS / Linux
   # source venv/bin/activate

   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env and set ELEVENLABS_API_KEY, AGENT_ID, optional TOOL_BEARER_TOKEN
   uvicorn main:app --reload --port 8787
   ```

2. **Frontend**
   ```bash
   cd em-frontend
   cp .env.example .env.local
   npm install
   npm run dev
   ```
   Visit `http://localhost:3000/7-days-to-calm`.

3. **Verify**
   - Browser console should show `[EM] got signed url for day 1` and `[EM] widget ready`.
   - Check `http://localhost:8787/health` for a `200` response.

## Environment Variables

**Backend (`em-backend/.env`)**
```
ELEVENLABS_API_KEY=your_elevenlabs_api_key
AGENT_ID=agent_4201k708pqxsed39y0vsz05gn66e   # ELEVENLABS_AGENT_ID also accepted
CORS_ORIGINS=optional,comma-separated,extra,origins
JWT_SECRET=optional-if-needed
TOOL_BEARER_TOKEN=optional
```

**Frontend (`em-frontend/.env.local`)**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
```

## Deployment Notes
- Frontend sets `Permissions-Policy: microphone=(self "...")` to satisfy Vercel microphone requirements.
- Backend CORS allows:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
  - `http://localhost:3001`
  - `http://127.0.0.1:3001`
  - `https://7-days-to-calm.vercel.app`
  - `https://elevatedmovements.com`
  - `https://www.elevatedmovements.com`

Ensure production deployments set the same environment variables as local.
