# PRX Architecture Lock · V4.0.1

Status: verbindlich ab V4.0.1 Governance.

## Gesperrte Grundentscheidungen

- A-001: Vanilla JavaScript, kein React/Vue, kein Build-Zwang.
- A-002: Leaflet bleibt Kartenengine.
- A-003: GitHub Pages Root-Struktur mit `index.html` im Hauptverzeichnis.
- A-004: Eine zentrale CSS-Datei: `src/styles.css`.
- A-005: Eine zentrale JS-Hauptdatei: `src/app.js`.
- A-006: Keine V3.x-Patchdateien, keine Recovery-Dateien, keine DOM-Override-Dateien.
- A-007: Journal-first bleibt Startlogik.
- A-008: Bottom Navigation: Journal · Karte · Reise · Dashboard.
- A-009: GPX = Wandertrack, KML = Anfahrt. Keine Luftlinien erfinden.
- A-010: Homezone Pestana Promenade Funchal bleibt voreingestellt.
- A-011: Keine Service-Worker-Aktivierung vor stabiler Baseline-Abnahme.
- A-012: Wiederkehrende Bedienelemente werden als Komponenten geführt.

## Änderungsregel

Eine gesperrte Entscheidung darf nur über einen dokumentierten Change Request geändert werden.
