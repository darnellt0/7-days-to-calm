# Shria regression audit — 2026-11-09

User report: the voice changed partway through a practice and did not sound like Shria.

## Findings and repairs

- The live shared ElevenLabs agent used stock Jessica as its root voice. Its workflow could hand off to an EM lead-qualification agent with a different voice and no challenge guidance. A connected handoff had an LLM condition of `...`.
- Applied a provider-side expression guard: days 1–7 cannot hand off to standalone agents or phone numbers. General sessions (default day 0) retain the original handoff condition. Root voice and other agent settings are unchanged. `scripts/challenge_workflow.py` defaults to dry run; `--apply` saves a backup and applies missing guards. New backend tests cover all seven days, general flows and idempotence.
- Retired startup callbacks can no longer resurrect a disconnected/cancelled session or mutate reminders/analytics. Late SDK handles close once through a cached teardown promise. Repeated End/start cannot overlap teardown. Browser storage, invalid links and popup exceptions return useful tool results.
- A contradictory legacy completion flag on days 1–6 is repaired on load, preventing earlier days from becoming stuck as completed. Day 7 completion, reset and skip remain persistent.

The workflow was a concrete route to a different voice; this does not establish that every perceived voice change came from that route. Voice identity remains open: the intended Shria voice has not been identified/confirmed, and no replacement voice was guessed.

## Evidence and ownership

| Check | Result | Scope |
| --- | --- | --- |
| Turing offline component suite | 25 passed | Full transpiled TSX bodies; mocked React hooks, browser APIs and SDK. No DOM/audio. |
| Operator local logic rerun | 25 passed | Same cases, canonical sources and installed TypeScript. |
| Operator production build | Passed | Next build, type checking, static generation. |
| Operator browser matrix | 34 passed | Chromium desktop and mobile touch emulation; actual React/SDK, synthetic microphone and mocked signing/WebSocket provider. |
| Operator actual FastAPI tests | 10 passed | Routing, CORS, signed URL SDK contract, missing config, redaction, goal auth, closing and workflow guard. Provider mocked. |
| Operator live provider conversations | 3 passed | Days 1, 3 and 7: signed URLs, actual provider, correct day/theme and meditation guidance. Text-only; not voice identity. |

Browser cases include all seven sessions with signing-query/context/transcript assertions, completion and reload after every day, final completion, reset/skip, storage failures, denied microphone, failed signing/retry, remote disconnect/reconnect, cancel during signing, control targets, narrow-layout overflow and video/reduced-motion fallbacks. This is not physical iOS/Android testing or human microphone/speaker sign-off.

Final Turing receipt: `reviews/calm-full-qa-20261109/FINAL-RESULTS.md` in his Nia-live workspace. SHA-256 before/after execution matched:

- `ShriaGuide.tsx`: `eb5ac95a1d6b83e8f4b022a3b20251349b8101e5618a0bba36ef12e2f329cf49`
- `SevenDaysToCalm.tsx`: `ea3e2548724ae24878b0170a0c27d96b91c41a8f59357d7978f12c8829f6807d`

The earlier Turing receipt referenced a source revision that did not match retrieved files. It is superseded. The operator reproduced two remaining failures, applied fixes, synchronized canonical files, and required a fresh Turing execution. Passing receipts must be invalidated when source/tests change. Operator instructions and findings must not be attributed as direct user quotations.

## Repeat

From `em-backend`: `venv\Scripts\python.exe -m unittest discover -s tests -v`.

From `em-frontend`: `npm run test:logic`, `npm run build`, then `npm run test:browser`. Browser matrix launches the built app on port 3001. Use an isolated matching source copy if OneDrive locks generated build files; never copy backend credentials into that staging directory.

## Remaining acceptance

Identify the intended Shria voice in the signed-in ElevenLabs account, then compare a real desktop and physical-phone audio practice against the approved voice. Check opening and mid-session voice consistency, natural pacing, microphone release and day-specific guidance. Automated text correctness cannot approve those perceptual properties.
