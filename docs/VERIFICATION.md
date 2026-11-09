# Verification — November 8, 2026

## Implemented

- Inline voice panel using the official ElevenLabs JavaScript SDK; no shadow-DOM styling or unsupported widget variant.
- Fresh server-signed URL on Begin, microphone permission on user action, day/theme dynamic variables and contextual update, transcript, mute, end, cancel, error/retry, and session teardown on day changes/unmount.
- Persistent challenge progress including final completion; reset and skip-to-today retained. Responsive progress labels no longer overflow narrow screens.
- FastAPI uses the supported pinned SDK method; day validation, no-store responses, exact CORS, origin rejection before provider calls, controlled 503/502 responses with request IDs and safe diagnostics.
- Restored closing-text contract. Goal logging bearer protection retained. No synthesized closing audio is claimed.
- Render environment names aligned; legacy agent variable accepted during migration. One microphone policy. Framing enabled for Webflow embedding.
- Express demo builds and forwards real signing; fake URL and nonexistent iframe-loader instructions removed.
- Next.js moved from 14 to patched 15.5.29. PostCSS/glob/minimatch overrides resolve known transitive advisories; SDK pinned at 1.12.0. Frontend dependency audit reports zero vulnerabilities.
- Removed credential-like values from two tracked deployment notes. Historical secrets still require provider-side rotation.

## Evidence

| Check | Result |
| --- | --- |
| Next.js production build | Pass: compilation, types, static generation |
| FastAPI integration tests | 7 pass: SDK contract, missing configuration, legacy alias, sanitized provider errors, day validation, CORS/origin rejection, goal auth and closing |
| Express build | Pass |
| Express tests | 6 pass: tool handlers, preflight/origin rejection, configuration/day validation, signing forwarding |
| Playwright Chromium | 4 pass: visible inline guide/mobile sizing, progress through Day 7 and reload/reset, signing retry, real SDK protocol/context/transcript/mute/end against mocked provider, microphone-denied recovery |
| Frontend npm audit | Zero reported vulnerabilities |
| Local FastAPI startup and health | Pass: HTTP 200; required variables present |
| Local production page and favicon | HTTP 200; microphone policy present; no X-Frame-Options blocking Webflow |
| Live Render health | HTTP 200 after credential deployment |
| Live Vercel challenge page | HTTP 200, existing deployed version |
| Real ElevenLabs signing with replacement local credential | Pass: HTTP 200; signed WebSocket URL present for Days 1 and 3 |

The browser protocol test uses the actual SDK with a mocked provider WebSocket and synthetic microphone. It proves initiation payloads and controls, not real provider speech quality or remote prompt behavior. Screenshots are generated at `em-frontend/test-results/inline-guide-mobile.png`.

## External release gates

1. Local and Render credentials are replaced and real signing is verified. Rotate any previously exposed old keys; the new secret is not committed.
2. Challenge guidance and the default-safe `session_greeting` template are applied. A real signed WebSocket session returned the expected Day 3 / Body Scan greeting. Client tools require matching agent schemas if used.
3. Completed: release `a283505` is pushed to production main; Vercel reports deployment success and Render serves the updated health/signing contract.
4. Perform a real HTTPS microphone session on the deployed page and inside Webflow. Confirm the spoken day and complete daily guidance. Publishing the supplied iframe snippet in Webflow remains an external action.

## Primary references

