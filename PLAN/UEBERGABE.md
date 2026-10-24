# HanaBlox – Übergabe (Stand 24.10.2026)

Diese Datei ist für die nächste Sitzung. Lies sie zuerst, dann `PLAN/Naechste-Schritte.md`.

## 1. Was das Spiel ist
- Klötzchen-3D-Welt für Kinder, auf Deutsch, für Tablet und Handy.
- Städte/Länder: Hana-Stadt (Mitte), Schneeland (+x), Tropeninsel (-x), Zauberwald (+z). Reisen über den Flughafen.
- Spielwährung: Sterne (nur im Spiel, kein echtes Geld). Arbeit bringt höchstens 90 Sterne pro Tag.
- Gemeinsame Welt: alle Spieler landen im Raum `HANA`.

## 2. Wichtige Regeln (verbindlich)
- Kein echtes Geld, keine Glücksspiel-Mechanik (z. B. kein Ei-Gacha) für Kinder.
- Keine Kopie einer bestehenden Serie oder eines Spiels (z. B. Simpsons, kommerzielle Spiele). Eigener Stil.
- Keine echten Fotos von Kindern und keine Abbildungen echter Kinder (Gesicht, Name auf Statuen). Das Spiel ist öffentlich.
- Keine neuen Knöpfe am Spielfeldrand ohne Absprache. Handy-Knopf oben links ist erlaubt.

## 3. Was fertig ist (alles auf GitHub, letzter Stand c30c3af und danach Plan-Commits)
- Konten: Spielername + Passwort, angemeldet bleiben, Spielstand (Figur, Sterne, Aufgaben) im Konto gespeichert. Firebase Firestore (Render hat den Schlüssel).
- Dauerhafte Welt: Klötze und Gegenstände bleiben (Firestore).
- Bau-Modus: Klötze mit Vorschaubildern, Bau-Leiste unten.
- Joystick fest unten links, Kamera folgt der Laufrichtung.
- Mitfahren: Beifahrer bei Auto/Jeep/Boot (Server-Logik `ride`/`unride` in gamecore.js).
- Stadtbus: fährt auf der Ringstrasse (public/js/bus.js), Position aus der Uhrzeit, 4 Haltestellen. Einsteigen über Knopf in der Aktionsleiste.
- Handy: Knopf 📱 oben links → Karte (Orte, Reisen), Rucksack, Selfie, Freunde (grün = online), Sterne.
- Rucksack-Shop (Reiter 🎒 im Handy): Fahrzeuge, Deko, Tiere gegen Sterne. Katalog `SHOP` in shared.js, Kauf `buyShop` in profile.js (gespeichert in `hb_owned`, also im Konto). Neue Deko-Modelle: Sonnenblume, Laterne, Schneemann, Mini-Palme, Gartenzwerg.
- Fehlende 3D-Modelle ergänzt (Schneeball, Wasserballon, Frisbee, Drachen, Schildkröte, Delfin, Schmetterling, Hamster waren unsichtbar). Handy-Schliessen-Knopf wieder lesbar.
- Freunde: in der Spielerliste (oben rechts, aufklappen) auf einen Namen tippen. Ihr Name erscheint über ihnen.
- Tier: Menü nur nach Antippen des Tieres (Ablegen/Zurückrufen).
- Arbeit: Tagesdeckel 90 Sterne, Arbeitsplatz 2 Minuten gesperrt (client-seitig, siehe Hinweis unten).
- Abenteuer-Häuser werden nicht während des Aufenthalts umgebaut.
- Drei Kinder-Vorlagen im Avatar-Editor (Reiter „👧 Kinder“), ohne echte Ähnlichkeit. Skulpturen am Stadtplatz ohne Namen.
- Automatische Wiederverbindung bei Verbindungsabbruch.
- Schärfe: Auflösung bis 2x, Schatten flimmern weniger, Schnee auf der Grafikkarte.

## Neue Grafik (Trickfilm-Look, seit 24.10.)
- `public/js/toon.js`: `toonMat()` ersetzt überall MeshLambertMaterial (3 harte Licht-Stufen). `Outline` zeichnet das Bild in eine Textur, zieht dunkle Umrisse an Tiefen-Kanten und macht die Farben kräftiger (Sättigung 1.25). Wird im Spiel (`game.post`) und in der Avatar-Vorschau benutzt.
- Langsame Geräte: `adaptQuality` schaltet erst die Kantenglättung der Umrisse ab; die Umrisse selbst bleiben immer an.
- Licht: neutrale Sonne, violette Schattenseiten; Tonemapping Neutral (statt ACES, das hat die Farben ausgewaschen).
- Figuren und Fahrzeuge stark abgerundet, Figuren mit runden Händen. Texturen ruhig/flach.
- Oberfläche: Schrift Fredoka (Google Fonts), dicke dunkle Ränder (`--ink`), Himmel-Hintergrund im Menü, gelbes Handy.
- Stil ist eigenständig: keine Simpsons-Figuren, keine gelbe Haut, kein Logo.

