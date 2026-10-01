# Repair Empire

Ein spielbarer Werkstatt-Tycoon mit Next.js, TypeScript und Tailwind CSS.

## Enthaltene Systeme

- zeitbasierte Reparaturaufträge mit Materialkosten und Auszahlung
- fünf Werkzeuge mit echten Reparatur- und Reputation-Freischaltungen
- fünf permanente Werkstatt-Upgrades mit jeweils fünf Leveln
- Repair-Level, Reputation und progressive Auftragsgenerierung
- vier freischaltbare Arbeitsplätze mit parallelen Reparaturen
- generierter Mitarbeitermarkt mit fünf Klassen, Skills, Qualität und Spezialisierungen
- Mitarbeiter-XP, Level-Ups und flexible Arbeitsplatzzuweisung
- Auto Repair mit vier Prioritäten und begrenzter Offline-Fertigstellung
- versionierter, lokal gespeicherter Spielstand mit Migration älterer Saves

## Lokal starten

```bash
npm install
npm run dev
```

Die Anwendung ist anschließend unter `http://localhost:3000` erreichbar.

## Prüfungen

```bash
npm run typecheck
npm run lint
npm run build
```

Der Spielstand wird lokal im Browser gespeichert. Eine Datenbank oder ein Account
ist für diesen ersten Stand nicht erforderlich.
