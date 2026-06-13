# PR-Explorer Madeira V4.0.1 Governance

## GitHub Kurzzeile
PR-Explorer Madeira V4.0.1 Governance: Audit-ID-System, kumulative Tickets, CSV/JSON Export, Leaflet-Stabilisierung.

## Vollständiger Infoblock
Version: PR-Explorer Madeira V4.0.1 Governance
Zweck: Governance-Zwischenschritt vor weiterer Fehlerbeseitigung.
Änderungen:
- Audit Center über ⚑ in der Topbar.
- Audit-Modus ein/aus.
- Element-IDs sichtbar als gelbe Labels/Outlines.
- Notizmodus: nächster Tap auf ein Element erzeugt genau ein Ticket.
- Immer nur ein einziges Notiz-Popup.
- Popup ist frei verschiebbar und sperrt die Bedienung bis Speichern/Abbrechen.
- Tickets werden kumulativ gespeichert und global nummeriert.
- Tickets können per Checkbox als erledigt markiert werden.
- Tickets können manuell gelöscht werden.
- CSV-Export je Gesamtlauf/Testsession für Excel/Numbers-Autofilter.
- JSON-Export als technische Sicherung.
- CSV-Import vorbereitet.
- Leaflet-Stabilisierung: Canvas-Renderer, reduzierte Animationen, gezielteres invalidateSize, Polyline-Decimation.

## Upload-Hinweis
Den bisherigen Repository-Inhalt vollständig ersetzen. Keine alten Dateien stehen lassen.
Root-Dateien und Ordner hochladen:
- index.html
- manifest.webmanifest
- src/
- data/
- assets/
- docs/

## Geänderte/neue Ordner
Geändert:
- src/
- docs/

Unverändert weiter erforderlich:
- data/
- assets/

## Testreihenfolge
1. App starten.
2. Journal sichtbar prüfen.
3. ⚑ Audit öffnen.
4. Audit-Modus aktivieren.
5. Element-IDs anzeigen aktivieren.
6. Notizmodus aktivieren.
7. Auf eine PR-Zeile tippen und Ticket speichern.
8. Audit Center öffnen, Ticket prüfen.
9. Ticket als erledigt markieren.
10. CSV exportieren und in Dateien speichern.
11. Karte öffnen und Basiskarten wechseln.
12. PR öffnen und GPX/KML laden.

## Bekannte Grenzen
- Kein Service Worker.
- CSV ist für Excel-Auswertung; JSON bleibt Sicherungsformat.
- Audit-IDs decken die Hauptkomponenten ab, Detailtiefe kann später erweitert werden.
