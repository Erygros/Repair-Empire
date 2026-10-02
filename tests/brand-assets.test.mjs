import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {runInThisContext} from "node:vm";
import ts from "typescript";
import sharp from "sharp";
const compiled=ts.transpileModule(readFileSync("src/game/data/brand-assets.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const loaded={exports:{}};runInThisContext(`(function(exports){${compiled}})`)(loaded.exports);
const {BRAND_ASSETS,ICON_SIZES}=loaded.exports;
test("all registered assets exist locally and raster exports decode",async()=>{
  for(const group of Object.values(BRAND_ASSETS))for(const value of Object.values(group)){
    assert(value.startsWith("/assets/"));const file="public"+value;assert(statSync(file).size<1000000);
    if(value.endsWith(".png")){const metadata=await sharp(file).metadata();assert.equal(metadata.format,"png");assert(metadata.hasAlpha);assert(metadata.width<=1700);assert(metadata.height<=512);}
  }
});
test("founder skills match the five existing choices only",()=>{
  assert.deepEqual(Object.keys(BRAND_ASSETS.skills),["finance","technician","researcher","manager","negotiator"]);
  assert.deepEqual(Object.values(ICON_SIZES),[16,24,32,48,64]);
});
test("favicon contains two correctly sized PNG entries",async()=>{
  const ico=readFileSync("public"+BRAND_ASSETS.brand.favicon);assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),2);
  for(let i=0;i<2;i++){const at=6+i*16,length=ico.readUInt32LE(at+8),offset=ico.readUInt32LE(at+12),meta=await sharp(ico.subarray(offset,offset+length)).metadata();assert.equal(meta.width,[16,32][i]);assert.equal(meta.height,[16,32][i]);}
});
test("app sizes are valid exports with disclosed resampling",async()=>{
  for(const size of [16,32,180,192,512]){const meta=await sharp(`public/assets/brand/icon-${size}.png`).metadata();assert.equal(meta.width,size);assert.equal(meta.height,size);}
  const inventory=JSON.parse(readFileSync("public/assets/extended-inventory.json","utf8"));assert.equal(inventory.assets.length,46);assert.deepEqual(inventory.appResamples.upscaled,[512]);
});
test("extended assets cover all sheets, retain native masters and have transparent margins",async()=>{
 const inventory=JSON.parse(readFileSync("public/assets/extended-inventory.json","utf8"));assert.deepEqual([...new Set(inventory.assets.map(a=>a.sheet))].sort(),[1,2,3]);
 for(const a of inventory.assets){const m=await sharp("public"+a.master).metadata(),ui=await sharp("public"+a.ui).metadata();assert.equal(m.width,a.masterWidth);assert.equal(m.height,a.masterHeight);assert(ui.width<=m.width&&ui.height<=m.height);if(a.category!=="brand"){assert(ui.width<=128&&ui.height<=128);assert(statSync("public"+a.ui).size<70000);}const {data}=await sharp("public"+a.ui).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert(data.some((v,i)=>i%4===3&&v===0),a.name+" transparent background");}
 assert.equal(Object.keys(BRAND_ASSETS.devices).length,7);
});
