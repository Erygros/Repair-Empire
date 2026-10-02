import sharp from "sharp";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";

const sources=process.argv.slice(2);
if(sources.length!==3)throw new Error("Provide the three original sheets in prompt order.");
const expected=[[1983,793],[1536,1024],[1536,1024]];
for(let i=0;i<3;i++){const m=await sharp(sources[i]).metadata();if(m.width!==expected[i][0]||m.height!==expected[i][1]||!m.hasAlpha)throw new Error(`Unexpected source ${i+1}; review the crop inventory.`);}
const root="public/assets",inventory=[];
// Preserve supplied alpha and RGB. Rectangles exclude source labels and neighbours.
const crops=[
 [0,"character","founder-ceo",20,24,187,202],
 [0,"character","founder-ceo-active",207,13,199,218],
 [0,"progression","challenges",408,23,186,212],
 [0,"progression","challenges-active",594,12,199,223],
 [0,"progression","daily-tasks",800,40,177,193],
 [0,"progression","daily-tasks-active",982,31,171,204],
 [0,"progression","achievements",1155,40,179,195],
 [0,"progression","achievements-achieved",1335,32,193,205],
 [0,"progression","milestones",1538,21,220,219],
 [0,"progression","milestones-achieved",1758,9,223,231],
 [0,"progression","offline-progress",52,295,239,192],
 [0,"progression","offline-progress-results",291,287,223,205],
 [0,"repair","repair-history",542,300,180,189],
 [0,"repair","repair-history-active",744,294,179,196],
 [0,"character","wardrobe",951,300,221,188],
 [0,"character","wardrobe-selected",1172,288,239,208],
 [0,"repair","diagnostics-scanner",1440,298,222,190],
 [0,"repair","diagnostics-scanner-active",1662,284,257,211],
 [0,"brand","logo-full",152,517,1700,276],
 [0,"brand","mark",152,517,260,276],
 [1,"brand","logo-compact",666,809,196,180],
 [1,"devices","device-smartphone",54,21,126,224],
 [1,"devices","device-controller",182,89,218,156],
 [1,"devices","device-handheld",402,98,237,151],
 [1,"devices","device-console",641,20,218,230],
 [1,"devices","device-tablet",862,36,170,212],
 [1,"devices","device-laptop",1030,47,244,207],
 [1,"devices","device-audio",1280,88,247,158],
 [1,"character","cosmetic-unlock",232,475,212,204],
 [1,"repair","repair-speed",450,487,192,194],
 [1,"employees","technician-performance",648,488,208,195],
 [1,"employees","employee-specialization",861,478,214,214],
 [1,"customers","customer-loyalty",1077,485,210,200],
 [1,"customers","multi-device-order",1290,476,239,211],
 [1,"finance","transaction-receipt",25,670,202,163],
 [2,"customers","multi-device-order-completed",1322,489,213,192],
 [2,"progression","offline-progress-capacity",1300,278,235,207],
 [2,"world","location",203,855,164,162],
 [2,"world","world",372,851,164,166],
 [2,"ui","shop",536,856,160,160],
 [2,"world","winter-season",700,850,161,166],
 [2,"ui","events",866,851,185,163],
 [2,"ui","news",1051,853,182,161],
 [2,"ui","settings",1235,852,144,163],
 [2,"ui","info",1382,852,153,161],
 [2,"ui","warehouse",10,866,185,145],
];
for(const [sheet,category,name,left,top,width,height]of crops){
 const {data,info}=await sharp(sources[sheet]).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(sheet===0&&category==="brand")for(let y=0;y<55;y++)for(let x=0;x<width;x++)if(x>260||(y<27&&(x<110||x>165)))data[(y*width+x)*4+3]=0;
 if(name==="milestones")for(let y=170;y<height;y++)for(let x=180;x<width;x++)data[(y*width+x)*4+3]=0;
 // Remove isolated caption letters and cut-edge specks, not the artwork itself.
 const seen=new Uint8Array(width*height);
 for(let start=0;start<seen.length;start++){
  if(seen[start]||data[start*4+3]<8)continue;const component=[start];seen[start]=1;
  for(let head=0;head<component.length;head++){const at=component[head],x=at%width,y=Math.floor(at/width);for(const next of [x?at-1:-1,x<width-1?at+1:-1,y?at-width:-1,y<height-1?at+width:-1])if(next>=0&&!seen[next]&&data[next*4+3]>=8){seen[next]=1;component.push(next);}}
  if(component.length<(category==="brand"?150:64))for(const at of component)data[at*4+3]=0;
 }
 let x0=width,y0=height,x1=0,y1=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const a=data[(y*width+x)*4+3];if(a<8){data[(y*width+x)*4+3]=0;continue;}if(a>16){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}}
 const trimmed=await sharp(data,{raw:info}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).png().toBuffer();
 const masterDir=path.join(root,"masters",category),dir=category==="brand"?path.join(root,"brand"):path.join(root,"icons",category);
 await mkdir(masterDir,{recursive:true});await mkdir(dir,{recursive:true});
 await writeFile(path.join(masterDir,name+".png"),trimmed);
 const ui=await sharp(trimmed).resize({width:category==="brand"?1700:128,height:category==="brand"?600:128,fit:"inside",withoutEnlargement:true}).png().toBuffer();
 await writeFile(path.join(dir,name+".png"),ui);
 const meta=await sharp(trimmed).metadata();inventory.push({sheet:sheet+1,category,name,sourceRect:{left,top,width,height},masterWidth:meta.width,masterHeight:meta.height,master:`/assets/masters/${category}/${name}.png`,ui:`/assets/${category==="brand"?"brand":"icons/"+category}/${name}.png`});
}
for(const size of [16,32,180,192,512])await sharp(path.join(root,"brand","mark.png")).resize(size,size,{fit:"contain",background:"#00000000"}).png().toFile(path.join(root,"brand",`icon-${size}.png`));
const pngs=await Promise.all([16,32].map(size=>sharp(path.join(root,"brand",`icon-${size}.png`)).png().toBuffer()));
const header=Buffer.alloc(38);header.writeUInt16LE(1,2);header.writeUInt16LE(2,4);let offset=38;
pngs.forEach((png,i)=>{const at=6+i*16;header[at]=[16,32][i];header[at+1]=[16,32][i];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(png.length,at+8);header.writeUInt32LE(offset,at+12);offset+=png.length;});
await writeFile(path.join(root,"brand","favicon.ico"),Buffer.concat([header,...pngs]));
await writeFile(path.join(root,"extended-inventory.json"),JSON.stringify({sources:expected.map(([width,height],i)=>({sheet:i+1,width,height})),assets:inventory,appResamples:{source:"mark",nativeSize:[260,276],upscaled:[512]}},null,2)+"\n");
console.log(`Extracted ${inventory.length} selected assets from all three sheets, with native masters and small UI exports.`);
