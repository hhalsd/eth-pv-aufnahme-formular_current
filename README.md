# ETH PV Planner Aufnahmeformular

Statische Progressive Web App (PWA) fuer die Vor-Ort-Aufnahme von PV-Projekten vor Angebots- und Planungserstellung. Die Anwendung arbeitet ohne Backend, speichert Entwuerfe lokal im Browser und exportiert pro Aufnahme genau einen JSON-Datensatz.

## Zweck und Einsatz

Die App ist fuer den Einsatz auf Mobilgeraeten oder Tablets bei Kundenterminen gedacht. Sie deckt die wichtigsten Aufnahmebereiche fuer eine spaetere Angebotsvorbereitung ab:

- Auftrags- und Kundendaten
- Objektadresse und Netzbetreiber
- Dach- und Montageparameter
- Elektro- und Zaehlerschrankdaten
- Anlagenparameter und Zusatzwuensche
- Sonstiges, To-do und Angebotsreife

Die App ersetzt keine fachliche Planung, Netzvertraeglichkeitspruefung, Statikpruefung oder normkonforme Ausfuehrungsdokumentation.

## Aktueller Funktionsumfang

### Formulareingabe

- strukturierte Eingabemaske in sechs Abschnitten
- Workflow-Bereich im Kopf mit Status, Kommentar, Verlauf und Verbindungsstatus
- JSON-Vorschau der aktuell erfassten Daten
- Pflichtfelder fuer zentrale Angebotsdaten

### Lokale Speicherung

- automatisches Speichern bei Eingaben und Aenderungen
- Entwurfsspeicherung in `localStorage`
- erneutes Laden des letzten lokalen Entwurfs beim Oeffnen der App
- Funktion `Neue Aufnahme`, die das Formular zuruecksetzt und einen neuen Aufnahmebezug erzeugt
- lokaler Verlauf ueber bereits exportierte Datensaetze

### JSON-Export

- exportiert genau eine JSON-Datei pro Vorgang
- Dateiname basiert auf Aufnahme-ID und Zeitstempel
- Export speichert den aktuellen Datensatz zusaetzlich lokal als Verlaufseintrag
- keine PDF-Erstellung

### GPS- und Adresshilfe

- optionaler GPS-Button fuer Standortermittlung im Browser
- speichert Koordinaten, Genauigkeit und Erfassungszeitpunkt im Datensatz
- versucht bei Online-Verbindung eine Reverse-Geocoding-Abfrage ueber OpenStreetMap Nominatim
- verteilt gefundene Adressdaten direkt auf `Strasse`, `Hausnummer`, `PLZ` und `Ort`, soweit diese verfuegbar sind

### PWA- und Offline-Verhalten

- `manifest.webmanifest` fuer Installation auf kompatiblen Geraeten
- `sw.js` fuer Asset-Caching und Offline-Nutzung der bereits geladenen App
- Online-/Offline-Statusanzeige in der UI
- fuer iPad/Safari als Web-App ueber `Teilen > Zum Home-Bildschirm` installierbar

## Projektstruktur

```text
.
|-- AGENTS.md
|-- README.md
|-- index.html
|-- manifest.webmanifest
|-- sw.js
|-- deploy_github_pages.sh
|-- deploy_termux_github_pages.sh
|-- assets/
|   `-- eth-logo.png
|-- icons/
|   |-- apple-touch-icon-180.png
|   |-- icon-192.png
|   |-- icon-192-new.png
|   |-- icon-512.png
|   |-- icon-512-new.png
|   |-- maskable-192.png
|   `-- maskable-512.png
|-- scripts/
|   `-- app.js
`-- styles/
    `-- main.css
```

## Technische Architektur

Die Anwendung ist bewusst einfach gehalten:

- reines statisches Frontend
- keine Build-Pipeline
- keine Node-Abhaengigkeiten
- keine API fuer Datenspeicherung
- keine serverseitige Validierung

Die gesamte Fachlogik liegt in `scripts/app.js`:

- Formularwerte einsammeln und normalisieren
- lokalen Entwurf speichern und laden
- lokalen Verlauf aus Exporten aufbauen und Datensaetze wieder laden
- JSON-Vorschau rendern
- JSON-Datei herunterladen
- GPS-Daten aufnehmen und optional rueckwaerts geokodieren
- Service Worker registrieren

## Datenmodell des Exports

Der Export wird in `collectData()` aufgebaut und enthaelt aktuell diese Hauptbereiche:

- `schema`
- `meta`
- `kunde`
- `objekt`
- `dach`
- `elektro`
- `anlage`
- `sonstiges`
- `workflow`

Wichtige Inhalte:

- `schema.version`: aktuell `2.0.0`
- `meta.aufnahmeId`: laufzeitgenerierte oder aus Verlauf geladene Aufnahme-ID
- `meta.erstelltAmLokaleZeit` und `meta.erstelltAmIso`: Exportzeitpunkte
- `objekt`: getrennte Felder fuer `strasse`, `hausnummer`, `plz`, `ort` sowie optionale GPS-Daten
- `dach`: neuer Sammelpunkt `dachaufbau` statt getrennter Dachform/Dacheindeckung
- `elektro`: neue Felder wie `potentialausgleichErdung` und `leitungswegAc`
- `sonstiges.todo`: Array aus den gesetzten To-do-Checkboxen
- `workflow`: `status` plus `kommentar`

Beispielhaft verkuerzte Struktur:

```json
{
  "schema": {
    "name": "eth-pv-aufnahme",
    "version": "2.0.0"
  },
  "meta": {
    "aufnahmeId": "PV-20260616-101500",
    "appVersion": "2.0.0-minimal-update",
    "exportFormat": "json"
  },
  "objekt": {
    "strasse": "Beispielstrasse",
    "hausnummer": "1",
    "plz": "85435",
    "ort": "Erding"
  },
  "workflow": {
    "status": "Angebotsphase",
    "kommentar": "Ruecksprache mit Kunde offen"
  }
}
```

## Speicherung und Datenschutz

Aktuell werden Daten nicht an einen eigenen Server uebertragen. Das Verhalten ist lokal-first:

- Entwuerfe werden im Browser unter `localStorage` gespeichert
- exportierte Datensaetze werden als JSON-Datei heruntergeladen
- exportierte Datensaetze werden lokal zusaetzlich als Verlauf fuer spaeteres Wiederladen gespeichert
- die App fuehrt keine eigene Cloud-Synchronisierung durch

Externe Kommunikation findet nur in diesen Faellen statt:

- Abruf der statischen Website beim Hosting
- optionale Browser-Geolocation des Geraets
- optionale Reverse-Geocoding-Anfrage an OpenStreetMap Nominatim fuer die GPS-Adresshilfe

Wenn sich dieses Verhalten aendert, muss diese Dokumentation angepasst werden.

## Lokal starten

Da Service Worker und PWA-Funktionen ueber `file://` unzuverlaessig sind, sollte die App ueber einen lokalen Webserver gestartet werden.

