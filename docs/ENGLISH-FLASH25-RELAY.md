# English Turbo v2.5 speech relay

## Current selection - 2026-11-20

The user compared continuous Turbo and Flash v2.5 recordings and selected Turbo as closer to Shria. All relay speech, including the opening greeting, now explicitly requests eleven_turbo_v2_5 with the same saved Shria voice, English, speed .94, stability .30 and similarity .85. Native audio remains discarded and synthesis errors never fall back to another model or voice.

Set VOICE_PLAYBACK_MODE=turbo25. The existing flash25 activation value remains accepted for deployment compatibility but now also selects Turbo. Native provider agent configuration remains separate and unchanged. Completed TTS request IDs are retained only within a session (last three) to condition the next reply; interrupted generations are excluded. If a provider omits the ID, prior text remains the continuity fallback. See [request stitching](https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/request-stitching). This reduces turn-to-turn variation; it cannot guarantee perceptually identical delivery. Human acceptance of the complete live practice remains separate from automated configuration checks.

The historical Flash activation record below describes the previous deployment.


Status: **enabled in production** after explicit approval added Text-to-Speech access to the existing key. Other key scopes were retained. Direct synthesis, local relay, and production desktop/mobile-touch tests passed. The private workflow-override probe was rejected with 422; no QA agent was created.

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


## Activation receipts - 2026-11-15

The user explicitly approved Text-to-Speech on the existing key, live testing and activation if checks passed. ElevenLabs confirmed the update. A direct request generated English Flash v2.5 PCM audio using the selected voice and settings. No new key or voice was created.

Live local relay: three locally synthesized spoken inputs produced four English Flash v2.5 replies and a correct Day three / Body Scan closing. Spoken interruption stopped the old turn and resumed with a newer playable sequence. Desktop and mobile-touch tests exercised real SDK, relay, provider ASR/agent and standalone TTS playback. Both passed mute/end, microphone release, day context and Day 4 persistence after reload, without page errors. Inputs were synthetic; this is not physical-phone or human voice-identity sign-off.

Live tests caught and fixed SDK subprotocol negotiation (convai), bounded upstream frame sizing and normal/error close handling. Backend regressions now pass 18/18. Earlier 25 component and 36 mocked browser checks remain applicable; subsequent fixes changed backend code only. Synthetic browser fixtures were corrected to 48kHz and to preserve localStorage on reload. A phrase asking the agent to wait triggered its existing skip-turn tool; the final fixture uses a natural practice request.

Render's Docker command uses one Uvicorn worker; the free service is one instance. Commit 7530086 deployed successfully. Saved VOICE_PLAYBACK_MODE=flash25; environment-update deploy dep-dbtbanbbc2fs73dls9f0 reported Deploy succeeded | Live. Public health/signing return 200; signing advertises eleven_flash_v2_5, returns a one-use relay path, and preserves no-store and production CORS.

Final production browser runs passed on desktop and mobile-touch emulation: real synthetic speech recognition, Flash v2.5 audio playback, correct day, mute/end, released microphone tracks and saved Day 4 after reload. No page errors. The upstream agent remains native Flash v2; audio played by the app is explicitly standalone English Flash v2.5. The old direct Webflow embed is not routed through this app relay.

Subjective similarity to the supplied sample still needs the user's ear-check. Actual generated audio, screenshots and QA receipts are under ignored .local/voice-audit/english25. No customer recordings were inspected. Rollback remains VOICE_PLAYBACK_MODE=native plus restart.

## Turbo release checks - 2026-11-20

Commit d6d7ebf deployed through GitHub. Production health/signing returned 200 and signing advertised eleven_turbo_v2_5. All 20 backend regressions passed, including fixed model/settings for greeting and later turns, session continuity history, exclusion of interrupted streams, original-audio suppression and failure without another-voice fallback.

Actual standalone Turbo synthesis accepted the opening and two subsequent utterances with completed-request continuity. Production desktop and mobile-touch emulation each passed real SDK/provider ASR/TTS with two distinct spoken responses, day context, mute/end, microphone release and saved progress after reload. Actual spoken interruption cancelled the old response and resumed with a newer playable response. These tests use synthetic speech, not physical-phone or human auditory sign-off. The separate ad-hoc long-practice fixture did not pass its closing assertion after an ellipsis reply; it is not counted as full-practice validation.

The user's preference for Turbo is recorded in Turing's project feedback. Full-practice perceived voice continuity remains subject to the user's listening check. Evidence is stored under ignored .local/voice-audit/english25/turbo-*.
