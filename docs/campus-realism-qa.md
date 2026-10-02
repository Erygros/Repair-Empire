# Campus Detail Pass

## Scope

- Detailed parked car and company van: rounded bodywork, glazing, mirrors,
  handles, tires, rims, bumpers, lights and front plate.
- Visitor parking moved clear of the customer-office foundation.
- Framed glazing with mullions and sills; entrances have handles, thresholds
  and practical lights. Ground-floor personnel windows leave room for the door.
- Workshop standing-seam pitched roof, closed gables, skylights, gutters,
  downpipes and capped exhaust; flashing and drainage on flat roofs.
- Restrained procedural asphalt texture, instanced grass beds and branched trees.
- Locally generated reflection environment; no external HDR/model requests.
- Founder pauses for six seconds every 48 seconds, raises a phone and looks
  down. Patrol time excludes breaks, so the character resumes without a jump.
- Reduced motion suppresses walking and phone activity.

The scene remains a stylized, readable 3D game map, not a photorealistic render.
Building ownership, upgrades, saves and the separate workshop scene are unchanged.

## Verification

- TypeScript, ESLint and production build passed.
- Eight focused unit tests passed, including patrol bounds and continuity at
  phone-break boundaries across multiple cycles.
- Playwright/CDP screenshots visually inspected at 1600x1080 and 390x844;
  an additional 360x740 screenshot was captured.
- WebGL pixel checks confirmed nonblank output and moving frames at all three
  sizes. All six projected labels remained within the canvas bounds.
- Reduced-motion pixel hashes remained stable; no browser page errors.
- Selection, focus, opening the workshop, returning to the map and zoom/reset
  checked on desktop and mobile.

Screenshots are local QA artifacts in ignored `.local/map-realism-*.png`.
