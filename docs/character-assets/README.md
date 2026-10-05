# Fixed Founder Models

## Provenance and Licensing

Only the user-supplied Renderpeople Nathan and Sophia assets were used. No additional
character packs or animation libraries were downloaded. The project's MIT license
does **not** grant rights to these third-party models or their textures.

The supplied Model Catalog and Renderpoints Voucher PDFs are product/promotional
documents, not a license grant. No EULA, license certificate or redistribution
permission was included. Verify the purchaser's Renderpeople license, web-game use
and public-repository redistribution rights before release. Original FBX/C4D/Unreal
files, 8K textures and PDFs remain unchanged in the local project. They are not added
to Git; the voucher may contain redeemable information. The source manifest records
their filenames, sizes and SHA-256 hashes without publishing their contents.

## Source Inspection

- Nathan: walking FBX, plus native/Corona/Octane/V-Ray Cinema 4D variants and preview.
  The variants identify the same named Nathan product; no Cinema 4D installation is
  available, so their internal render-specific shader graphs were not inspected.
- Sophia: idle animation-only FBX plus matching Unreal package, skeleton, skeletal
  mesh, materials, physics data, animation and preview. The FBX has no geometry.
- Both: diffuse, normal, gloss and two masks at source resolution. The three runtime
  maps are 8192 x 8192 at source. Hair, clothing and body are fused into one mesh.
  Both mask01 maps and Sophia mask02 are also 8192 x 8192; Nathan mask02 is 2048 x 2048.
- Nathan: 21,501 triangles, one skinned mesh, 88 bones, one walking clip (2.267 s).
- Sophia: 16,472 triangles, one skinned mesh, 95 UE4-named bones, one idle clip
  (20.333 s from the supplied Unreal animation, 612 sampled frames).
- Detailed bone parents, rest/posed bounds and source FBX clips are in
  `model-analysis.json`. Source previews are not used as UI thumbnails.

## Conversion

Runtime GLBs embed their textures and animations and have no external resource URLs.
Each has one non-metallic opaque MeshStandardMaterial with sRGB base color, normal
map and inverted gloss as linear roughness, at 2048 x 2048. No artificial emissive or
alpha effect is added. Source mask maps are retained locally, not required by these
opaque fixed meshes. Nathan's FBX has vertices with more than four weights; Three's
FBX loader retains the strongest four and normalizes them for the browser skinning
pipeline. All 88/95 skeleton bones remain available.

Sophia's mesh and animation were exported from the supplied Unreal assets using
[UEViewer](https://github.com/gildor2/UEViewer), a conversion utility, not an asset pack.
The FBX and glTF coordinate conventions cannot be directly mixed: an initial direct
FBX track transfer visibly deformed Sophia and was discarded. The MD5 animation
export's Y mirror is reversed, then the exporter glTF Y/Z swap and centimeter-to-meter
conversion are applied. Bone names and frame component counts are checked before
conversion. This produces the correctly skinned supplied idle, not invented poses.

Reproduction, with UEViewer and Playwright installed separately:

```powershell
umodel -export -gltf -noanim -notex '-path=rp_sophia_animated_003_idling_UE4' '-out=.local/sophia-export' rp_sophia_rigged_003_ue4
umodel -export -md5 -nomesh -notex '-path=rp_sophia_animated_003_idling_UE4' '-out=.local/sophia-export' rp_sophia_animated_003_idling_ue4
# Optional when Playwright is outside node_modules:
$env:PLAYWRIGHT_MODULE = 'absolute/path/to/playwright'
node scripts/prepare-founder-models.mjs
```

Conversion serves files only on a temporary loopback server and closes the browser
and server in finally. It also renders the neutral model-selection thumbnails.

## Runtime and Persistence

The shared asset registry exports CHARACTER_MODEL_ASSETS. The ID whitelist resolves
paths centrally; the server never accepts model paths. POST requires exactly CEO name,
one model ID and one unchanged Founder Skill. PATCH allows only CEO name. GET returns
the signed-in user's identity, not legacy appearance or private account information.
Local identity is replaced by server identity after login/reload without resetting
legacy local company progress. Server-confirmed game state uses the same ID.

The additive 0003 migration maps MALE to founder_male_01; FEMALE/ambiguous legacy
presentation maps to founder_female_01, the former default. Old appearance, skills,
cosmetics, inventory and all economic progress remain untouched. The only change to
existing company JSON is the characterModelId field when playerCharacter exists.
The current runtime no longer requires migration 0003 before deployment: new fixed
IDs are stored in the existing appearance JSON, and old accounts resolve their model
from the existing presentation column. Character and verified-game queries explicitly
avoid the new column. The migration remains available for launch, but Vercel builds
do not query or mutate the database. Supabase setup can therefore wait until launch.

The models are normalized using measured rest-pose bounds to 3.2 scene units, the same
floor and center. Existing map, department and workshop rendering technology remains
unchanged. At the user's request, both founders now use a frozen supplied pose.
No idle, walking, repair, phone, interaction or celebration animations play.
Map and workshop/department actors stay at their home positions instead of sliding
without a walk animation. Repair progression and speech bubbles are unaffected.
Embedded source clips remain solely to sample the static pose; no additional
animation assets are required.

Geometry and materials are shared in a bounded two-model lazy cache; scene skeletons
and mixers are cloned per actor, never shared. Actions and mixer bindings are removed
on unmount, and each clone's skeleton texture is disposed. Canvas renderer disposal
owns its GPU allocations. Loading/error messages are independent DOM status overlays
to avoid a reproduced Drei Html/React unmount error. Models load only when selected.

## Cosmetic Compatibility and Missing Assets

No legacy character cosmetic is fitted to either supplied model. The old cosmetics
are CSS-layer tokens rather than rigged/fitted meshes. Head bones are present, but
the cap and glasses have no fitted 3D geometry, verified anchors or skin bindings.
Basic Workwear, Dark Technician, Orange Workshop Jacket, Technician Cap and Safety
Glasses remain collected/owned and cannot be equipped. The profile no longer shows
wardrobe categories or equip controls while clothing implementation is deferred.
Existing equipped IDs remain as legacy data; no clipping props are glued onto models.
Building themes and workstation cosmetics are unaffected. Clothing cannot be swapped
independently because it is part of each fixed skinned mesh. Clipboard/phone props
and procedural limb overrides are no longer attached to incompatible rigs.

Clothing, headwear and accessories are deferred to a later implementation, not a
requirement for the current milestone. Third-party license/redistribution proof
remains separate from this animation scope decision.

## Verification

Automated tests cover GLB structure, embedded maps, bones, clips, ID validation,
legacy save migration, identical gameplay for all five skills across both models,
collection retention, server POST/PATCH/GET and actual SQL migration in isolated
temporary tables. Browser QA screenshots and measurements remain in .local/qa13;
they use local disposable accounts and do not modify production accounts. Desktop
1440 x 1000 and touch-emulated mobile 390 x 844 both sustained 60 browser frames/s;
real physical-phone performance is not verified. Eight alternating model changes
stabilized at 16 WebGL textures and 16 buffers (including shadow/render targets) in
the measured preview context, with zero page errors. First-visible timing includes
loading and decoding on the local development server, not a production network SLA.

Three uncompressed 2K RGBA texture maps with full mipmaps cost approximately 64 MiB
per resident model, plus geometry, bones and renderer targets. JPEG/PNG compress the
download, not GPU texture storage. The two-model cache is bounded, not zero-memory.
The supplied topology is retained; there is no claimed mobile LOD or KTX2 compression.
