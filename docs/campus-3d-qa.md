# Simplified play entry and 3D company map

## Changes

- The company home uses a real Three.js orthographic campus with six selectable
  buildings, roads, trees, parking, roofs, solar panels and a delivery van.
- Existing building IDs, levels, visual tiers and gameplay destinations are
  retained. Selecting a building shows its actual current level and benefits;
  opening it is an explicit action rather than a timed navigation.
- Compact money, reputation and company-level readouts replace redundant global
  progression headers. A persistent navigation keeps every game area reachable.
- Workshop is selected on first entry. Operational counts and repair collection
  shortcuts reflect actual state rather than invented onboarding data.
- Starter cosmetic entitlements are still granted, without a blocking reward
  modal. Genuine progression rewards retain their notices.
- With exactly one eligible workstation, accepting an order assigns it directly
  and shows progress. Multiple/no eligible stations retain the assignment dock.
- Locked workshop bays are available in station management rather than consuming
  space in the initial production scene. Mobile puts orders/progress first.
- Building expansion requirements remain available in a compact disclosure.

## Verification

- Local real-account flow: register, create founder, enter play, accept first
  repair, view progress, collect repair. Saved repair count and money increase.
- Playwright screenshots and WebGL pixel checks at 1440x960, 768x1024, 390x844
  and 320x740: nonblank 3D map, no horizontal page overflow.
- Building selection, opening research, returning to company and all ten game
  navigation destinations tested. No runtime page errors in the completed run.
- Zoom and pointer drag change rendered pixels; reset restores framing.
- Delivery van changes pixel hashes normally; reduced motion stays identical.
- Screenshots inspected on desktop, tablet and mobile. Compact mobile labels
  avoid overlaps; building meshes and persistent navigation remain selectable.
- Three unit tests verify silent starter grants, idempotency, preserving a
  pending earned reward, and normal progression reward notices.
- TypeScript, ESLint and production build pass.

Run the pure regression tests with `node --test tests/cosmetics.test.mjs`.
Screenshots are in ignored `.local/campus-qa`; production accounts and databases
were not modified. No schema migration is needed for this UI change.

The map is stylized procedural 3D. Workshop interiors retain their existing
visual renderer; this change does not add 3D interiors or server save sync.