## 4. Offen (Reihenfolge, siehe PLAN/Naechste-Schritte.md)
1. ~~Rucksack-Shop~~ erledigt (noch auf Render deployen).
2. Häuser kaufen: Grundstück wählen, Haus wird für den Spieler gebaut, Preis 40–150 Sterne.
3. Großes Redesign: HAT VORRANG (Wunsch vom 24.10.). Teil 1+2 erledigt (siehe unten «Neue Grafik»). Offen: Gebäude/Bäume runder und bunter, Tiere-Modelle, Leistungstest auf echtem iPad/Handy.
4. Bus: Mitfahrende anderer Spieler sind noch nicht sichtbar; Bus-Aussehen am Bildschirm bestätigen.
5. Sterne-Deckel und Arbeitswartezeit sind nur im Gerät. Auf Wunsch serverseitig machen. Gilt auch für Rucksack-Käufe (Server prüft Besitz nicht).

## 5. Code-Orte (Schnellübersicht)
- `public/js/game.js`: Spiel-Hauptklasse (Bewegung, Fahrzeuge, Mitfahren, Bus, Handy-Anbindung, Freunde, Schnee, Kamera).
- `public/js/gamecore.js`: Server-Logik für Räume, Spieler, Mitfahren, Feuerwerk (läuft auf Server UND im Browser ohne Server).
- `public/js/main.js`: Startseite, Login, Verbindung, Handy-Overlay, Avatar-Editor-Anbindung.
- `public/js/bus.js`: Stadtbus (Route, Haltestellen, Modell).
- `public/js/town.js`: Hana-Stadt (Gebäude, Plätze, Haltestellen, Skulpturen).
- `public/js/lands.js`: Schneeland, Tropeninsel, Zauberwald.
- `public/js/places.js`: wiederverwendbare Bausteine (Läden, Bad, Freizeitpark, Lagerfeuer, Feuerwerk-Knopf).
- `public/js/profile.js`: Sterne, Arbeitsdeckel, Wartezeit.
- `public/js/account.js`: Konto, Spielstand-Sync.
- `public/js/kit.js`: Baukasten für Welten (box, ramp, stairs, sign …). Meerkante `beach()`.
- `public/js/geo.js`: Meshes, Anti-Flacker-Korrektur (`fixCoplanar`).
- `public/js/editor.js` + `shared.js`: Avatar-Editor, Vorlagen `KIDS`, Berufe `JOBS`.
- `public/style.css`: alle Stile, HUD-Größen über `--u` in `#hud`.
- `server/server.js`, `server/store.js`, `server/accounts.js`: Server, Speicher (Firebase), Konten.
- `index.html`: Oberfläche (HUD, Handy, Menü, Anmeldung).

## 6. Test-Hinweise
- Lokal starten: `npm install` (einmal), dann `node server/server.js` → http://localhost:3000.
- Testkonto anlegen: `POST /api/register` mit `{"name":"...","pass":"abcd"}` (liefert ein Token).
- Im Browser: Token in `localStorage.hbacc_token` setzen, Seite neu laden, „Hana-Stadt“ wählen, „▶ Spielen“.
- Der Browser im Hintergrund zeichnet nicht neu: Kamera/Bus-Bilder vorher mit `g.renderer.render(g.scene, g.camera)` erzwingen.
- Layout-Test: Überlappungs-Prüfung der HUD-Elemente bei mehreren Bildschirmgrößen (Handy hoch/quer, iPad, PC).
- Prüfprogramme (liegen in der Projektumgebung, nicht im Repo): Flächen-Flacker, Treppen, Überschneidungen.

## 7. Veröffentlichen
1. `git add -A && git commit -m "..." && git push origin main` (Repo: github.com/ajdoo11/HanaBox).
2. GitHub Pages aktualisiert sich selbst (Adresse: https://ajdoo11.github.io/HanaBox/).
3. Render (Server + Spiel): Dashboard → hanablox → **Manual Deploy → Deploy latest commit**. Erst dann ist die neue Version unter https://hanablox.onrender.com aktiv. Die Kinder spielen auf Render, also dieser Schritt ist wichtig.

## 8. Hinweis zu Konten und Daten
- Testkonten bitte nach Tests löschen (Firebase-Sammlung `hanablox_accounts`). Echte Konten: adjo, hana.
- Die Firebase-Schlüsseldatei aus dem Download-Ordner löschen, sobald nicht mehr gebraucht.
