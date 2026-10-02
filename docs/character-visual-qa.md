# Character anatomy and workwear repair

The procedural Three.js founder now has visible eyes, irises, pupils, brows,
nose, lips, ears, jaw and neck. Shoulder-rooted arm groups connect sleeves,
forearms and hands to the torso. Workwear includes an orange default jacket,
pockets, collar, zipper, belt, trousers, knee pads and boots with soles/laces.
Existing appearance data stays compatible; no database migration is required.
The creator saves the cosmetic outfit corresponding to the chosen 3D outfit.

The Canvas wrapper is no longer affected by the toolbar positioning rule.
Camera framing responds to the viewport and reset control. Reduced-motion
preferences are observed live and stop idle movement.

## Verification

- TypeScript, ESLint and production build pass.
- Local authenticated creator tested at 1440x1000, 768x1024 and 390x844.
- Screenshots inspected; canvas pixel reads confirm nonblank rendered geometry
  on desktop, tablet and mobile, with no horizontal page overflow.
- Blue eyes, wide nose, soft mouth and long hair visibly change the model.
- Height 100 and shoulders 0/100 checked; arms remain attached.
- Both presentation choices and orange reset default checked.
- Pointer drag changes the view; reset restores the frontal framing.
- Pixel hashes change during idle motion and remain identical under reduced
  motion. No browser runtime errors observed.

This remains a stylized procedural avatar, not a photorealistic human model.
No production account was created or changed by these visual tests.
