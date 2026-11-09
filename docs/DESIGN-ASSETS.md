# Design assets

## Official header logo — November 9, 2026

`em-frontend/public/images/elevated-movements-logo.png` is the official unmodified tree-and-wordmark PNG used on the [Elevated Movements homepage](https://www.elevatedmovements.com/). [Original asset](https://cdn.prod.website-files.com/67c8b63cf22ae4778cf07e92/6a203cd3f356012f0d5199f8_em-logo-tmfixed.png): 460×96 RGBA, 18,196 bytes; SHA256 `9ce01d20f6579cccbee36e2fd41a8f59e6d679a6841f1ea5b4b3a471c5f41085`.

Replaces the CSS/text imitation in the header. Original white lettering is kept legible on a small navy background; no recoloring, cropping or redrawing. The self-hosted image preserves its aspect ratio at 210px desktop, 180px phone and 156px narrow-phone width. The homepage link has an accessible name and a minimum 44px target. Existing large text, accepted hero spacing and quiet bottom-right motion control are preserved.

Ive and Kare reviewed the original asset, matching source/manifest and screenshots at 1440/1920 desktop and 390/320 phone before release; both returned READY with no must-fix. Production build and eleven operator browser checks pass (32.5s), including actual logo loading, proportions, home destination and existing layout/voice/video regressions. Their review was static image/source inspection, not agent-executed browser or human audio testing.

The user accepted the preceding quiet-control/finishing-polish revision fda5b2d. Both agents' active review checklists and project feedback were updated, and each read back transferable principles separately from project-specific palette/dimensions. Those are persisted operational instructions, not model-weight training.

Hero: `em-frontend/public/images/calm-portal.png`.

Generated with the built-in image-generation tool for this project. Served through Next Image with responsive sizing, priority loading, and meaningful alternative text. No external stock-image dependencies.

Prompt: Premium mindfulness web app landscape artwork, 3:2. Still luminous lavender water, a large sculptural frosted periwinkle glass circular portal, an apricot coral sun through its center at the horizon, layered indigo hills, pearlescent lilac-to-midnight sky, coral reflections. Contemporary editorial 3D materials and soft cinematic light, centered composition with breathing room. Midnight navy, electric periwinkle, lilac and warm coral; no green, teal, gold, people, faces, lettering, UI, logos, or watermarks.

Video: `em-frontend/public/video/portal-loop.mp4` and `.webm`, rendered from the above artwork by `scripts/render-hero-loop.py`. Ten-second silent looping cinemagraph, with actual water displacement and moving reflection highlights rather than the initial CSS zoom. Source artwork is preserved as the poster/fallback. No additional asset-service quota or third-party footage is involved.

The current stronger-motion assets are `portal-loop-v2.mp4` and `portal-loop-v2.webm`. The renderer now produces v2: larger water displacement, moving warm reflections, stronger highlights, and a mask protecting the physical portal. Versioned filenames avoid stale media caches; the original files remain for comparison.


Current assets: portal-loop-v3.mp4 (2,282,174 bytes) and portal-loop-v3.webm (3,412,318 bytes). The renderer now produces v3: perspective-scaled traveling waves and shared surface-driven reflection facets, a fixed sun reflection envelope, and feathered physical-portal masks. Independently encoded H.264/VP9, ten seconds, 960x640/25fps, silent. Earlier assets are retained for comparison. See VIRGIL-WATER-REVIEW.md.
