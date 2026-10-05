# Events, Account-Einstellungen und Layout-Pruefung

Events nutzt die News-Bildsprache, Hero-Komponenten, Schriftgroessen, Linien und
Inhaltsbreiten. Der reale Leerzustand bleibt erhalten, ohne fiktive Seasons.

Die Spielnavigation enthaelt unter Charakter die Account-Einstellungen und
Abmelden. Abmelden speichert den lokalen Spielstand und fragt bei ungespeicherten
Founder-Aenderungen nach. Bestehende Audio-/Bewegungsoptionen bleiben verfuegbar.

E-Mail-Aenderungen verlangen eine aktive, ausreichend frische Sitzung, das
aktuelle Passwort und einen passenden Origin. Die Passwortpruefung erfolgt
ueber Better Auth. Ein datenbankgestuetztes, atomisches Limit erlaubt acht
Versuche pro Account und Minute. E-Mail und normalisierte E-Mail werden gemeinsam
aktualisiert; die neue Adresse ist nicht verifiziert. Es wird kein Mailversand
vorgetaeuscht. Andere Sitzungen werden widerrufen. Fuer eine spaetere Verifikation
ist weiterhin ein konfigurierter Mailprovider notwendig.

Passwortaenderungen nutzen Better Auth mit aktuellem Passwort, mindestens zehn
Zeichen und Widerruf anderer Sitzungen. Die UI verlangt eine Wiederholung und
zeigt Fehler-/Erfolgsmeldungen, ohne Zugangsdaten lokal zu speichern.

Layout: Bestandsicons spannen wieder beide Grid-Zeilen; Beschriftungen stehen
in der breiten zweiten Spalte. Werkzeug- und Upgrade-Titel sind kompakter.
Rechte Abteilungspanels scrollen mit der Seite statt Inhalte in einem zweiten
Scrollbereich zu begrenzen. Mobil bleibt die Navigation horizontal scrollbar.

Geprueft auf localhost:3000 mit eigenen lokalen QA-Accounts:
- Alle elf Spielansichten bei 1600, 820 und 360 px.
- News und Events bei Desktop- und Mobile-Groesse.
- Keine Seitenueberlaeufe, defekten Bilder oder abgeschnittenen Heading-/Button-
  Elementen in den automatischen Kontrollen; Screenshot-Sichtpruefung ergaenzt.
- E-Mail- und Passwortformulare sowie Logout im Browser erfolgreich.
- 28 bestehende Auth-Tests, ein erweitertes Account-Sicherheitsszenario und
  16 Asset-/Founder-/Animations-/Audio-Tests erfolgreich.
- Production Build und TypeScript erfolgreich.

Die Pruefung betrifft aktuelle Startzustaende und Account-Flows, nicht jede
moegliche spaete Spielkombination. Produktionsdaten wurden nicht angefasst.
