# Quiet motion control and finishing polish — November 9, 2026

The user requested a less obtrusive play/pause symbol at the image's bottom right instead of the top text pill, plus restrained professional polish.

## Changes

- Icon-only motion button at 12px from the hero's bottom/right edges: 36px dark visual circle inside a 44px hit target, with a 16px white SVG. The action name remains available through screen-reader-only text and a native tooltip. The keyboard focus ring remains visible; device reduced motion still disables the control and prevents video loading/playback.
- Reserved 76px beside the caption so text and control remain separate, including natural two-line caption wrapping at 320px.
- Added one faint hero hairline and restrained shadow, a small arrow chip within the existing practice jump, and a fine connected seven-day path with centered desktop labels and explicit numbered/current/completed states.
- Preserved compact mobile tracking: visible current-day name, seven numbered/checkmarked markers and full screen-reader day/theme/state labels. Markers remain noninteractive. Large text, accepted hero proportions, voice access and existing motion persistence remain unchanged.

## Predeployment reviews

Ive and Kare advised before implementation, then reviewed six matching-candidate desktop/mobile images, the motion component/CSS, and source-bound evidence for build E3-t7kAtMd-G_DMMGVn05. Images covered 1440/1920 desktop, full pages at 390/320, and the explicitly focused motion control.

Ive returned READY with no visual must-fix. Kare initially questioned hidden visual day names on phones; after checking the unchanged accessible markup and accepted responsive scope, she corrected the verdict to READY. She confirmed the visible current-day summary, complete screen-reader labels/states and noninteractive markers provide a valid compact phone alternative. No extra phone expansion was added.

Both found the control discreet, caption clear, accepted headline/video grouping intact and finishing details restrained. Ive recommended avoiding further decorative additions; a future optional improvement could make the device-reduced-motion explanation more discoverable to touch users. Reviews were image/source-based, not agent-executed app or human audio tests.

## Verification

Production build and all eleven operator browser checks passed in 28.2s. Extended checks cover 44px target geometry, bottom/right placement and caption clearance at 1440/1920/390/320; hit testing inside the image crop; screen-reader action names; keyboard Space to resume; saved pause/reload, reduced-motion precedence and zero initial media requests; decoded looping, autoplay recovery and actual WebM fallback. Existing progress, long titles/completion, keyboard practice jump, storage failures, microphone denial and mocked-provider voice controls/transcript pass. Changed sources match tested staging after line-ending normalization.

The enabled white icon's contrast over its specified translucent dark backing is calculated at 10.72:1 even over a pure-white frame. This calculation does not certify all page contrast, disabled-state contrast or continuous playback. No new live audio test is claimed.
