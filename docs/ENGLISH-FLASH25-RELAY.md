# English Flash v2.5 speech relay

Status: implemented; **disabled in production**. Live synthesis is blocked by the existing key's missing `text_to_speech` permission (HTTP 401). No permissions changed. The private workflow-override probe was rejected with 422; no QA agent was created.

## Approach

The native English agent and workflow override reject Flash v2.5. Standalone TTS supports explicit `model_id="eleven_flash_v2_5"` and `language_code="en"`. The relay retains the agent's English ASR/guidance and replaces its audio with standalone Flash v2.5 synthesis.

Official references: [language routing](https://elevenlabs.io/docs/eleven-agents/customization/voice/customization/language), [streamed TTS](https://elevenlabs.io/docs/api-reference/text-to-speech/stream).

- With `VOICE_PLAYBACK_MODE=native` (default), signing behaves as before.
- With `flash25`, signing returns a backend-relative relay path and an opaque ticket, never the upstream URL. Tickets expire after 45 seconds, bind to the allowed Origin/day, and work once. Starts are limited to six per address/minute and 500 outstanding tickets.
- The WebSocket relay forwards microphone/SDK/tool events, fixes the initial challenge day to the ticket, and removes client configuration overrides. Only upstream agent replies can reach the private TTS call; there is no public arbitrary-text synthesis route.
- Native audio is discarded. Replies use voice `DoEstgRs2aKZVhKhJhnx`, English Flash v2.5, speed .94, stability .30, similarity .85 and PCM16k output. Interruption cancels synthesis and clears queued replies; disconnect/timeout cancels both upstream and playback. TTS failure ends the connection rather than reverting to v2 audio.
- Frontend resolves the path against its configured backend. Production uses WSS; WS is permitted only for localhost. No keys enter the browser.

## Tradeoffs and deployment

The agent still generates native audio upstream, which is discarded. This retains agent charges and adds standalone TTS charges. Synthesis starts after a full reply is available, adding latency compared with native streaming. Live timing, interruption behavior and resemblance to the reference require validation before activation.

In-memory tickets require **one worker and one backend instance**. The blueprint specifies one worker; confirm the existing Render service's actual start command as well. A blueprint change does not automatically reconfigure a manually created service. Scaling requires a shared ticket store first.

1. Obtain approval to add **Text-to-Speech** to the existing server-side key, retaining all other scopes. This permits paid speech synthesis; no new key is required.
2. Generate an English Flash v2.5 sample and test the local relay with real ASR/TTS, interruptions, end/cancel and error recovery.
3. Deploy the prepared source; confirm one worker/instance. Only then enable `VOICE_PLAYBACK_MODE=flash25` on Render.
4. Verify production signing returns `relay_path`, English audio uses the selected standalone model, and desktop/mobile context and saved progress work. Human listening acceptance remains separate from configuration tests.

Rollback: set `VOICE_PLAYBACK_MODE=native` and restart. No provider agent settings change for this relay.

## Completed checks

Production build passed. Backend: **17 passed**. Component logic: **25 passed**. Desktop/mobile-touch browsers: **36 passed**. Browser/provider/TTS tests use mocks and synthetic microphone input; no live English v2.5 audio or physical-device sign-off is claimed.

Tests cover explicit English v2.5/model/settings requests, ticket expiry/reuse/origin and rate limits, original-audio suppression, client override removal, day preservation, TTS failure without fallback, interruption cancellation, SDK relay connection and existing challenge/video/progress regressions.

From `em-backend`: `venv\Scripts\python.exe -m unittest discover -s tests -v`.
From `em-frontend`: `npm run test:logic`, `npm run build`, `npm run test:browser`.
