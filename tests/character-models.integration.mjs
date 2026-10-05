import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import nextEnv from "@next/env";
import postgres from "postgres";
nextEnv.loadEnvConfig(process.cwd());
const base=process.env.BETTER_AUTH_URL, target=new URL(process.env.DATABASE_URL??"http://invalid");
if(!["localhost","127.0.0.1"].includes(target.hostname)||target.pathname!=="/repair_empire"||process.env.VERCEL)throw Error("Dedicated local database required");
const db=postgres(process.env.DATABASE_URL,{max:1}),suffix=randomBytes(5).toString("hex"),ids=[];
let counter=0;
async function request(path,body,cookie,method) {
  const response=await fetch(base+path,{method:method??(body?"POST":"GET"),headers:{origin:base,"content-type":"application/json","x-forwarded-for":`198.19.${parseInt(suffix.slice(0,2),16)}.${++counter%250+1}`,...cookie?{cookie}:{}},body:body?JSON.stringify(body):undefined});
  return {status:response.status,json:await response.json(),cookie:response.headers.getSetCookie().map(item=>item.split(";")[0]).join("; ")};
}
test("both fixed identities support all skills, reject legacy requests and survive server login/reload",async()=>{
  try {
    for(const characterModelId of ["founder_male_01","founder_female_01"])for(const founderSkill of ["FINANCE","TECHNICIAN","RESEARCHER","MANAGER","NEGOTIATOR"]) {
      const username=`qamodel_${suffix}_${ids.length}`,email=username+"@example.test",password=randomBytes(20).toString("base64url");
      const registered=await request("/api/auth/sign-up/email",{username,email,emailConfirm:email,password,passwordConfirm:password,ceoName:"Model CEO",name:"Model CEO",terms:true});
      assert.equal(registered.status,200);const [user]=await db`select id from "user" where email=${email}`;ids.push(user.id);
      const body={ceoName:"Model CEO",characterModelId,founderSkill},cookie=registered.cookie;
      for(const invalid of [{...body,characterModelId:"/evil.glb"},{...body,appearance:{height:80}},{...body,hairColor:"BLACK"},{...body,founderSkill:[founderSkill]},{...body,founderSkill:undefined}])assert.equal((await request("/api/character",invalid,cookie)).status,400);
      const created=await request("/api/character",body,cookie);assert.equal(created.status,200);
      assert.equal(created.json.gameState.playerCharacter.characterModelId,characterModelId);
      const [character]=await db`select * from character where account_id=${user.id}`;
      assert.equal(character.founder_skill,founderSkill);assert.deepEqual(character.appearance,{characterModelId});
      const [company]=await db`select game_state from company where account_id=${user.id}`;
      assert.equal(company.game_state.playerCharacter.characterModelId,characterModelId);
      assert.equal((await request("/api/character",{ceoName:"Changed",characterModelId:characterModelId==="founder_male_01"?"founder_female_01":"founder_male_01"},cookie,"PATCH")).status,400);
      assert.equal((await request("/api/character",{ceoName:"Changed"},cookie,"PATCH")).status,200);
      await request("/api/auth/sign-out",{},cookie);
      const login=await request("/api/auth/sign-in/username",{username,password});assert.equal(login.status,200);
      const loaded=await request("/api/character",null,login.cookie);assert.equal(loaded.status,200);
      assert.equal(loaded.json.characterModelId,characterModelId);assert.equal(loaded.json.founderSkill,founderSkill);assert.equal(loaded.json.ceoName,"Changed");assert.equal(loaded.json.id,character.id);
    }
  } finally {for(const id of ids){await db`delete from company where account_id=${id}`;await db`delete from "user" where id=${id}`;}await db.end();}
});

test("actual additive migration preserves complete legacy company JSON and appearance",async()=>{
  const db=postgres(process.env.DATABASE_URL,{max:1});
  try {await db.begin(async tx=>{
    // PostgreSQL resolves these temporary tables first; no real player rows are touched.
    await tx`create temporary table character (id text,presentation text,appearance jsonb) on commit drop`;
    await tx`create temporary table company (id text,character_id text,game_state jsonb) on commit drop`;
    const legacy={money:99999,reputation:567,lifetimeXp:4321,employees:[{id:"existing"}],researchedNodes:["speed"],playerCharacter:{displayName:"Old CEO",founderSkill:"MANAGER",model3d:{height:89},appearance:{skinTone:"DEEP"},equippedCosmetics:{OUTFIT:"outfit-orange-jacket"}},cosmeticEntitlements:[{cosmeticId:"outfit-orange-jacket"}]};
    for(const presentation of ["MALE","FEMALE","UNKNOWN"]) {
      await tx`insert into character values (${presentation},${presentation},${tx.json({height:89,skinTone:"DEEP"})})`;
      await tx`insert into company values (${presentation},${presentation},${tx.json(legacy)})`;
    }
    await tx.unsafe(readFileSync("drizzle/0003_demonic_iron_man.sql","utf8"));
    for(const row of await tx`select * from character`) {assert.equal(row.character_model_id,row.presentation==="MALE"?"founder_male_01":"founder_female_01");assert.deepEqual(row.appearance,{height:89,skinTone:"DEEP"});}
    for(const row of await tx`select * from company`) {const state=row.game_state;assert.equal(state.playerCharacter.characterModelId,row.id==="MALE"?"founder_male_01":"founder_female_01");delete state.playerCharacter.characterModelId;assert.deepEqual(state,legacy);}
  });}finally{await db.end();}
});