### Variante 1: Python

```bash
python -m http.server 8080
```

Alternativ:

```bash
python3 -m http.server 8080
```

Danach im Browser oeffnen:

```text
http://localhost:8080
```

### Variante 2: anderer statischer Webserver

Jeder einfache Static-File-Server ist ausreichend, solange `index.html`, `manifest.webmanifest` und `sw.js` normal ueber HTTP ausgeliefert werden.

## Empfohlene lokale Pruefung

Nach Aenderungen an UI oder Logik mindestens diese Punkte pruefen:

1. Formular laden und neue Aufnahme-ID sehen
2. Felder ausfuellen und Auto-Speicherung pruefen
3. Seite neu laden und gespeicherten Entwurf wiederfinden
4. JSON-Vorschau auf Plausibilitaet pruefen
5. JSON-Export ausloesen und Dateiinhalt kontrollieren
6. Verlauf pruefen: Export muss als lokaler Eintrag erscheinen und wieder ladbar sein
7. Falls geaendert: GPS-Funktion, Manifest oder Offline-Verhalten gezielt testen

## Deployment auf GitHub Pages

Im Repository liegen zwei Shell-Skripte:

- `deploy_github_pages.sh`
- `deploy_termux_github_pages.sh`

Beide enthalten derzeit denselben Ablauf und sind auf Termux ausgerichtet. Der Flow:

1. benoetigte Tools installieren
2. GitHub CLI authentifizieren
3. Repository initialisieren oder mit vorhandenem Remote verbinden
4. alle Dateien committen und auf `main` pushen
5. GitHub Pages fuer den Root-Pfad aktivieren
6. auf die fertige HTTPS-URL warten

### Beispiel unter Termux

```bash
REPO="eth-pv-planner-aufnahme" ./deploy_termux_github_pages.sh
```

Wichtige Hinweise:

- Die Skripte veraendern Git-Konfiguration, Remote und Commits im aktuellen Projektordner.
- `.nojekyll` gehoert zum statischen GitHub-Pages-Setup und bleibt im Projekt.
- Fuer iPad/Safari die ausgegebene HTTPS-URL oeffnen und anschliessend `Teilen > Zum Home-Bildschirm` verwenden.

## PWA-Wartung

Bei funktionalen Aenderungen an Assets oder Offline-Verhalten sind diese Dateien zusammen zu betrachten:

- `scripts/app.js`
- `sw.js`
- `manifest.webmanifest`
- `index.html`

Besonders wichtig:

- `APP_VERSION` in `scripts/app.js` bei relevanten App-Aenderungen mitdenken
- `CACHE_NAME` in `sw.js` erhoehen, wenn sich gecachte Assets oder das Cache-Verhalten aendern
- Asset-Liste in `sw.js` pflegen, wenn neue statische Dateien fuer den Start notwendig sind
- Manifest-Eintraege und Icon-Dateien synchron halten

## Bekannte Projektgrenzen

- kein Datei- oder Visitenkartenimport
- keine Bildaufnahme oder Dateianhaenge
- keine Server-Synchronisierung
- keine Benutzerverwaltung
- keine Konfliktaufloesung zwischen mehreren Geraeten
- keine PDF-Erstellung
- keine automatisierte Test-Suite im Repository

## Pflegehinweise fuer kuenftige Aenderungen

- README aktuell halten, wenn sich Exportstruktur, Bedienung, Datenschutz oder Deployment aendern
- bei JSON-Schema-Aenderungen die Feldnamen nur mit Bedacht aendern
- bei Aenderungen an offline-relevanten Dateien den Service-Worker-Cache bewusst versionieren
- beide Deploy-Skripte nur absichtlich auseinanderlaufen lassen

## Lizenz / Nutzung

Im Repository ist aktuell keine separate Lizenzdatei vorhanden. Wenn das Projekt extern verteilt oder mit Dritten geteilt werden soll, sollte die gewuenschte Lizenz explizit ergaenzt werden.
