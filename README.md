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
- ereignisbasierter Offline-Fortschritt mit 8-Stunden-Kapazität und Offline-Job-Pipeline
- dringende, Premium- und komplexe Auftragsvarianten mit gespeichertem dynamischem Job Board
- zentrale Economy-Transaktionen für Umsatz, Material-, Betriebs- und Investitionskosten
- Tageskennzahlen, Lifetime-Statistiken und kompaktes Unternehmens-Dashboard
- mathematisch unbegrenztes Company-Level mit Kapitel- und Langzeitmeilensteinen
- Forschungsbaum mit vier Bereichen, Abhängigkeiten und funktionalen Freischaltungen
- prozedurale Challenges und gespeicherte Daily Tasks mit ereignisbasiertem Fortschritt
- getrennte Account-, Company-, Character- und kosmetikbereite Identitätsdaten
- versionierter, lokal gespeicherter Spielstand mit Migration älterer Saves

## Lokal starten

```bash
npm install
npm run db:local
# In einem zweiten Terminal:
npm run db:migrate
npm run dev
```

Die Anwendung ist anschließend unter `http://localhost:3000` erreichbar.

## Prüfungen

```bash
npm run typecheck
npm run lint
npm run build
```

Der Spielstand wird weiterhin lokal im Browser gespeichert. Accounts, Sessions,
Character und Company-Metadaten liegen in PostgreSQL. Spielen und Character-Erstellung
setzen eine gültige Session voraus; es gibt keinen Fake-Auth-Fallback.

Die lokale DB läuft als eigener Prozess. Setup, Vercel-Variablen, Migrationen
und Auth-Tests sind in [docs/account-service.md](docs/account-service.md) dokumentiert.
