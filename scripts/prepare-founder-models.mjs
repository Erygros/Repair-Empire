import { createServer } from "node:http";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, extname, basename } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = process.cwd(), output = resolve(root, "public/models/founders");
await mkdir(output, { recursive: true });
const sources = { male: "rp_nathan_animated_003_walking.fbx", female: "rp_sophia_animated_003_idling_ue4.fbx" };
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname;
    if (path === "/") { res.setHeader("content-type", "text/html"); res.end('<script type="importmap">{"imports":{"three":"/three/build/three.module.js"}}</script>'); return; }
    let file;
    if (path.startsWith("/three/") && !path.includes("..")) file = resolve(root, "node_modules/three", path.slice(7));
    else if (path === "/male.fbx") file = resolve(root, sources.male);
    else if (path === "/female.fbx") file = resolve(root, sources.female);
    else if (path.startsWith("/tex/")) file = resolve(root, "tex", basename(decodeURIComponent(path)));
    else if (path.startsWith("/runtime/")) file = resolve(output, basename(path));
    else if (path.startsWith("/sophia-mesh/")) file = resolve(root, ".local/sophia-export/RP_Character/rp_sophia_rigged_003_ue4", basename(path));
    else if (path === "/female.md5anim") file = resolve(root, ".local/sophia-export/RP_Character/00_rp_master/UE4_Mannequin_Skeleton/rp_sophia_animated_003_idling_ue4.md5anim");
    if (!file) { res.writeHead(404).end(); return; }
    res.setHeader("content-type", extname(file) === ".js" ? "text/javascript" : extname(file) === ".jpg" ? "image/jpeg" : "application/octet-stream");
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const browser = await chromium.launch({ headless: false });
try {
  const page = await browser.newPage();
  page.on("console", message => { console.log(message.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const reports = [];
  for (const gender of ["male", "female"]) {
    const result = await page.evaluate(async gender => {
      const THREE = await import("/three/build/three.module.js");
      const { FBXLoader } = await import("/three/examples/jsm/loaders/FBXLoader.js");
      const { GLTFExporter } = await import("/three/examples/jsm/exporters/GLTFExporter.js");
      const failed = [];
      const manager = new THREE.LoadingManager(); manager.onError = url => failed.push(url);
      manager.setURLModifier(url => {
        if (/\.(jpg|png)$/i.test(url)) return "/tex/" + url.split(/[\\/]/).pop();
        return url;
      });
      const animationSource = await new FBXLoader(manager).loadAsync(`/${gender}.fbx`);
      const sourceClips = animationSource.animations.map(clip => ({ name: clip.name, duration: clip.duration, tracks: clip.tracks.length }));
      let root = animationSource;
      if (gender === "female") {
        const { GLTFLoader } = await import("/three/examples/jsm/loaders/GLTFLoader.js");
        root = (await new GLTFLoader().loadAsync("/sophia-mesh/rp_sophia_rigged_003_ue4.gltf")).scene;
        const targetBones = new Map(); root.traverse(item => { if (item.isBone) targetBones.set(item.name, item); });
        const md5 = await (await fetch("/female.md5anim")).text();
        const hierarchy = md5.match(/hierarchy\s*\{([^}]+)\}/)[1];
        const names = Array.from(hierarchy.matchAll(/"([^"]+)"/g), match => match[1]);
        const rate = Number(md5.match(/frameRate\s+([\d.]+)/)[1]);
        const frames = Array.from(md5.matchAll(/frame\s+\d+\s*\{([^}]+)\}/g), match => match[1].trim().split(/\s+/).map(Number));
        if (frames.some(frame => frame.length !== names.length * 6) || names.some(name => !targetBones.has(name))) throw Error("Unexpected Sophia animation layout");
        const times = frames.map((_, i) => i / rate), tracks = [];
        // Reverse UEViewer's MD5 Y mirror, then apply its glTF Y/Z swap and cm-to-m conversion.
        names.forEach((name, bone) => {
          const positions = [], rotations = [];
          for (const frame of frames) {
            const [x,y,z,qx,qy,qz] = frame.slice(bone * 6, bone * 6 + 6);
            positions.push(x * .01, z * .01, -y * .01);
            const w = Math.sqrt(Math.max(0, 1 - qx*qx - qy*qy - qz*qz));
            rotations.push(qx, qz, -qy, -w);
          }
          tracks.push(new THREE.VectorKeyframeTrack(name + ".position", times, positions), new THREE.QuaternionKeyframeTrack(name + ".quaternion", times, rotations));
        });
        root.animations = [new THREE.AnimationClip("IDLE", times.at(-1), tracks)];
      }
      await new Promise(resolve => { if (!manager.isLoading) resolve(); else { manager.onLoad = resolve; setTimeout(resolve, 1500); } });
      const materials = new Set(), meshes = [], bones = [], textures = [];
      root.traverse(item => {
        if (item.isBone) bones.push({ name: item.name, parent: item.parent?.name });
        if (!item.isMesh) return;
        meshes.push({ name: item.name, triangles: (item.geometry.index?.count ?? item.geometry.attributes.position.count) / 3, skinned: !!item.isSkinnedMesh, bones: item.skeleton?.bones.length ?? 0 });
        for (const material of [].concat(item.material)) materials.add(material);
      });
      const prefix = gender === "male" ? "rp_nathan_animated_003" : "rp_sophia_animated_003";
      const loader = new THREE.TextureLoader();
      const diffuse = await loader.loadAsync(`/tex/${prefix}_dif.jpg`);
      const normal = await loader.loadAsync(`/tex/${prefix}_norm.jpg`);
      const gloss = await loader.loadAsync(`/tex/${prefix}_gloss.jpg`);
      for (const [label, texture] of [["diffuse", diffuse], ["normal", normal], ["gloss", gloss]]) textures.push({ label, width: texture.image.width, height: texture.image.height });
      function resized(texture, invert = false) {
        const canvas = document.createElement("canvas"); canvas.width = canvas.height = 2048;
        const context = canvas.getContext("2d"); context.drawImage(texture.image, 0, 0, 2048, 2048);
        if (invert) { const pixels = context.getImageData(0, 0, 2048, 2048); for (let i = 0; i < pixels.data.length; i += 4) { const r = 255 - pixels.data[i]; pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = r; } context.putImageData(pixels, 0, 0); }
        const optimized = new THREE.CanvasTexture(canvas); optimized.userData.mimeType = "image/jpeg"; return optimized;
      }
      const baseMap = resized(diffuse); baseMap.colorSpace = THREE.SRGBColorSpace;
      const normalMap = resized(normal), roughnessMap = resized(gloss, true);
      if (gender === "female") { baseMap.flipY = false; normalMap.flipY = false; roughnessMap.flipY = false; }
      const material = new THREE.MeshStandardMaterial({ map: baseMap, normalMap, roughnessMap, roughness: 1, metalness: 0 });
      root.traverse(item => { if (item.isMesh) { item.material = material; item.castShadow = true; item.frustumCulled = false; } });
      const bounds = new THREE.Box3().setFromObject(root), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      if (!meshes.length) throw Error("Model contains no geometry");
      if (gender === "male") root.animations[0].name = "WALK";
      const clips = root.animations.map(clip => ({ name: clip.name, duration: clip.duration, tracks: clip.tracks.length }));
      // Retain the supplied rig; make root locomotion in-place for a bounded game actor.
      for (const clip of root.animations) for (const track of clip.tracks) if (track.name.endsWith(".position") && /hips|pelvis|root/i.test(track.name)) {
        for (let i = 0; i < track.values.length; i += 3) { track.values[i] = track.values[0]; track.values[i + 2] = track.values[2]; }
      }
      root.name = `founder-${gender}-01`;
      const glb = await new GLTFExporter().parseAsync(root, { binary: true, animations: root.animations, onlyVisible: true, maxTextureSize: 2048 });
      const mixer = new THREE.AnimationMixer(root); const action = mixer.clipAction(root.animations[0]); action.play(); mixer.setTime(gender === "male" ? .2 : 1);
      root.updateMatrixWorld(true);
      const posed = new THREE.Box3().setFromObject(root, true), posedSize = posed.getSize(new THREE.Vector3()), posedCenter = posed.getCenter(new THREE.Vector3());
      const wrapper = new THREE.Group(), scale = 3.2 / size.y; wrapper.scale.setScalar(scale); wrapper.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale); wrapper.add(root);
      const scene = new THREE.Scene(); scene.background = new THREE.Color("#152125"); scene.add(wrapper);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x38474c, 2));
      const key = new THREE.DirectionalLight(0xffe0c3, 3); key.position.set(4, 6, 5); scene.add(key);
      const fill = new THREE.DirectionalLight(0x9fe6df, 2); fill.position.set(-4, 3, 4); scene.add(fill);
      const camera = new THREE.PerspectiveCamera(35, 320 / 420, .1, 100); camera.position.set(0, 1.6, 6); camera.lookAt(0, 1.6, 0);
      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(320, 420); renderer.render(scene, camera);
      const preview = renderer.domElement.toDataURL("image/png").split(",")[1]; renderer.dispose(); mixer.stopAllAction();
      const bytes = new Uint8Array(glb); let binary = ""; for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
      return { data: btoa(binary), preview, report: { gender, meshes, triangles: meshes.reduce((sum, mesh) => sum + mesh.triangles, 0), materials: materials.size, runtimeMaterials: 1, bones, clips, sourceClips, textures, posedBounds: {size:posedSize.toArray(),center:posedCenter.toArray()}, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: size.toArray(), center: center.toArray() }, sourceRotation: root.rotation.toArray(), sourceScale: root.scale.toArray(), failed, runtimeBytes: bytes.length } };
    }, gender);
    await writeFile(resolve(output, `founder-${gender}-01.glb`), Buffer.from(result.data, "base64"));
    await writeFile(resolve(output, `founder-${gender}-01.png`), Buffer.from(result.preview, "base64"));
    reports.push({ source: sources[gender], ...result.report });
    console.log(JSON.stringify({ gender, triangles: result.report.triangles, materials: result.report.materials, clips: result.report.clips, bones: result.report.bones.length, textures: result.report.textures, bounds: result.report.bounds, failed: result.report.failed, runtimeBytes: result.report.runtimeBytes }));
  }
  await mkdir(resolve(root, "docs/character-assets"), { recursive: true });
  await writeFile(resolve(root, "docs/character-assets/model-analysis.json"), JSON.stringify(reports, null, 2) + "\n");
  const manifest = [];
  async function inventory(relative) {
    const absolute = resolve(root, relative), entries = await readdir(absolute, { withFileTypes: true });
    for (const entry of entries) {
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) { if (relative || ["tex", "rp_sophia_animated_003_idling_UE4"].includes(entry.name)) await inventory(path); }
      else if (relative || /^(rp_nathan|rp_sophia|Renderpeople_)/.test(entry.name)) {
        const bytes = await readFile(resolve(root, path));
        manifest.push({ path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
      }
    }
  }
  await inventory("");
  await writeFile(resolve(root, "docs/character-assets/source-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
} finally { await browser.close(); await new Promise(done => server.close(done)); }
