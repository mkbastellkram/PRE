# PR-Explorer Madeira V4.0 Baseline

## Kurzzeile
PR-Explorer V4.0 Baseline: Root-Inhalt komplett hochladen, alte Dateien im Repository vorher entfernen/überschreiben.

## Vollständiger Infoblock
Version: PR-Explorer Madeira V4.0 Baseline  
Ziel: sauberer Neuaufbau ohne V3.x-Patchkette  
Struktur: index.html, src/app.js, src/styles.css, data/, assets/, manifest.webmanifest  
Service Worker: nicht enthalten  
Datenquellen: PR – V1.xlsx, Gpx.zip, KML.zip  
Homezone: Pestana Promenade Premium, Funchal (32.6377707, -16.9363596)  
Upload: kompletten ZIP-Inhalt in den GitHub-Pages-Root hochladen. Vorher alte JS/CSS/Patchdateien entfernen.  
Neue/geänderte Ordner: src/, data/, assets/, docs/  

## Testreihenfolge
1. App startet sichtbar.
2. Journal zeigt echte PR-Liste.
3. Suche/Minimalfilter funktionieren.
4. Karte zeigt Madeira stabil.
5. Keine versetzten Kacheln.
6. PR-Pins sichtbar.
7. PR antippen.
8. Detailseite öffnet.
9. GPX wird angezeigt, wenn vorhanden.
10. KML wird angezeigt, wenn vorhanden.
11. Detail schließen.
12. Karte bleibt bedienbar.
13. Journal bleibt bedienbar.
14. Reise zeigt Platzhalter/Hülle.
15. Dashboard zeigt Datenstatus.
16. Keine Freeze.
17. Keine weiße/grüne Fläche.
