# 7 Days to Calm

Inline Shria voice sessions with browser-local challenge progress. Production uses `em-frontend` (Next.js 15, React 18) and `em-backend` (FastAPI). The optional `shria-agent-stub` Express demo forwards signing to FastAPI; it never issues fake tokens.

## Run locally

Use Node 22.13+ and Python 3.11+ in a virtual environment. From PowerShell:

```powershell
cd em-backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env # first setup only; do not overwrite existing credentials
# Edit .env with a real API key SECRET and AGENT_ID
.\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8787
```

POSIX: use `python3 -m venv venv`, `venv/bin/python -m pip install -r requirements.txt`, `cp .env.example .env`, then `venv/bin/python -m uvicorn main:app --reload --port 8787`.

In a separate terminal:

```powershell
cd em-frontend
Copy-Item .env.local.example .env.local # first setup only
npm ci
npm run dev
```

Open http://localhost:3000/7-days-to-calm. Begin requests microphone permission and a fresh signed URL. End stops the call; changing days ends the prior call. Complete Day advances progress, including persistent Day 7 completion. Reset restarts the calendar. Reminder tools save preferences locally; they do not schedule notifications.

## Environment and deployment

Backend only:

```dotenv
ELEVENLABS_API_KEY=your_api_key_secret
AGENT_ID=your_shria_agent_id
TOOL_BEARER_TOKEN=
JWT_SECRET=
CORS_ALLOWLIST=http://localhost:3000,http://localhost:3001,https://7-days-to-calm.vercel.app,https://elevatedmovements.com,https://www.elevatedmovements.com
```

Use the secret shown on key creation/rotation, not a key ID. `JWT_SECRET` is unused, retained for template compatibility. `ELEVENLABS_AGENT_ID` works as a migration alias; prefer `AGENT_ID`. Missing credentials return 503. `/health` reports process liveness and configuration readiness; it does not verify credential validity. Rotate previously committed secrets in the provider dashboard.

Frontend only: `NEXT_PUBLIC_BACKEND_URL=http://localhost:8787`. On Vercel, set it to the real Render URL and rebuild.

Render root: `em-backend`; build: `pip install -r requirements.txt`; start: `uvicorn main:app --host 0.0.0.0 --port $PORT`. Vercel root: `em-frontend`; build: `npm run build`. Set exact preview origins in backend CORS when needed. Microphone policy is defined once in `next.config.js`: `microphone=(self)`. HTTPS is required outside localhost.

CORS is a browser control, not user authentication or a quota limit. Add user authentication/rate limits before opening paid sessions to a large audience.

## ElevenLabs agent configuration

Enable authentication on Shria and allow your app domains. Grant the server key ElevenAgents Write (`convai_write`) access; the signed URL endpoint requires Write even though it uses GET. Keep unrelated API categories disabled. Configure these variables in the system prompt:

```text
You are Shria, the Elevated Movements mindfulness guide.
The user is on Day {{challenge_day}}: {{challenge_title}} of {{challenge_name}}.
Guide that day's practice. Ask whether they have 2, 5, or 8 minutes.
Day 1 Arrive; Day 2 Longer Exhale; Day 3 Body Scan; Day 4 Label Thoughts;
Day 5 Box Breathing; Day 6 Open Awareness; Day 7 Integration.
```

Run `em-backend/venv/Scripts/python.exe scripts/configure-shria.py` on Windows (or `em-backend/venv/bin/python scripts/configure-shria.py` on macOS/Linux) to apply the challenge guidance. This idempotent script preserves the existing coaching prompt, backs up affected fields in ignored `.local/`, and sets the first message to `{{session_greeting}}`. Its default preserves the original greeting for other apps. The client supplies a day-specific greeting and variables at session initiation, then sends a contextual update after connection. No prompt override permission is needed. Building the repo alone does not change the remote agent.

Supported client tools: `getChallengeDay`, `setChallengeDay` (day integer 1–7), `trackEvent` (name/payload), `setReminder` (time/label), `openLink` (HTTPS URL). Configure matching tool schemas in ElevenLabs if your prompt uses them.

The official JavaScript SDK powers the inline panel. The old web component's `full-width` variant was unsupported; styling its host did not convert its overlay to an inline UI. No agent ID or API key is included in client code.

## Webflow embed

Embed the actual app, not a nonexistent `/widget.html`. The app permits framing. The Webflow parent must delegate microphone access; a restrictive parent Permissions-Policy can still block it.

```html
<div id="em-convai">
  <iframe title="7 Days to Calm with Shria"
    src="https://7-days-to-calm.vercel.app/7-days-to-calm"
    allow="microphone https://7-days-to-calm.vercel.app; autoplay https://7-days-to-calm.vercel.app"
    style="width:100%;min-height:1100px;border:0;border-radius:16px"
    loading="lazy"></iframe>
</div>
```

This embeds the full challenge. Users press Begin inside it. Progress belongs to the iframe origin; third-party storage restrictions may affect persistence.

## Checks

```powershell
# From em-backend
.\venv\Scripts\python.exe -m unittest discover -s tests -v
# From em-frontend
npm run build
npx playwright install chromium
npm run test:browser
# From shria-agent-stub (optional demo)
npm run build
npx vitest run
```

```powershell
Invoke-RestMethod http://localhost:8787/health
$r = Invoke-RestMethod 'http://localhost:8787/convai/signed-url?challenge_day=1'
[bool]$r.signed_url # do not publish the signed URL
Invoke-WebRequest -Method Options -Uri http://localhost:8787/convai/signed-url -Headers @{ Origin='http://localhost:3000'; 'Access-Control-Request-Method'='GET' }
```

`[EM] widget ready` indicates panel readiness; `[EM] got signed url for day` indicates signing success. Neither alone proves an audio conversation. Failures carry `X-Request-ID`; logs record safe provider status/code and stack locations without credentials or signed URLs. `/tts/closing` returns text with `audio_generated:false`; synthesized closing audio is not implemented.

See [completion specification](docs/COMPLETION-SPEC.md) and [verification report](docs/VERIFICATION.md).
