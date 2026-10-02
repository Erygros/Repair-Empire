import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInThisContext} from "node:vm";
import ts from "typescript";
function load(path){const compiled=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const loaded={exports:{}};runInThisContext(`(function(exports){${compiled}})`)(loaded.exports);return loaded.exports;}
const {getDepartmentActivity}=load("src/components/department-animation.ts");
const {updateFounderModel}=load("src/game/logic/founder-model.ts");
const {createWorkshopAmbience,getWorkshopAmbienceVolume}=load("src/game/audio/workshop-ambience.ts");
test("all departments have bounded patrols and occasional, rotating speech",()=>{
  for(const d of ["tools","team","customers","research","economy","challenges","upgrades"]){
    assert.equal(getDepartmentActivity(0,d).speech,null);assert(getDepartmentActivity(8,d).speech);assert.equal(getDepartmentActivity(13,d).speech,null);
    assert.notEqual(getDepartmentActivity(8,d).speech,getDepartmentActivity(44,d).speech);
    for(let t=0;t<150;t++)assert(Math.abs(getDepartmentActivity(t,d).targetX)<=2.4);
  }
});
test("full model updates retain identity, permanent skill, accessories and original save",()=>{
 const character={characterId:"a",displayName:"Old",createdAt:1,founderSkill:"TECHNICIAN",appearance:{},equippedCosmetics:{OUTFIT:"old",HEADWEAR:"cap",ACCESSORY:"glasses"}};
 const model={height:80,skinTone:"PORCELAIN",eyeShape:"FOCUSED",hair:"LONG",hairColor:"COPPER",outfit:"ORANGE",nose:"WIDE",build:60};
 const next=updateFounderModel(character," New CEO ",model);
 assert.equal(next.displayName,"New CEO");assert.equal(next.founderSkill,"TECHNICIAN");assert.equal(next.characterId,"a");assert.equal(next.createdAt,1);
 assert.equal(next.appearance.skinTone,"LIGHT");assert.equal(next.appearance.bodyPreset,"TALL");assert.equal(next.equippedCosmetics.HEADWEAR,"cap");assert.equal(next.equippedCosmetics.ACCESSORY,"glasses");
 assert.equal(next.model3d.nose,"WIDE");assert.notEqual(next.model3d,model);assert.equal(character.displayName,"Old");
});
test("workshop ambience owns and stops every source, and is independently volume controlled",()=>{
 const settings={master:.7,ambience:.25,muted:false};
 assert.equal(getWorkshopAmbienceVolume(settings,false),0);assert.equal(getWorkshopAmbienceVolume({...settings,muted:true},true),0);assert.equal(getWorkshopAmbienceVolume({...settings,ambience:0},true),0);
 const nodes=[],param=()=>({value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>{const n={gain:param(),frequency:param(),Q:param(),connect(){return this;},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;}};nodes.push(n);return n;};
 const context={sampleRate:100,currentTime:0,state:"suspended",destination:{},createGain:node,createBiquadFilter:node,createOscillator:node,createBufferSource:node,createBuffer:()=>({getChannelData:()=>new Float32Array(300)}),resume(){this.state="running";return Promise.resolve();},close(){this.state="closed";this.closed=(this.closed??0)+1;return Promise.resolve();}};
 const room=createWorkshopAmbience(context,settings);room.resume();assert.equal(context.state,"running");assert.equal(nodes.filter(n=>n.started).length,3);
 room.update({...settings,muted:true});assert.equal(nodes[0].gain.value,0);
 room.dispose();room.dispose();assert.equal(context.closed,1);assert.equal(context.state,"closed");for(const n of nodes){assert(n.disconnected);if(n.started)assert(n.stopped);}
});
