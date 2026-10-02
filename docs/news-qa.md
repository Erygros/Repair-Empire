# News visual rework (Prompt 11.4)

## Scope

Only news presentation and route metadata changed. Public shell, account service,
authentication, game systems, database and news records are unchanged.

The first featured published item is highlighted, falling back to the latest
published item. The complete archive includes that item. Filters derive from
actual published categories; no placeholder news or pagination is introduced.
An empty archive renders a publication empty state and omits the feature.

## Artwork

Existing original Repair Empire WebP illustrations are reused, without new asset
generation. The known imageAssetId map.campus.prototype resolves to website-campus.
Development uses campus art, Prototype workshop art, Milestone expanded-workshop
art; other categories fall back to research art. The hero uses repair-campus-art.
Images have responsive sizes, fixed aspect ratios and descriptive alternative
text. Below-fold images are lazy loaded.

## Verification

- Category filters: All, Development, Prototype and Milestone; correct counts.
- Keyboard activation, visible focus, featured link and article back navigation.
- All three existing article routes return 200; unknown article returns 404.
- Screenshots inspected at desktop, tablet and mobile sizes. No horizontal
  overflow at widths 1440, 768, 390 and 320; grid changes from 3 to 2 to 1 columns.
- Existing art loads successfully after scrolling to lazy images.
- Hover feedback verified; reduced motion leaves no running animations or
  hidden reveal sections.
- Axe WCAG 2 A/AA: zero violations on overview and detail. Image-overlay contrast
  requires manual review (axe incomplete); inspected visually.
- Local warm-cache development measurement: CLS 0. This is not a production
  performance benchmark.
- TypeScript, ESLint and production build pass.

No observed layout or asset defects remain. Article texts intentionally retain
their existing short content. The empty state was inspected in source, not
tested by replacing production records.
