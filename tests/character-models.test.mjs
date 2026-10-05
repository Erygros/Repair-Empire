import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadGameModule } from "./helpers/game-loader.mjs";
const { CHARACTER_MODELS, CHARACTER_MODEL_IDS, resolveCharacterModel, resolveStoredCharacterModel, isCharacterModelId } = loadGameModule("src/game/data/character-models.ts");
const { migrateSave } = loadGameModule("src/game/logic/save.ts");
const { createInitialState } = loadGameModule("src/game/logic/game.ts");
const { equipCosmetic, createPlayerCharacter } = loadGameModule("src/game/logic/cosmetics.ts");
const { COSMETICS, DEFAULT_APPEARANCE } = loadGameModule("src/game/data/cosmetics.ts");
const { applyGameAction } = loadGameModule("src/game/logic/actions.ts");
test("existing databases resolve fixed founders without the new model column", () => {
  assert.equal(resolveStoredCharacterModel({ presentation: "MALE", appearance: { height: 99 } }), "founder_male_01");
  assert.equal(resolveStoredCharacterModel({ presentation: "FEMALE", appearance: {} }), "founder_female_01");
  assert.equal(resolveStoredCharacterModel({ presentation: "MALE", appearance: { characterModelId: "founder_female_01" } }), "founder_female_01");
  assert.equal(resolveStoredCharacterModel({ presentation: "MALE", appearance: { characterModelId: "/old.glb" } }), "founder_male_01");
  for (const path of ["src/app/api/character/route.ts", "src/lib/verified-game.ts"]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /characters\.characterModelId|tx\.select\(\)\.from\(characters\)/);
  }
  assert.equal(JSON.parse(readFileSync("package.json", "utf8")).scripts.build, "next build");
});

test("character profile has no legacy wardrobe or appearance controls", () => {
  const source = readFileSync("src/components/character-profile.tsx", "utf8");
  assert.doesNotMatch(source, /COSMETICS|onEquip|onUnequip|type="range"|WardrobeIcon/);
  assert.match(source, /Character3D modelId=\{modelId\}/);
});

function imageSize(data,mime) {
  if(mime==="image/png")return[data.readUInt32BE(16),data.readUInt32BE(20)];
  assert.equal(data.readUInt16BE(0),0xffd8);
  for(let offset=2;offset<data.length;) {
    assert.equal(data[offset++],0xff);while(data[offset]===0xff)offset++;
    const marker=data[offset++],length=data.readUInt16BE(offset);
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return[data.readUInt16BE(offset+5),data.readUInt16BE(offset+3)];
    offset+=length;
  }
  throw Error("JPEG dimensions missing");
}

test("both local GLBs retain geometry, independent rigs, embedded 2K materials and supplied clips", () => {
  const analysis = JSON.parse(readFileSync("docs/character-assets/model-analysis.json"));
  for (const [i,id] of CHARACTER_MODEL_IDS.entries()) {
    const model = CHARACTER_MODELS[id], bytes = readFileSync("public" + model.path);
    assert.equal(bytes.toString("ascii",0,4),"glTF"); assert.equal(bytes.readUInt32LE(4),2); assert.equal(bytes.readUInt32LE(8),bytes.length);
    const gltf = JSON.parse(bytes.toString("utf8",20,20+bytes.readUInt32LE(12)));
    assert.equal(gltf.meshes.length,1); assert.equal(gltf.materials.length,1); assert.equal(gltf.skins[0].joints.length,i?95:88);
    assert.deepEqual(gltf.animations.map(clip=>clip.name),[i?"IDLE":"WALK"]);
    const primitive=gltf.meshes[0].primitives[0];
    assert.equal(gltf.accessors[primitive.indices??primitive.attributes.POSITION].count/3,i?16472:21501);
    assert.ok(gltf.meshes[0].primitives[0].attributes.JOINTS_0!==undefined);
    assert.ok(gltf.meshes[0].primitives[0].attributes.WEIGHTS_0!==undefined);
    assert.ok(gltf.images.every(image=>image.bufferView!==undefined && !image.uri));
    assert.ok(gltf.buffers.every(buffer=>!buffer.uri));
    assert.equal(gltf.materials[0].pbrMetallicRoughness.metallicFactor,0);
    assert.equal(gltf.materials[0].alphaMode??"OPAQUE","OPAQUE");
    for(const image of gltf.images) {
      const view=gltf.bufferViews[image.bufferView], binOffset=20+bytes.readUInt32LE(12)+8;
      const data=bytes.subarray(binOffset+(view.byteOffset??0),binOffset+(view.byteOffset??0)+view.byteLength);
      assert.deepEqual(imageSize(data,image.mimeType),[2048,2048]);
    }
    assert.equal(analysis[i].triangles,i?16472:21501);assert.equal(analysis[i].failed.length,0);
    assert.ok(model.height>0);assert.equal(3.2/model.height*model.height,3.2);
    assert.ok(readFileSync("public"+model.thumbnail).length>1000);
  }
});