- [ElevenLabs JavaScript SDK](https://elevenlabs.io/docs/eleven-agents/libraries/java-script)
- [Widget variant parser](https://github.com/elevenlabs/packages/blob/main/packages/convai-widget-core/src/types/config.ts)
- [Widget overlay wrapper](https://github.com/elevenlabs/packages/blob/main/packages/convai-widget-core/src/widget/Wrapper.tsx)

## Credential repair follow-up

Created the approved restricted key and stored its secret only in the ignored local backend `.env`. ElevenLabs requires ElevenAgents Write (`convai_write`) for GET signed URL issuance; Read alone returned `missing_permissions`. Write was separately approved and saved; all other categories remain disabled. Restarted the local API and verified real HTTP 200 signing. The local secret is not committed. Render now stores the same verified secret and has deployed it successfully. Read-only inspection also confirmed the existing shared agent prompt and first message do not reference `challenge_day`; no remote prompt changes were made.

## Production credential deployment verified

The replacement key was saved in Render service `7-days-to-calm` (`srv-d3mth5u3jp1c73d2jqng`). After correcting the form input and verifying the persisted value matched the local secret without printing it, environment deployment `dep-dboeun15efls73dm34kg` succeeded.

Verified against https://seven-days-to-calm.onrender.com:

- GET `/health`: 200.
- OPTIONS `/convai/signed-url` with Origin `https://7-days-to-calm.vercel.app`: 200 and matching Access-Control-Allow-Origin.
- GET `/convai/signed-url?challenge_day=1` with the same Origin: 200, nonempty signed URL, matching CORS header. The URL itself was not logged.

This credential-only deployment reuses source commit `ed38f24`. The newer local SDK interface and backend cleanup commits are still not published. Real spoken day guidance remains a separate release check.

## Final release candidate (2026-11-08)

Rebased the repair onto current production main `7625c25`, preserving the Day 7 MenoPause Reset banner and funnel links. Next.js production build and four browser tests pass on the merged release. Added idempotent agent configuration with an ignored backup of affected fields; preserved the shared agent's existing prompt and general greeting. A real provider session confirmed its first response names Day 3 and Body Scan. The browser tests use a synthetic microphone and mocked socket; a human audio check on HTTPS remains necessary.

## Production release verified (2026-11-08)

Published `a283505` to main. GitHub's Vercel status reports deployment completed successfully. Both the Vercel domain and `7dtc.elevatedmovements.com` return 200 with `microphone=(self), camera=(), geolocation=()`. The production page visibly contains the inline guide and Begin practice control, with no page-load console errors. Favicon returns 200.

Render's updated `/health` returns 200 and `ready: true`. Real signing returns 200, `Cache-Control: no-store`, and a request ID. Production Vercel CORS preflight passes; an unapproved origin returns 403. Signing also succeeds for the custom production and Webflow origins. A real WebSocket connection obtained through the deployed signing endpoint returns the expected Day 3 / Body Scan greeting. This test does not capture a user's microphone or prove speaker playback. The remaining acceptance check is a human voice practice over HTTPS and, when embedded, Webflow's microphone delegation.

## Visual and experience improvement rounds

Implemented the revised navy/periwinkle/coral identity with a design agent, generated portal artwork, responsive hero, daily intention, seven-step timeline, native confirmation dialogs, safe storage fallback, session timer, muted state, and progress controls disabled during voice calls. Completion promotion now appears after Day 7 is completed rather than merely opened. Existing offer/destination and signed URL authentication remain.

Next.js production build passes; seven browser tests pass. Verified persisted completion/reset, signing retries, real SDK protocol against a mock provider, mute/end and disabled progress controls, denied microphone, keyboard dialog focus/Escape/restoration, correct skip notification, blocked storage, loaded artwork, and no horizontal overflow at 390px and 320px. Reduced-motion animation override passes. Reviewed desktop, phone, and active-session screenshots. The review caught and corrected squeezed mobile markers and lost dialog focus; a direct hero-to-guide link reduces phone scrolling. See `IMPROVEMENT-ROUNDS.md` and `DESIGN-ASSETS.md`.

## OpenClaw design-team follow-up

Ive and Kare visually inspected desktop/mobile screenshots from within their permitted agent workspaces. Implemented larger functional text, a full current-day label on phones, in-panel day context, keyboard focus at the hero anchor destination, and completion-action emphasis only after an established session ends. Production build and all seven focused browser tests pass again, including the keyboard handoff, unchanged day after ending a call, conditional completion styling, and the Day 7 completion screen at 320px without overflow. Desktop/mobile screenshots were inspected after integration. See `OPENCLAW-DESIGN-REVIEW.md` for review provenance, applied findings and limits.

## Ambient motion pass

Production build and eight browser tests pass. The motion test observes changing rendered image transforms, persistent pause/reload/play, and runtime changes to the device reduced-motion preference. The SDK regression verifies hero animation is paused during a session. Existing progress, keyboard, storage failure, mobile overflow and microphone-error checks remain passing. Desktop/phone screenshots were inspected. Virgil supplied a written motion recommendation; that is not independent rendered-motion or live audio sign-off. See `MOTION-PASS.md`.

## Actual video-loop follow-up

The user requested stronger motion and a real video loop. Rendered a silent ten-second 960×640 cinemagraph from the existing generated artwork: H.264 MP4 (446,463 bytes) and VP9 WebM (309,382 bytes). Decoded all 250 frames; periodic source frames at t=0 and t=10 match exactly. The previous hero CSS zoom is removed.

Final production build and ten browser tests pass. Because OneDrive intermittently locked generated diagnostics, the final build/tests ran from a temporary copy of the current app inputs using the installed dependencies. Checks include native decoded time advancement and loop wraparound, pause/reload/play, runtime reduced-motion removal, zero video requests on a reduced-motion first load, manual recovery from blocked autoplay, actual WebM playback after MP4 failure, poster fallback after media failure, and existing SDK/progress/accessibility/mobile checks. These are operator-run checks; no new Turing-executed app test or human audio test is claimed.

## Stronger water/reflection v2

User feedback requested a more visibly living scene. Rendered the versioned v2 assets with larger water displacement, broader/faster ripples, moving warm reflection bands and stronger highlights, while protecting the solid portal and horizon. Both retain ten-second silent playback at 960×640/25fps; MP4 is 1,183,267 bytes and WebM is 681,529 bytes. All 250 MP4 frames decode and periodic source endpoints match exactly.

Compared old/new video frames at a 550×367 hero-sized render. Mean adjacent-frame water pixel change over the first two seconds increased from 0.772 to 2.098 on a 0–255 channel scale. This supports the increased rendered motion; it is not a subjective user-acceptance score. Inspected comparison frames for geometry and reflection placement. Production build and all ten browser regressions pass against matching isolated app inputs, including real v2 WebM fallback.
