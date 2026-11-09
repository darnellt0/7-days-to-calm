# Headline/video spacing — November 9, 2026

The user supplied a desktop screenshot clarifying that excessive whitespace meant the horizontal distance between the headline and video. The preceding practice-card adjustments did not resolve this specific concern.

The former equal-column grid combined a 420px video cap with right alignment. This created unused space inside the second column in addition to the grid gap. The correction uses .8fr/1.2fr columns with a 32px gap and lets the video fill its column at its native 3:2 aspect ratio. The headline size, mobile stacking, video content and practice area remain intact. The larger scene fills unused horizontal space rather than moving that empty space elsewhere.

Production build and all eleven operator browser checks passed (27.4s). The layout check now measures the visible headline text via a DOM range, rather than the full heading block, and requires a 24–96px text-to-video gap at both 1440px and 1920px desktop widths. Existing narrow-phone overflow, keyboard guide access, progress, mocked voice, media playback/fallback and reduced-motion checks pass.

Before deployment, Ive and Kare each reviewed both desktop screenshots, full mobile pages at 390/320px, CSS and a candidate evidence manifest identifying build zWfm8hqQNnIg3OzJOxiH3 with source/image digests. Both returned READY with no must-fix issues. They found the headline/video to form a coherent composition, an intact scene crop, a prominent practice jump and readable mobile stacking. These are screenshot/source design reviews; browser tests were operator-executed, and no new human audio test is claimed.

Project lesson: identify the exact region and direction of reported whitespace before changing layout. Evaluate the visible content gap, including unused space within grid tracks and capped/right-aligned media, rather than relying on the CSS gap value alone.
