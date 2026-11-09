# 7 Days to Calm improvement rounds

## Round 1: visual design and challenge flow

Revised after user feedback: a distinct identity beyond EM colors. Midnight navy, electric periwinkle, lilac, and warm coral; bold editorial headings and clear controls. A generated glass-portal waterscape anchors the hero. A responsive two-column practice card uses a luminous orbit for Shria. Distinguish completed days from the current day. Show a truthful count and celebrate only after completing Day 7. Retain the MenoPause destination and founding offer. A dedicated design agent owns the visual system and critiques the result.

Acceptance: desktop and 390px mobile views have no horizontal overflow; primary action is clear; every day has a title and intention; completion persists after reload.

## Round 2: session experience and accessibility

Connection/listening/speaking/muted states, connected-session timer, readable transcript. Disable progress changes during calls, including agent-driven day changes. Native modal dialogs with keyboard focus and Escape handling. Correct reset/skip notifications and graceful storage failure. Honor reduced motion.

Acceptance: signing only after Begin; retry, cancellation, mute, end, persisted progress, storage failure, and keyboard dialogs work. Preserve signed URL authentication, day variables, and credential privacy.

## Round 3: evidence-driven polish (conditional)

Review desktop/mobile screenshots and state transitions. Fix concrete layout, contrast, focus, or state defects before release; avoid unrelated features.

Performed: screenshot review exposed squeezed mobile day markers and awkward multi-line labels. Fixed marker widths and added compact visible labels while preserving full names for screen readers. Added a direct hero link to Shria so phone users can bypass introductory content. Increased small functional text following design critique. Replaced the voice button's external-link arrow with a microphone icon. Browser regression caught lost focus after dismissing a dialog; explicit focus restoration corrects it.

Follow-up with the user's OpenClaw design team: Ive and Kare visually reviewed the screenshots and endorsed the palette/artwork. Applied their readability and hierarchy recommendations: mobile full current-day title instead of abbreviated labels, larger supporting text, day context within the voice panel, a keyboard-focusable hero destination, and an outlined completion action until a voice session ends. See `OPENCLAW-DESIGN-REVIEW.md` for evidence and scope.

## Release checks

Production build, focused browser regressions, desktop/mobile screenshots, console inspection, commit/deploy through existing main integration, custom-domain and backend signing checks. The user checks real microphone/speaker quality on their device.
