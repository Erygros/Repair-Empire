const local=(category:string,names:readonly string[])=>Object.fromEntries(names.map(name=>[name,`/assets/icons/${category}/${name}.png`]));
export const BRAND_ASSETS={
  brand:{fullLogo:"/assets/brand/logo-full.png",compactLogo:"/assets/brand/logo-compact.png",mark:"/assets/brand/mark.png",monochrome:"/assets/brand/mark-monochrome.png",outline:"/assets/brand/mark-outline.png",favicon:"/assets/brand/favicon.ico",icon16:"/assets/brand/icon-16.png",icon32:"/assets/brand/icon-32.png",appleIcon:"/assets/brand/icon-180.png",app192:"/assets/brand/icon-192.png",app512:"/assets/brand/icon-512.png"},
  resources:local("resources",["capital","reputation","company-level","xp","research","employees","customers","contracts","repairs","tools","buildings","automation","technology","seasons"]),
  navigation:local("navigation",["company","workshop","tools","team","customers","research","finance","events","news","seasons","settings"]),
  status:local("status",["active","working","research","repair","paused","ready","locked","error"]),
  skills:local("skills",["finance","technician","researcher","manager","negotiator"]),
  ui:local("ui",["upgrade","level-up","expand","location","warehouse","technology","premium","info","delete","edit"]),
} as const;
export type RepairIconCategory="resources"|"navigation"|"status"|"skills"|"ui";
export const ICON_SIZES={xs:16,sm:24,md:32,lg:48,xl:64} as const;
