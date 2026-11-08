# 7 Days to Calm completion specification

## Scope and acceptance

1. FastAPI is the production backend. GET `/convai/signed-url?challenge_day=1` uses the installed official SDK's `conversational_ai.conversations.get_signed_url`, returns an unmodified `signed_url`, validates days 1–7, and sets `Cache-Control: no-store`. No invented provider endpoints or JWT signing.
2. API keys remain server-side. Missing configuration returns a controlled 503; provider failures return a sanitized 502 with a correlation ID and safe server diagnostics. Support legacy `ELEVENLABS_AGENT_ID` during migration, but deploy `AGENT_ID`. Exact-origin CORS covers local and production sites; OPTIONS succeeds for allowed origins.
3. The challenge renders a real inline voice panel through the official JavaScript SDK. Fetch a fresh URL when Begin is clicked; request microphone access only following that click. Send challenge day and theme as dynamic variables and contextual updates. Explain the required agent prompt configuration. End, mute, transcript, failure/retry, and unmount cleanup are visible and functional. No floating overlay or public agent ID.
4. Preserve progress, reset, skip-to-today, analytics, and client tools. Day 7 can be completed and persists after refresh. Changing days ends the prior session. Continue must not silently complete a practice.
5. Restore `/tts/closing` as an explicitly documented text response (audio generation is outside this build). Keep health and authenticated goal logging. Health distinguishes process liveness from configuration readiness.
6. Consolidate microphone policy to `microphone=(self)`; align Render environment names; frontend env contains only backend URL. Express remains an optional tool demo: builds successfully and forwards signing to FastAPI, never issues fake tokens.
7. Document local Windows/POSIX commands, Render/Vercel settings, agent configuration, and a Webflow iframe pointing at the actual app with microphone delegation.

## Validation

- Production Next.js build, Express build and existing tool tests.
- Backend integration tests: success contract, missing config, provider failure/redaction, day validation, CORS, health, goal authorization, closing text.
- Browser tests: visible inline controls and dimensions, loading failure/retry, persisted day/reset/final completion, session startup inputs and teardown using the real SDK against a mocked provider. These tests do not prove provider audio.
- Start real local services; check page, favicon, policy, health and CORS. Attempt real provider signing without printing credentials or signed URLs. Report external credential/network blockers explicitly.
- Release gate: a human microphone conversation confirms Shria speaks the correct daily practice; deployment and remote agent edits must be reported separately from local completion.
