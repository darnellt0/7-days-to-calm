# OpenClaw design review

Date: 2026-11-08 (America/Los_Angeles).

Consulted the registered **Ive — Product Design Director** and **Susan Kare — UI & Interface Systems** agents on the user's K8 OpenClaw instance. Read the design-system severity review guidance and product-design role definitions. The user's explicit navy/periwinkle/coral direction takes precedence over default EM brand colors.

Both agents visually inspected desktop and 390px phone screenshots. Their tools could not read the initial shared-workspace copies; scoped copies inside each permitted agent workspace resolved access. No permissions, credentials, agent configurations, or delivery channels were changed. Reviews ran through the existing OpenClaw gateway without external message delivery.

Both reviewers supported the art direction. Findings and integration:

| Finding | Change |
| --- | --- |
| Small mobile timeline labels and inconsistent abbreviations | Kept seven noninteractive status markers; show a clear full current-day name and Day X of 7 on mobile. Removed abbreviated visible labels. Full names remain available to screen readers. |
| Supporting text too small | Practice description 17px; instructions, status, microphone note and buttons 16px; utility/support text 12–15px as appropriate. |
| Completion competes with Begin | Completion is outlined while idle; emphasized after an established session ends. Completion stays explicit and self-directed practice remains available. |
| Hero-to-guide handoff and day context | Larger single-hit-area hero link; keyboard-focusable guide destination; current-day title inside the voice panel. |
| Contrast checks | Primary white/deep-violet 6.68:1; navy/coral 8.04:1; muted/paper 5.42:1; deep-violet/lavender 5.70:1. These are measured color pairs, not a full accessibility certification. |

OpenClaw review artifacts remain on the K8 device in each agent's scoped review directory. The agents reviewed supplied screenshots, not live audio or computed styles. Codex verifies implementation with the production build and focused browser tests. No claim of agent visual sign-off on subsequent edits is implied.
