# Practice-first layout — November 9, 2026

The user approved a shorter introduction, a stronger practice entry and practice ahead of the seven-day tracker, retaining larger text and video. Ive and Kare were required to review desktop and mobile before deployment.

## Changes

- Reduced header and introductory padding, preserving headline size and the 18px reading/control, 16px support and 14px label scale.
- Made the keyboard-accessible practice jump a primary button. Consolidated repetitive intro details into the challenge eyebrow.
- Used a 420×280 desktop video panel to preserve composition at the shorter height. Phone video remains responsive with existing pause/reduced-motion behavior.
- Moved practice before the tracker. Guide comes first in document order and on phones, before the longer intention. Desktop retains intention left and guide right; the guide supplies independent day context.
- Preserved completion, progress persistence, reset, session controls and signing.

## Predeployment reviews

Ive and Kare each inspected candidate source plus six screenshots: desktop viewport/full page at 1440×1000, full pages at 390×844 and 320×844, and the focused practice after the primary jump at both phone widths.

Both returned READY with no must-fix layout findings. Ive confirmed purposeful grouping, task priority, readable phone wrapping and intact scene crop. Kare confirmed controlled mobile spacing, prominent start controls and preserved typography. Optional future considerations were a smaller phone orb and shorter narrow-phone header note; neither was required for release.

These were screenshot/source design reviews, not executed app or human audio tests. Desktop visual order differs from guide-first document order; both found the sequence understandable because the guide has independent day context. Keep this an explicit accessibility consideration in future changes.

## Verification

Production build and all eleven operator-run browser checks passed. The added layout regression checks primary-button prominence/target size, practice before tracking, guide before intention on phones, 18px controls, no overflow at 390/320px, and keyboard navigation that focuses the guide with Begin practice in the viewport. Existing progress, signing retry, mocked-provider voice flow, dialogs, blocked storage, microphone denial, decoded video/looping, reduced motion, autoplay recovery and actual WebM fallback pass.

Screenshot review caught and corrected punctuation encoding and an overly wide video crop before final agent review. Build/tests used an isolated matching copy to avoid OneDrive locks. No new human audio assessment was performed.
