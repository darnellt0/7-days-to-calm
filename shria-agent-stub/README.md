# Optional Shria tool demo

Production signing belongs to `../em-backend` (FastAPI). This Express package demonstrates tool handlers with an in-memory store.

```powershell
npm ci
npm run build
npx vitest run
npm run dev
```

`npm start` runs compiled ESM on port 4000. Set environment variables in the shell or hosting dashboard; this demo does not load `.env` automatically.

`GET /convai/signed-url?challenge_day=1` forwards to `BACKEND_URL`, returning the real `signed_url` plus a compatibility `url` alias. Missing configuration returns 503. No fake tokens are generated.

```powershell
$env:BACKEND_URL='http://localhost:8787'
$env:CORS_ALLOWLIST='http://localhost:3000,https://www.elevatedmovements.com,https://elevatedmovements.com'
npm run dev
```

Allowed browser origins get CORS headers; disallowed origins receive 403. No-Origin requests such as PowerShell are supported. OPTIONS returns 204. CORS is not authentication. Tool endpoints under `/api/tools` are unauthenticated demo APIs.

See the root README for Webflow embedding, ElevenLabs configuration, deployment, and verification commands.
