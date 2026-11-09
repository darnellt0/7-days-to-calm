# Ambient motion pass

The initial pass added subtle CSS motion to the generated artwork. The user then explicitly requested more noticeable movement and an actual video loop. The current hero plays a silent ten-second cinemagraph with flowing water and a moving glass reflection. The larger type and inline voice interface are preserved.

The video is rendered from this project's generated artwork using `scripts/render-hero-loop.py`; it is not stock footage or an additional AI-service generation. Its periodic source motion is encoded as H.264 MP4 with fast-start metadata and a VP9 WebM fallback, 960×640 at 25fps, with no audio track. The asset-production script is optional developer tooling, not a deployment dependency.

Pause motion / Play motion controls the video and other decoration, and saves the choice locally. System reduced motion takes precedence: no video sources are mounted or requested on an initial reduced-motion visit. Playback also pauses outside the viewport, in a hidden tab, and during a voice connection/session. The artwork stays as a fallback; it is covered only after real video playback begins. A blocked autoplay attempt offers Play video; unsupported/failed media retains the still artwork. No signing request or microphone access is triggered by the video.

Virgil advised the earlier CSS pass from a written brief. That recommendation is not a visual sign-off on this later video, and the user's request for more noticeable motion supersedes the earlier subtle-motion choice. The speaking-state halo and quiet day transition remain; scene movement is not prescribed as a breathing exercise.

Verification covers actual decoded playback/time advancement, native loop wraparound, persistent pause/reload/play, runtime reduced-motion changes, zero initial video requests under reduced motion, autoplay recovery, MP4-to-WebM recovery, failed-media poster fallback, and the existing voice/progress/accessibility/mobile checks. Voice protocol tests use a mock provider and synthetic microphone, not a new human audio test.

Live visual inspection caught the arched image clipping the corner-mounted motion control. The control is centered within the arch; the phone regression checks all four inset corners of its actual hit area.

## Stronger living-water revision

The user found the first video too subtle and requested more noticeable water and reflection movement. The v2 loop increases the wave displacement amplitudes, uses broader rolling waves and faster ripples, moves/widens the warm reflection path, and strengthens traveling highlights. A protection mask keeps the solid portal and horizon anchored. Motion must be reviewed at the actual displayed hero size; successful video playback alone does not establish perceptibility.

The app selects `portal-loop-v2.mp4` / `.webm` so a cached original cannot obscure the change. The original loop is retained for comparison. Pause, device reduced motion, offscreen/hidden-tab handling, voice-session pause and still-artwork fallback remain unchanged.
