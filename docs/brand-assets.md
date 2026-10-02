# Prompt 11.7: Brand- und Icon-Inventur

## Integration

Das bereitgestellte 1536 x 1024 Raster-Sheet ist die einzige neue Bildquelle.
53 Motive wurden einzeln ausgeschnitten. Verbundene dunkle Aussenflaechen
wurden transparent gemacht; eingeschlossene Materialdetails bleiben erhalten.
Keine SVG-Neuzeichnung, keine externen Icons und keine Sheet-Sprites.

- Hauptlogo: Website-Hero, Desktop-Header, Footer und Spielheader.
- Compact Logo: Tablet-Header und Founder Studio.
- Mark: Mobile-Header und Loading State; monochrome und Outline-Mark sind vorbereitet.
- Favicon: ICO mit 16/32 PNG-Eintraegen plus direkte PNG-Metadaten.
- App-Icons: 180/192/512 PNG ueber Next-Metadaten; kein neuer PWA-Service.
- Ressourcen: Kapital, Reputation, Firmenlevel, XP, Forschung, Mitarbeiter,
  Kunden, Auftraege, Reparaturen, Werkzeuge, Gebaeude, Automation und Seasons.
- Navigation: Firma, Werkstatt, Werkzeuge, Team, Kunden, Forschung, Finanzen,
  News, Events, Einstellungen; Aufgabenziel und Founder bleiben vorlaeufig Lucide.
- Status: aktiv, in Arbeit, Forschung, Reparatur, pausierte Automation, bereit,
  gesperrt und Fehler. Zustand und Spielregeln wurden nicht veraendert.
- Skills: ausschliesslich Finance, Technician, Researcher, Manager, Negotiator.
- UI: Upgrade, Level-Up, Ausbau, Technologie, Premium, Info und Loeschen.
  Ort, Lager und Bearbeiten liegen fuer passende bestehende Verwendungen bereit.

`src/game/data/brand-assets.ts` ist das zentrale Pfadregister, das alte
`asset-registry.ts` exportiert es ebenfalls. `RepairEmpireIcon` validiert Pfade
ohne stillen Fallback; Groessen 16/24/32/48/64 bleiben layoutstabil.
Originalfarben bleiben erhalten, keine CSS-Einfaerbung. Dekorative Bilder sind
fuer Screenreader ausgeblendet, Logos haben einen zugänglichen Namen.

Extraktion: `node scripts/extract-brand-assets.mjs "PFAD_ZUM_ORIGINAL_SHEET"`.
Einzeldateien liegen unter `public/assets/brand` und `public/assets/icons`.
Die sichtbare Originalaufloesung ist kleiner als die Groessenangaben im Sheet:
192/512 sind ausdruecklich hochskalierte Exporte, keine hochaufloesenden Master.

## Bewusst verbleibende Library-Icons

Universalbedienung bleibt Lucide: Pfeile, Schliessen, Menue, Zoom/Fokus,
Zuruecksetzen, Zufallsauswahl, Speichern, Audio an/aus, Warenkorb, Aktualisieren,
Zeitdauer und Entwickler-Debug/Clipboard/Download. Diese sind keine neuen
Brand-Motive. Zentral fehlende Motive sind unten vollstaendig dokumentiert.

## FEHLENDE ASSETS

### Founder
ASSET: Founder / CEO / Profil
VERWENDUNG: Charakter-Navigation, Map-Profil, Operator-Anzeige, Founder-Erstellung.
BENÖTIGTE VARIANTEN: Normal, aktiv; kleine Operator-Version.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 16/24/32/48.
BESCHREIBUNG: Industrielles Founder-Portraet oder eindeutige Einzelperson, kein Team-Symbol.

### Aufgaben
ASSET: Challenge / Aufgabenziel
VERWENDUNG: Aufgaben-Navigation und offene Challenge-Karten.
BENÖTIGTE VARIANTEN: Offen, aktiv; Abschluss nutzt vorhandenen Status-Haken.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 24/32/48.
BESCHREIBUNG: Eigenstaendiges industrielles Zielmotiv, getrennt von Auftraegen.

### Tagesaufgaben
ASSET: Daily / Kalender
VERWENDUNG: Tagesaufgaben im Challenge Center.
BENÖTIGTE VARIANTEN: Normal, aktiv.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 24/32.
BESCHREIBUNG: Kalender mit Tagesmarkierung im Repair-Empire-Stil.

### Erfolge
ASSET: Achievement / abgeschlossene Challenges
VERWENDUNG: Erfolgsanzeige im Challenge Center und Belohnungsdialog.
BENÖTIGTE VARIANTEN: Normal, erreicht.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 24/32/48.
BESCHREIBUNG: Eigenes Erfolgsabzeichen; Season-Pokal wird nicht zweckentfremdet.

### Meilensteine
ASSET: Milestone / Fortschrittsziel
VERWENDUNG: ProgressionStrip und MilestoneReport.
BENÖTIGTE VARIANTEN: Kommend, erreicht.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 24/32/48.
BESCHREIBUNG: Industrie-Fortschrittsmarkierung oder Flagge, getrennt von Seasons.

### Offline
ASSET: Offline-Fortschritt
VERWENDUNG: OfflineReport, Rueckkehr-Zusammenfassung.
BENÖTIGTE VARIANTEN: Normal, neue Ergebnisse.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 32/48/64.
BESCHREIBUNG: Werkstatt mit Zeit-/Abwesenheitsmotiv; kein laufender Reparaturstatus.

