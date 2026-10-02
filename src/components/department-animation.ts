export type Department = "tools"|"team"|"customers"|"research"|"economy"|"challenges"|"upgrades";
export const DEPARTMENT_NAMES:Record<Department,string>={tools:"Werkzeuglager",team:"Personalraum",customers:"Kundenbüro",research:"Forschungslabor",economy:"Finanzbüro",challenges:"Auftragsplanung",upgrades:"Entwicklungsraum"};
const LINES:Record<Department,string[]>={
  tools:["Alles griffbereit. So muss das sein.","Wo ist schon wieder der kleine Schraubendreher?","Zeit, den Werkzeugbestand zu prüfen."],
  team:["Ein gutes Team macht den Unterschied.","Wer hat Lust auf die nächste Reparatur?","Kurze Kaffeepause, dann geht es weiter."],
  customers:["Jedes reparierte Gerät erzählt eine Geschichte.","Mal sehen, was unsere Kunden brauchen.","Ein zufriedener Kunde kommt wieder."],
  research:["Da steckt noch einiges an Potenzial drin.","Erst messen. Dann verbessern.","Diese Idee könnte uns weiterbringen."],
  economy:["Die Zahlen müssen am Ende stimmen.","Kleine Einsparungen machen auch einen Unterschied.","Zeit für einen Blick in die Bücher."],
  challenges:["Welches Ziel nehmen wir als Nächstes?","Schritt für Schritt wächst das Unternehmen.","Heute schaffen wir bestimmt noch etwas."],
  upgrades:["Hier könnten wir den Ablauf verbessern.","Gutes Werkzeug braucht einen guten Arbeitsplatz.","Da geht noch mehr."],
};
export function getDepartmentActivity(seconds:number,department:Department) {
  const time=Number.isFinite(seconds)?Math.max(0,seconds):0,phase=time%36;
  return {targetX:phase<12?-2.4:phase<24?2.4:0,targetZ:.75,working:phase%12>=5,speech:phase>=7&&phase<12?LINES[department][Math.floor(time/36)%3]:null};
}
