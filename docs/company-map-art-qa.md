# Company Map Art Rework (Prompt 11.5)

## Follow-Up: Labels, Street Founder And Lamps

- Fixed the icon-hidden grid column that forced building names into 13px.
  Labels now size to content and clamp their full bounds inside the map.
- Company heading wraps within a constrained width; ResizeObserver keeps
  mobile camera controls clear of multiline titles.
- Removed the pale pavement strip and intersecting internal walkway strips.
- Founder patrols the front road from x=-9 to x=9, turns at both ends and
  swings arms and legs about the correct joints. Reduced motion pauses it.
- Lamps have warm point lights, brighter emissive fixtures and soft light pools.
- Five unit regressions pass, including road bounds and continuous turns.
- Playwright checks text bounds for all six badges, hover/selection, long
  company names and desktop/tablet/390px/360px layouts. Canvas pixels verify
  visible rendering, active movement and stability with reduced motion.

The initial milestone's static Founder and demand-only rendering described
below have been superseded by this requested walking animation.

## Scope

Existing R3F Canvas, orthographic camera, OrbitControls, plot coordinates,
building definitions and progression are retained. No gameplay, authentication,
database, creator or save changes. The existing Avatar is exported for reuse.

Buildings use distinct metal/concrete/glass silhouettes. Workshop tiers add an
extended annex, third service gate, upper office and high-end roof glazing.
Vehicles are static. Demand rendering avoids continuous idle frames; mobile
uses DPR 1, 1024px shadows and fewer ground props. No traffic simulation.

## Verified Locally

- Playwright via an isolated agent-browser session at localhost:3000/play.
- Local QA account and save only; no production account or DB changes.
- Desktop 1440x1000, tablet 820x1180, phones 390x844 and 360x740.
- Six visible labels; hover reveals level, status and real upgrade eligibility.
- All six labels and actual 3D building meshes select the correct building.
- Context panel absent initially; selection, close and building navigation work.
- All six building interiors return to the company map.
- Zoom, right-drag pan, focus and camera reset change the rendered view.
- Existing Founder appears at the entrance; clicking its mesh opens the profile.
- Real paid workshop upgrade to level/tier 2; persisted tier 3-5 QA fixtures
  survive reload and visibly alter the building. Fixtures restored afterward.
- Mobile selection focuses the building; contextual bottom sheet replaces the
  permanent dashboard, hides other labels and leaves the map accessible.
- Canvas readPixels confirms non-background content; zoom/pan alter pixel hashes.
- No horizontal overflow or browser runtime exceptions in the complete flow.
- TypeScript, ESLint, production build and three cosmetics regressions pass.

Screenshots generated in ignored .local/campus-p115-qa. QA scripts reside in
the Windows temporary directory, not in the application bundle.

## Limitations

Architecture is deliberately stylized procedural geometry, not photorealistic.
The full landscape campus appears small in portrait overview; selection zoom
and existing camera controls provide detailed inspection. Extreme manual camera
angles can occlude buildings. Mobile performance was emulated, not measured on
physical low-end hardware.