### Geraete
ASSET: Geraetearten
VERWENDUNG: OrderBoard-Geraetegruppen.
BENÖTIGTE VARIANTEN: Smartphone, Controller, Handheld, Konsole, Tablet, Laptop, Audio.
EMPFOHLENE GRÖSSE: Je Master 128 x 128; UI 24/32/48.
BESCHREIBUNG: Sieben unterscheidbare Geraete mit gemeinsamer Material- und Lichtgestaltung.

### Verlauf
ASSET: Reparaturhistorie
VERWENDUNG: RepairLog und Werkstatt-Verlauf.
BENÖTIGTE VARIANTEN: Normal, aktiv.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 24/32.
BESCHREIBUNG: Werkstattprotokoll mit Zeitverlauf, getrennt von neuen Auftraegen.

### Kleidung
ASSET: Cosmetics / Garderobe
VERWENDUNG: CharacterProfile-Kosmetikbereich.
BENÖTIGTE VARIANTEN: Normal, ausgewählt.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 24/32/48.
BESCHREIBUNG: Orange Arbeitskleidung oder Garderobe, nicht generische Premium-Krone.

### Cosmetic Unlock
ASSET: Kosmetik-Freischaltung
VERWENDUNG: CosmeticUnlock-Belohnungsanzeige.
BENÖTIGTE VARIANTEN: Neu freigeschaltet.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 32/48/64.
BESCHREIBUNG: Kleidungs-/Ausstattungsbelohnung mit dezenter Leuchtmarkierung.

### Effizienz
ASSET: Reparaturtempo / Effizienz
VERWENDUNG: RepairBench, ToolStore, UpgradeBay.
BENÖTIGTE VARIANTEN: Normal, verbessert.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 16/24/32.
BESCHREIBUNG: Praezises industrielles Geschwindigkeitsmessgeraet.

### Mitarbeiterleistung
ASSET: Technikerleistung
VERWENDUNG: TeamHub-Geschwindigkeits-/Leistungsanzeige.
BENÖTIGTE VARIANTEN: Normal, gesteigert.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 16/24/32.
BESCHREIBUNG: Eigenes Leistungs-/Energie-Motiv, kein Automation-Roboter.

### Spezialisierung
ASSET: Mitarbeiter-Spezialisierung
VERWENDUNG: TeamHub-Berufs-/Spezialisierungsanzeige.
BENÖTIGTE VARIANTEN: Normal; bei Bedarf bestehende Reparaturkategorien.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 24/32.
BESCHREIBUNG: Techniker-Fachausruestung, nicht Kundenauftrag-Clipboard.

### Stammkunden
ASSET: Wiederkehrender Kunde / Kundenbindung
VERWENDUNG: CustomerCenter-Beziehungsanzeige.
BENÖTIGTE VARIANTEN: Normal, loyal.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 16/24/32.
BESCHREIBUNG: Kundenmotiv mit Wiederkehr-/Bindungssignal.

### Mehrgeraete
ASSET: Mehrgeraete-Auftrag
VERWENDUNG: CustomerCenter-Serien-/Paketauftraege.
BENÖTIGTE VARIANTEN: Offen, abgeschlossen.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 24/32.
BESCHREIBUNG: Mehrere Geraete als zusammengehoeriges Auftragspaket.

### Transaktionen
ASSET: Transaktionsbeleg
VERWENDUNG: EconomyDashboard-Ledger.
BENÖTIGTE VARIANTEN: Normal.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 24/32.
BESCHREIBUNG: Finanzbeleg; Kapital-Icon bleibt fuer Geldwerte reserviert.

### Diagnose
ASSET: Diagnostik / Scanner
VERWENDUNG: WebsiteScenes-Diagnosephase und Diagnose-Forschung.
BENÖTIGTE VARIANTEN: Normal, aktiv.
EMPFOHLENE GRÖSSE: Master 128 x 128; UI 24/32/48.
BESCHREIBUNG: Geraete-Scanner mit cyanfarbener Diagnoseanzeige.

### Hochaufloesende Master
ASSET: Native Logo- und App-Icon-Master
VERWENDUNG: Hochaufloesende Displays, App-Icon 512 und kuenftige Exportgroessen.
BENÖTIGTE VARIANTEN: Hauptlogo, Compact, Mark; transparente 192/512 PNG; Dark/Light bei Bedarf.
EMPFOHLENE GRÖSSE: Logo mindestens 1656 x 528; Mark mindestens 1024 x 1024.
BESCHREIBUNG: Originaldesign als echte separate Raster-Master. Das Sheet liefert nur kleinere sichtbare Motive.

## Verifikation

TypeScript, ESLint und Production Build erfolgreich. Browserpruefung mit
1600/820/390/360 Pixeln: responsive Logos, keine horizontalen Ueberlaeufe,
keine defekten Bilder. Lokaler Testaccount mit genau fuenf Skill-Icons;
alle zehn Spielbereiche auf Desktop, Tablet und Mobile navigierbar.
Canvas-Pixelpruefungen bestaetigen sichtbare und animierte Map, Werkstatt und
Teamraum auf Desktop/Mobile. Mobile Map-Auswahl bleibt innerhalb des Viewports.
Alle sechs Favicon-/App-Metadaten-URLs liefern HTTP 200. 15 Asset- und
Regressionspruefungen erfolgreich. Kein Produktionsaccount wurde veraendert.
