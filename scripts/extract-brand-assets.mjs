import sharp from "sharp";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";

const source=process.argv[2];
if(!source)throw new Error("Provide the original 1536x1024 Repair Empire asset sheet.");
const metadata=await sharp(source).metadata();
if(metadata.width!==1536||metadata.height!==1024)throw new Error("Unexpected sheet dimensions; review crop coordinates first.");
const output=path.resolve("public/assets");
const inventory=[];
async function extract(group,name,left,top,width,height){
  const {data,info}=await sharp(source).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Remove only dark background connected to the crop boundary. Enclosed dark
  // material inside the supplied artwork is retained, not repainted/vectorized.
  const seen=new Uint8Array(width*height),queue=[];
  const background=i=>{const p=i*4;return Math.max(data[p],data[p+1],data[p+2])<85;};
  const visit=i=>{if(!seen[i]&&background(i)){seen[i]=1;queue.push(i);}};
  for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
  for(let head=0;head<queue.length;head++){const i=queue[head],x=i%width,y=Math.floor(i/width);if(x)visit(i-1);if(x<width-1)visit(i+1);if(y)visit(i-width);if(y<height-1)visit(i+width);data[i*4+3]=0;}
  const directory=path.join(output,group);await mkdir(directory,{recursive:true});
  const file=path.join(directory,name+".png");
  await sharp(data,{raw:info}).png().toFile(file);
  inventory.push({group,name,width,height,sourceRect:{left,top,width,height}});
  return file;
}
await extract("brand","logo-full",30,48,552,176);
await extract("brand","logo-compact",635,78,264,132);
const mark=await extract("brand","mark",946,56,150,164);
await extract("brand","mark-monochrome",1340,313,68,79);
await extract("brand","mark-outline",1440,313,67,79);
const resources=["capital","reputation","company-level","xp","research","employees","customers","contracts","repairs","tools","buildings","automation","technology","seasons"];
const resourceX=[74,184,290,397,504,612,719,825,933,1038,1145,1252,1359,1467];
for(let i=0;i<resources.length;i++)await extract("icons/resources",resources[i],resourceX[i]-39,553,78,78);
const navigation=["company","workshop","tools","team","customers","research","finance","events","news","seasons","settings"];
const navX=[60,147,234,321,407,494,581,668,752,836,922];
for(let i=0;i<navigation.length;i++)await extract("icons/navigation",navigation[i],navX[i]-24,750,48,47);
const statuses=["active","working","research","repair","paused","ready","locked","error"];
const statusX=[1018,1086,1155,1223,1289,1356,1422,1488];
for(let i=0;i<statuses.length;i++)await extract("icons/status",statuses[i],statusX[i]-28,745,56,57);
for(const [i,name]of ["finance","technician","researcher","manager","negotiator"].entries())await extract("icons/skills",name,34+i*106,883,84,91);
const ui=["upgrade","level-up","expand","location","warehouse","technology","premium","info","delete","edit"];
const uiX=[831,904,977,1050,1123,1196,1269,1342,1415,1488];
for(let i=0;i<ui.length;i++)await extract("icons/ui",ui[i],uiX[i]-24,904,48,48);
// The sheet's size labels describe intended exports, not actual source resolution.
// App sizes below are explicit raster resamples, not high-resolution originals.
for(const size of [16,32,180,192,512])await sharp(mark).resize(size,size,{fit:"contain",background:{r:0,g:0,b:0,alpha:0}}).png().toFile(path.join(output,"brand",`icon-${size}.png`));
const images=await Promise.all([16,32].map(size=>sharp(path.join(output,"brand",`icon-${size}.png`)).png().toBuffer()));
const header=Buffer.alloc(6+images.length*16);header.writeUInt16LE(1,2);header.writeUInt16LE(images.length,4);let offset=header.length;
images.forEach((png,i)=>{const at=6+i*16,size=[16,32][i];header[at]=size;header[at+1]=size;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(png.length,at+8);header.writeUInt32LE(offset,at+12);offset+=png.length;});
await writeFile(path.join(output,"brand","favicon.ico"),Buffer.concat([header,...images]));
await writeFile(path.join(output,"brand","extraction.json"),JSON.stringify({source:"User-provided Repair Empire asset sheet",sourceWidth:1536,sourceHeight:1024,assets:inventory,resampledAppSizes:[16,32,180,192,512]},null,2)+"\n");
console.log(`Extracted ${inventory.length} individual PNG assets and favicon/app exports.`);
