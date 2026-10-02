# Prompt 11.1 verification

Verified in Chromium using agent-browser on 2026-10-02.

- Desktop 1440 x 960: hero screenshot inspected; image loaded and headline, scene and CTAs visible.
- Laptop 1366 x 768: no horizontal overflow; hero height approximately 610px.
- Tablet 768 x 1024: full-page screenshot inspected; no horizontal overflow.
- Mobile 390 x 844: hero and repair-scene screenshots inspected; no horizontal overflow.
- Narrow mobile 320 x 740: no overflow, mobile menu opens and exposes navigation.
- Signed-out CTAs: registration and login destinations verified.
- Signed-in CTAs: mocked Better Auth session response changes both CTAs to /play and shows account access. No real database login was exercised.
- Public route HTTP checks: /news, /news/company-campus-2, /events, /login and /register return 200; /account redirects to login without a session. /play retains the existing development preview behavior.
- Repair presentation cycles through diagnosis, repair, testing and completion; the other workstation runs offset phases, and the third remains idle. This is presentation only.
- Reduced motion: zero active animations and zero hidden reveal sections.
- Scroll state and reveal observer verified; no player-count text.
- axe WCAG 2 A/AA: zero violations after scene-label corrections. Image-background contrast requires manual review; screenshots inspected for legibility.
- Animation-frame sample with reduced motion: 60 frames in 985ms (approximately 61fps). This is a local responsiveness sample, not a cross-device performance benchmark.
- TypeScript and production build passed. Repository lint passed with the three pre-existing location-navigation warnings in auth, logout and character creation.

The PostgreSQL authentication backend, character creator, game rules, company map engine and data models were not modified by this website rework.
