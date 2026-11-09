# Practice visuals and spacing — November 9, 2026

The user approved enriching the practice area while preserving larger text, easy access to Shria and the video. They also clarified that excessive space between elements was a concern. Ive and Kare advised before implementation and reviewed desktop/mobile evidence before release.

## Implementation

- Reduced intention padding from 45/40/36px to 28px desktop, 24px phone and 22/20px narrow phone. Reduced quote margins from 30px to 20px and removed the unnecessarily narrow 290/325px text caps.
- Removed the fixed guide minimum height, reduced the decorative orb to 88px, grouped it beside the desktop heading and removed automatic credit spacing. Phone identity remains stacked and readable. Body/control text remains 18px, support 16px, labels 14px; action targets remain at least 44px.
- Added seven small original SVG theme illustrations: arrival ripples, flowing exhale, body outline, thought cloud, breathing square, awareness rays and interlocking integration rings. They are static, hidden from assistive technology and never interactive. Written day/theme/status remain authoritative.
- Added a faint waterline in a separate row below intention copy. It does not overlap reading, controls or focus rings. Avoided additional progress icons to prevent clutter.
- Kept Shria's familiar orb, prominent start action, secondary completion, guide-first phone order, keyboard jump and video/motion preferences. Corrected the guide heading to h2 to avoid a heading-level skip in document order.

## Reviews and verification

Ive and Kare each inspected six renders and all four changed component/style files: desktop practice/detail and viewport, full pages at 390px and 320px, focused phone guide and the long Day 2 title at 320px. Both found the visuals READY with no must-fix layout issues. Ive requested revision-bound evidence before deployment; the release packet includes commit identity, file digests, build identity, passing test artifact and operator test receipt.

They found tighter grouping, restrained symbols, readable long-title wrapping, a separate/subordinate waterline and clear action priority. Remaining desktop space beneath intention reflects the neighboring panel height; narrow-phone height largely reflects the preserved readable text. Optional future work is shortening invitation copy, not shrinking type or privacy guidance.

Production build and all eleven operator browser checks pass. The extended layout check captures long Day 2 and final completion at 320px; existing keyboard/overflow/type, persistence/reset, signing retry, mocked-provider voice controls/transcript, microphone denial, video/looping, reduced motion, autoplay recovery and actual WebM fallback remain passing. Matching staging/source digests were checked. No new human audio test or continuous-playback design sign-off is claimed. Reviews were screenshots/source, not agent-executed browser tests.
