# Prompt 11.8: Drei Asset-Sheets

## Quellen und Auswahl

Alle drei gelieferten PNGs besitzen bereits echten Alpha. Die braunen Vorschau-
flaechen sind keine zu entfernenden Motivhintergruende. Farben, Materialdetails
und vorhandener Glow werden beibehalten. Beschriftungen, Nachbarmotive und
isolierte Randfragmente werden entfernt; keine neu generierten Ersatzgrafiken.

| Sheet | Native Groesse | Sichtbare Motive |
| --- | --- | --- |
| Repair Empire Sci-Fi-UI-Assets | 1983 x 793 | 18 Normal/Zustandsmotive und horizontales Logo |
| Reparaturimperium Glaenzende 3D-Spielicons | 1536 x 1024 | 7 Geraete, 16 Spielmotive, 5 Brand-Varianten |
| Sci-Fi-Reparatur-Icon-Pack | 1536 x 1024 | 5 Brand-, 15 Progression/Personal-, 9 Finance/Geraete-, 9 UI/World-Motive |

Duplikate werden nicht gleichzeitig als konkurrierende UI-Stile eingebunden.
46 ausgewaehlte Einzelassets inklusive Zustandsvarianten und abgeleitetem Mark
liegen als native Master und separate UI-Exporte vor. Die genaue Zuordnung,
Ausschnitte, Abmessungen und Pfade stehen in extended-inventory.json.

Sheet 1 liefert die gepaarten Founder-, Aufgaben-, Tagesaufgaben-, Erfolgs-,
Meilenstein-, Offline-, Verlauf-, Garderoben- und Diagnosemotive sowie Hauptlogo
und daraus abgeleiteten Mark. Sheet 2 liefert das kompakte Logo, sieben Geraete,
Cosmetic Unlock, Reparaturtempo, Mitarbeiterleistung/Spezialisierung,
Kundenbindung, Mehrgeraete-Auftrag und Finanzbeleg. Sheet 3 liefert den fertigen
Mehrgeraete-Auftrag, Offline-Kapazitaet, Standort, Welt, Winter, Shop, Events,
News, Einstellungen, Info und Lager. Nicht gewaehlte Duplikate und dekorative
App-Tiles bleiben Quellenvarianten, keine zusaetzlichen Funktionssymbole.

## Integration

- Brand: Hauptlogo, Compact, Mark, Favicon 16/32 und App-Icons 180/192/512.
- Resource/Navigation/Status: passende Originalassets aus 11.7 bleiben erhalten.
- Founder Skills: unveraendert Finance, Technician, Researcher, Manager, Negotiator.
- Geraete: Smartphone, Controller, Handheld, Game Console, Tablet, Laptop, Audio Deck.
- Varianten: Founder/Challenge/Daily/History/Diagnostics aktiv; Achievement und
  Milestone erreicht; Offline-Ergebnis/Kapazitaet; Wardrobe ausgewaehlt;
  Mehrgeraete-Auftrag abgeschlossen. Nicht vorhandene Varianten werden nicht erfunden.
- Universalicons bleiben fuer Pfeile, Schliessen, Speichern, Audio, Zoom und
  allgemeine Zeitangaben. Keine stille generische Ersatzgrafik fuer neue Kernmotive.
- Welt/Winter/Shop-Assets sind vorbereitet; keine neuen Gameplay-Systeme.

Registry: src/game/data/brand-assets.ts. Rendering: src/components/repair-icons.tsx.
Groessen: 16/24/32/48/64. Geraetezuordnung zentral in DeviceIcon.
Native PNGs: public/assets/masters; UI maximal 128 px: public/assets/icons.
Brand: public/assets/brand. Keine vollstaendigen Sheets im Client und keine Sprite-Crops.

## Reproduktion und Qualitaet

scripts/extract-extended-assets.mjs nimmt die drei Originaldateien in obiger
Reihenfolge als Argumente. Bei erneuter Gesamtextraktion zuerst 11.7 und danach
11.8 ausfuehren, weil letzteres Logos und einzelne UI-Motive ersetzt.
Die UI-Exporte behalten das Seitenverhaeltnis und vergroessern keine Master.
Hauptlogo ist fuer die aktuelle Hero-Darstellung ausreichend, aber kein
unabhaengiger Vektor-/4K-Master. Der Mark hat nur etwa 250 native Pixel.
180/192 sind verkleinert; nur 512 ist hochskaliert, siehe Manifest.

Browserpruefung: oeffentliche Seiten und zehn Spielansichten auf Desktop,
Tablet, 390 und 360 px; Bildlade- und Seitenueberlaufkontrollen. Zusaetzliche
lokale Fixtures pruefen Geraete, Verlauf und vorhandene Dialogvarianten.
Automatisierte Assettests pruefen Transparenz, Abmessungen, Registry und ICO.
Gameplay, Economy, Authentifizierung und Save-Logik werden nicht veraendert.

## Fehlende Assets

ASSET: Nativer hochaufloesender Logo-Mark/App-Icon-Export
VERWENDUNG: App/PWA-Icon 512 px
MOTIV: Vorhandenes orangefarbenes Schraubenschluessel-Hexagon unveraendert
VARIANTEN: Transparenter Mark und quadratisches App-Icon
EMPFOHLENE MASTER-GROESSE: 1024 x 1024 oder Vektor
ZIELGROESSEN IM UI: 192 und 512 px
PRIORITAET: Mittel; aktuelle 512-Datei ist nur hochskaliert
