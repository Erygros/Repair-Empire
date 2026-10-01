export type FounderSkill = "FINANCE"|"TECHNICIAN"|"RESEARCHER"|"MANAGER"|"NEGOTIATOR";
export const FOUNDER_SKILLS:Record<FounderSkill,{name:string;bonus:string;description:string}>={FINANCE:{name:"Finance",bonus:"+2 % Reparaturgewinn",description:"Erhöht ausschließlich qualifizierende Reparaturauszahlungen."},TECHNICIAN:{name:"Technician",bonus:"+15 % Reparaturtempo",description:"Verkürzt die zentrale Dauer jeder Reparatur."},RESEARCHER:{name:"Researcher",bonus:"+10 % Forschungspunkte",description:"Erhöht Forschungspunkte aus Gameplay-Belohnungen."},MANAGER:{name:"Manager",bonus:"+10 % Mitarbeiter-XP",description:"Techniker sammeln nach Reparaturen mehr Erfahrung."},NEGOTIATOR:{name:"Negotiator",bonus:"+10 % Kundenloyalität",description:"Erhöht Loyalitätsgewinn aus erfolgreichen Aufträgen."}};
export const FOUNDER_SKILL_VALUES={FINANCE_PROFIT:.02,TECHNICIAN_SPEED:.15,RESEARCH_POINTS:.10,MANAGER_XP:.10,NEGOTIATOR_LOYALTY:.10} as const;
export function applyFounderBonus(skill:FounderSkill|undefined,source:"research"|"loyalty",amount:number){
  if(source==="research"&&skill==="RESEARCHER")return amount*(1+FOUNDER_SKILL_VALUES.RESEARCH_POINTS);
  if(source==="loyalty"&&skill==="NEGOTIATOR")return amount*(1+FOUNDER_SKILL_VALUES.NEGOTIATOR_LOYALTY);
  return amount;
}
