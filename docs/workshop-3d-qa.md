# Animated Workshop Interior

The CSS workshop illustration is replaced by an R3F/Three.js industrial
cutaway hall matching the company campus. Existing repair timing, payments,
employees, automation, building expansion, station management and saves remain
unchanged. The existing Founder Avatar and appearance data are reused.

## Behavior

- Four physical work areas: diagnosis, repair, function test, final inspection.
- At 0/25/50/75 percent the Founder targets successive areas; at 100 percent
  the Founder returns to the left waiting point. Walking swings limbs; working
  animates arms. Employee-handled jobs display a separate dark-workwear actor.
- Device geometry follows the actual order and moves with its work phase.
- Exhaust fans rotate, fixtures illuminate surfaces, and completion lights
  turn green. Reduced motion snaps to work positions and stops ambient motion.
- Idle bubbles start after 12 seconds, last 5 seconds and recur every 28 seconds
  with rotating lines. Active work hides them. Pending completed repairs use
  a collection reminder rather than an idle complaint.
- Unlocked station selectors and clickable 3D workbenches use existing station
  callbacks. Locked stations remain in existing management and purchase UI.

## Local Verification

Playwright in an isolated local QA session, not the production database:

- Desktop 1600x1080, tablet 820x1180, mobile 390x844 and 360x740.
- Canvas readPixels confirms visible 3D content and animated pixel changes.
- Idle bubble appears, stays in bounds and disappears; absent during repair.
- Real order acceptance, material deduction and early-claim prevention.
- Local repair fixtures at 10/30/55/80/100 percent show all four areas and
  Founder waiting on completion. Original local baseline restored afterward.
- Real completed repair collection remains functional and credits its reward.
- Reduced motion produces stable canvas pixels.
- Responsive canvas, no horizontal overflow, camera controls and management.
- Four unlocked workstations render together; direct clicks on all four 3D
  workbenches select the correct station. Station tabs and map return work.
- No browser runtime exceptions. Seven unit regressions pass, including exact
  quarter boundaries, idle timing, campus movement and cosmetics.
- TypeScript, ESLint and production build pass.

Screenshots: ignored .local/workshop-3d-qa. Temporary Playwright script is outside
the repo. Mobile checks are browser emulation, not physical-device benchmarks.
