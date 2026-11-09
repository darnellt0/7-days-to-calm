# Virgil water and reflection review - November 8, 2026

Requested by the user: natural, realistic water and reflections while retaining noticeable movement.

Virgil received the existing loop, labeled hero-sized frame sequences, short-interval motion samples, renderer source, seam frames and measurements. Three reviews covered v2, the first v3 candidate, and tuned final v3. This was a real frame/source review through the user's design agent. His tools did not provide continuous-video playback. No continuous-playback sign-off or user acceptance is claimed.

## Applied findings

- Replaced synchronized row distortion with four perspective-scaled traveling waves of unequal speeds and strengths.
- Shared surface normals drive water distortion and reflection facets, replacing independent moving light curtains.
- Fixed the reflection envelope beneath the sun and removed the orbiting glass glint.
- Traced feathered masks protect physical portal feet while nearby reflected water moves.
- Increased wave travel after the first v3 candidate became too quiet; distortion remains capped at 24px horizontal and 4.5px vertical.
- Both formats receive identical raw frames, independently encoded at H.264 CRF18 / VP9 CRF26. The middle cycle of three supplies normal encoder context at both delivered edges.

## Final scoped verdict

Virgil: "Suitable for full-speed acceptance testing; no demonstrated spatial must-fix in the supplied frames." He observed changing foreground contours, apparently anchored portal/sun/horizon, reflection beneath the sun and finer distant ripples. Some corrugated contours remain as residual stylization. He explicitly did not certify subjective liveliness or an invisible encoded seam.

## Verification and limits

Both formats decode 250 frames at 25fps, with a ten-second period and no audio. Raw endpoints match exactly. Raw water change at the wrap is 1.318 versus representative ordinary changes around 1.325 on a 0-255 scale. At 550x367 review size: MP4 mean adjacent water change 1.545, seam 2.326; WebM mean 1.338, seam 1.975. Encoded boundary texture remains somewhat higher than ordinary frame changes. These diagnostics are not perceptual acceptance scores.

Production build and all ten operator-run browser regressions pass: decoded playback, native loop wraparound, persistent pause, runtime/initial reduced motion, blocked autoplay recovery, actual WebM fallback, failed-media poster, progress, keyboard and mocked-provider voice flow. No new human audio test is claimed. Full-speed subjective judgment of naturalism and boundary visibility remains the user's acceptance step.
