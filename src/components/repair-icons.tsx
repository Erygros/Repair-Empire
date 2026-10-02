import type { ImgHTMLAttributes } from "react";
import Image from "next/image";
import { BRAND_ASSETS, ICON_SIZES, type RepairIconCategory } from "@/game/data/brand-assets";
import "./repair-brand.css";

type IconProps=Omit<ImgHTMLAttributes<HTMLImageElement>,"src"|"width"|"height">&{size?:number|keyof typeof ICON_SIZES;strokeWidth?:number};
export function RepairEmpireIcon({category,name,size="sm",className="",alt="",strokeWidth:ignored,...props}:IconProps&{category:RepairIconCategory;name:string}){
  void ignored;
  const pixels=typeof size==="string"?ICON_SIZES[size]:size<=18?16:size<=26?24:size<=38?32:size<=54?48:64;
  const src=BRAND_ASSETS[category][name];
  if(!src)throw new Error(`Unregistered Repair Empire icon: ${category}/${name}`);
  return <Image {...props} unoptimized src={src} alt={alt} width={pixels} height={pixels} className={`repair-icon repair-icon-${category} ${className}`} style={{...props.style,width:pixels,height:pixels}} aria-hidden={alt?undefined:true}/>;
}
const icon=(category:RepairIconCategory,name:string)=>function AssetIcon(props:IconProps){return <RepairEmpireIcon {...props} category={category} name={name}/>;};
export const CapitalIcon=icon("resources","capital"),ReputationIcon=icon("resources","reputation"),CompanyLevelIcon=icon("resources","company-level"),XpIcon=icon("resources","xp"),ResearchIcon=icon("resources","research"),EmployeesIcon=icon("resources","employees"),CustomersIcon=icon("resources","customers"),ContractsIcon=icon("resources","contracts"),RepairsIcon=icon("resources","repairs"),ToolsIcon=icon("resources","tools"),BuildingsIcon=icon("resources","buildings"),AutomationIcon=icon("resources","automation"),SeasonsIcon=icon("resources","seasons");
export const CompanyNavIcon=icon("navigation","company"),WorkshopNavIcon=icon("navigation","workshop"),ToolsNavIcon=icon("navigation","tools"),TeamNavIcon=icon("navigation","team"),CustomersNavIcon=icon("navigation","customers"),ResearchNavIcon=icon("navigation","research"),FinanceNavIcon=icon("navigation","finance"),EventsNavIcon=icon("navigation","events"),NewsNavIcon=icon("navigation","news"),SeasonsNavIcon=icon("navigation","seasons"),SettingsIcon=icon("navigation","settings");
export const ActiveIcon=icon("status","active"),WorkingIcon=icon("status","working"),LockedIcon=icon("status","locked"),ReadyIcon=icon("status","ready"),ErrorIcon=icon("status","error"),PausedIcon=icon("status","paused"),RepairStatusIcon=icon("status","repair"),ResearchStatusIcon=icon("status","research");
export const UpgradeIcon=icon("ui","upgrade"),LevelUpIcon=icon("ui","level-up"),ExpandIcon=icon("ui","expand"),LocationIcon=icon("ui","location"),WarehouseIcon=icon("ui","warehouse"),TechnologyIcon=icon("ui","technology"),PremiumIcon=icon("ui","premium"),InfoIcon=icon("ui","info"),DeleteIcon=icon("ui","delete"),EditIcon=icon("ui","edit");

export function BrandLogo({variant="responsive",className=""}:{variant?:"full"|"compact"|"mark"|"responsive";className?:string}){
  const src=variant==="compact"?BRAND_ASSETS.brand.compactLogo:variant==="mark"?BRAND_ASSETS.brand.mark:BRAND_ASSETS.brand.fullLogo;
  return <picture className={`repair-brand-logo brand-${variant} ${className}`}>{variant==="responsive"&&<><source media="(max-width:620px)" srcSet={BRAND_ASSETS.brand.mark}/><source media="(max-width:1100px)" srcSet={BRAND_ASSETS.brand.compactLogo}/></>}<Image unoptimized src={src} alt="Repair Empire" width={variant==="mark"?150:variant==="compact"?264:552} height={variant==="mark"?164:variant==="compact"?132:176}/></picture>;
}
