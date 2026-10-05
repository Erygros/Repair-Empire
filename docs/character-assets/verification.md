# Founder Rework Verification

Local PostgreSQL and browser QA, 2026-10-05. No production data was changed.

## Coverage

- 58 automated tests pass across the full existing and new test suites.
- Dedicated disposable accounts: both models x all five unchanged Founder Skills.
- Real authenticated POST/PATCH/GET, immutable model and skill, unknown IDs, paths,
  old appearance/color fields, multiple/missing skills, CSRF and duplicate creation.
- Actual additive SQL migration executed on isolated temporary tables, preserving
  complete economic/company JSON and legacy appearance for male/female/unknown cases.
- GLB geometry, weights, embedded JPEG/PNG dimensions, materials, bones and animations.
- Every existing character cosmetic remains owned and rejects incompatible equipment.
- Existing auth, account settings, ranking, economy, ambience and repair timing tests.

## Visible Browser Checks

Chromium, desktop 1440 x 1000 and touch-emulated mobile 390 x 844, both models:

- Neutral model thumbnails and fully visible body/shoes; no sliders or selects.
- Every Founder Skill, exactly one active skill, creation-button validity.
- Mouse rotation/wheel zoom, touch drag/pinch zoom, reset and bounded framing.
- Sophia idle visibly changes pixels; Nathan idle stays a supplied frozen pose.
- Repeated model selection, profile, workshop and map route changes.
- Correct server model after reload, local ID tampering, logout/login and empty storage.
  Starter collection is restored after empty storage. Dev save import restores progress
  without replacing the permanent account model, name, skill or character ID.
- Inventory reachable, disabled incompatible cosmetics and permanent model identity.
- Canvas pixel checks are nonblank and no horizontal page overflow occurs.
- Eight alternating model selections stabilize at 16 textures / 16 buffers in the
  preview's WebGL context, including render/shadow targets; no monotonically growing
  allocations. Models and materials share a bounded two-model cache.
  Route switches explicitly release the previous canvas contexts (context-lost events);
  only the currently visible scene retains an active WebGL context.
- 60 browser frames/s in all four preview cases. This is local Chromium measurement,
  not validation on physical mobile hardware.
- First visible model: male desktop 1481 ms, female desktop 1112 ms, male touch-mobile
  793 ms, female touch-mobile 833 ms in the measured local development run.
- No page errors in normal workflows. Delayed GLB loading shows a dark status overlay;
  a deliberately injected GLB 404 shows the model error without crashing the page,
  and switching back recovers. The expected missing-asset diagnostic is logged.
- Mobile camera distance is increased for short stages so reset does not cover shoes.

Screenshots and raw measurement JSON remain in .local/qa13, not public runtime assets.

## Build and Deployment

TypeScript, ESLint, production build and 41 real local production-mode tests pass.
Missing auth configuration and disconnected DB still fail closed with sanitized 503.
The Vercel preflight is read-only: migrated schema passes, missing configuration fails
with migration guidance and no credentials exposed. Production migration has not
been applied by this task. Apply npm run db:migrate with the intended deployment
DATABASE_URL, then redeploy. Until then the guard blocks publishing this revision.

License/redistribution evidence, native C4D shader inspection and real-phone QA remain
unverified. Missing idle/walk/interaction/work/celebration and fitted cosmetic assets
are documented in README.md; no procedural replacements are claimed as supplied clips.

## Changed Files

```text
docs/account-service.md
docs/character-assets/README.md
docs/character-assets/model-analysis.json
docs/character-assets/source-manifest.json
docs/character-assets/verification.md
drizzle/0003_demonic_iron_man.sql
drizzle/meta/0003_snapshot.json
drizzle/meta/_journal.json
package.json
public/models/founders/founder-female-01.glb
public/models/founders/founder-female-01.png
public/models/founders/founder-male-01.glb
public/models/founders/founder-male-01.png
scripts/check-character-schema.mjs
scripts/prepare-founder-models.mjs
src/app/api/character/route.ts
src/components/campus-art.tsx
src/components/character-3d.tsx
src/components/character-creator-3d.tsx
src/components/character-creator.tsx (removed unused legacy creator)
src/components/character-profile.tsx
src/components/cosmetic-unlock.tsx
src/components/founder-appearance.ts
src/components/founder-editor.css
src/components/founder-editor.tsx
src/components/founder-model-3d.tsx
src/components/workshop-floor-3d.tsx
src/db/schema.ts
src/game/data/asset-registry.ts
src/game/data/character-models.ts
src/game/logic/cosmetics.ts
src/game/logic/founder-model.ts
src/game/logic/save.ts
src/game/state/use-game.ts
src/game/types.ts
src/lib/verified-game.ts
tests/auth.integration.mjs
tests/character-models.integration.mjs
tests/character-models.test.mjs
tests/cosmetics.test.mjs
tests/leaderboard.integration.mjs
tests/run-auth-production.mjs
```