test("model IDs are a fixed whitelist, not arbitrary paths",()=>{
  for(const invalid of ["/models/founders/founder-male-01.glb","__proto__","constructor",null,{},"MALE"]) assert.equal(isCharacterModelId(invalid),false);
  assert.equal(resolveCharacterModel({model3d:{presentation:"MALE"}}),"founder_male_01");
  assert.equal(resolveCharacterModel({model3d:{presentation:"FEMALE"}}),"founder_female_01");
  assert.equal(resolveCharacterModel(null),"founder_female_01");
});

test("legacy migration preserves appearance, founder identity, skill, inventory and company progress",()=>{
  for(const presentation of ["MALE","FEMALE",undefined]) {
    const before=createInitialState(); before.money=23456;
    before.playerCharacter={...createPlayerCharacter("Legacy CEO",DEFAULT_APPEARANCE,"outfit-orange-jacket",1),founderSkill:"MANAGER",model3d:{presentation,height:92,nose:"WIDE"}};
    const original=structuredClone(before), migrated=migrateSave(before);
    assert.equal(migrated.playerCharacter.characterModelId,presentation==="MALE"?"founder_male_01":"founder_female_01");
    assert.deepEqual(migrated.playerCharacter.model3d,before.playerCharacter.model3d);
    assert.deepEqual(migrated.playerCharacter.appearance,before.playerCharacter.appearance);
    assert.deepEqual(migrated.playerCharacter.equippedCosmetics,before.playerCharacter.equippedCosmetics);
    assert.equal(migrated.money,before.money);assert.deepEqual(migrated.lifetimeStats,before.lifetimeStats);
    assert.deepEqual(before,original);assert.equal(migrated.playerCharacter.founderSkill,"MANAGER");
  }
});

test("all existing character cosmetics remain owned but cannot be fitted to either fixed mesh",()=>{
  for(const characterModelId of CHARACTER_MODEL_IDS) for(const cosmetic of COSMETICS.filter(item=>item.equipSlot)) {
    const state=createInitialState();state.playerCharacter={...createPlayerCharacter("Test",DEFAULT_APPEARANCE,"outfit-basic-workwear",1),characterModelId};
    state.cosmeticEntitlements=[{cosmeticId:cosmetic.cosmeticId,grantedAt:1,sourceType:"DEFAULT",authority:"LOCAL_DEVELOPMENT"}];
    const before=structuredClone(state),result=equipCosmetic(state,cosmetic.cosmeticId);
    assert.match(result.error,/nicht kompatibel/);assert.deepEqual(result.state,before);
  }
});

test("both models produce identical gameplay for each of the five unchanged founder skills",()=>{
  for(const founderSkill of ["FINANCE","TECHNICIAN","RESEARCHER","MANAGER","NEGOTIATOR"]) {
    const base=createInitialState(), result=[];
    for(const characterModelId of CHARACTER_MODEL_IDS) {
      const state=structuredClone(base);state.playerCharacter={...createPlayerCharacter("Test",DEFAULT_APPEARANCE,"outfit-basic-workwear",1),characterModelId,founderSkill};
      const next=applyGameAction(state,{type:"assignOrder",orderId:state.availableOrders[0].id,workstationId:state.workstations[0].id},base.lastActiveAt);
      assert.ok(next.state.workstations[0].activeRepair);
      delete next.state.playerCharacter;result.push(next);
    }
    assert.deepEqual(result[0],result[1]);
  }
});
