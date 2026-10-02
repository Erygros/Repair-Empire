# Founder, Interiors and Workshop Audio

## Implemented

- Tools, team, customers, research, finance, challenges and upgrades each have
  an individually furnished 3D room. Existing purchases, contracts, hiring,
  research and rewards remain in the adjacent control surface.
- The saved Founder is present in each room, patrols between three positions,
  reads a clipboard and occasionally speaks. Research equipment animates;
  hired technicians appear in the personnel room. Camera zoom/reset and
  rotation/panning are available. Reduced-motion settings are respected.
- The creator and profile use the same editor component: presentation, name,
  nine body sliders and ten appearance selections. The profile keeps the
  permanent Founder Skill read-only, previews edits and saves explicitly.
- Profile saves update the authenticated account's character and CEO name.
  Local gameplay state is updated only after API success; identity, skill,
  creation time and equipped accessories are retained.
- Hats and safety glasses render on the Founder in the profile, campus,
  workshop and department rooms. Equipped outfits are reflected consistently.
- Unsaved edits are guarded on navigation and browser unload.
- Procedural Web Audio layers filtered ventilation noise, motor hum and soft
  occasional metallic taps. No external audio downloads or licenses are needed.
  It starts only in the workshop, stops immediately on leaving, and is disposed
  on hidden-document events. Returning creates a fresh context. Master,
  ambience and mute settings are honored; autoplay restrictions are handled
  with pointer/keyboard activation.

## Verification

- Production build, TypeScript and ESLint passed.
- Eleven focused unit tests passed: department patrol/speech, model preservation,
  audio volume/disposal, campus walking, workshop progress and cosmetics.
- The local PostgreSQL integration suite passed all 28 tests, including new
  authenticated profile edits, invalid appearance bounds, foreign origins,
  anonymous requests and attempts to change Founder Skill.
- Playwright screenshots covered all seven rooms at desktop and 390px mobile.
  WebGL pixel checks confirmed visible, moving scenes; reduced-motion hashes
  remained stable. No page errors or document-width overflow occurred.
- Additional 360px checks covered every room and the complete profile.
- The profile exposed nine sliders and ten selects. Name, nose and eye-color
  edits saved with HTTP 200 and survived reload.
- A simulated HTTP 503 showed an error, left the saved character unchanged and
  permitted retry. Cancelling the unsaved-edit confirmation kept the editor open.
- Real browser audio contexts were running only in the workshop and closed
  after leaving or muting. Re-entry/unmute created fresh contexts, without
  retaining running ambience contexts outside the workshop.
- Hidden/visible lifecycle callbacks were tested using simulated visibility
  events because headless Chromium kept its document visible across tabs.

Local screenshots are ignored artifacts in `.local/interior-*.png`.
These checks do not claim photorealism, exhaustive device compatibility, or
subjective audio-quality verification on physical speakers.
