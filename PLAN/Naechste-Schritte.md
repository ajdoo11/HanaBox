# HanaBlox – Plan für die nächsten Schritte

Stand: 2026-10-24. Diese Datei ist der Fahrplan. Wenn die Sitzung ein Limit erreicht, hier weitermachen.

## Entscheidung zum Aussehen (wichtig)
- Die Screenshots zeigen ein kommerzielles Spiel (Handy-Menü, Symbole, Figuren, Gegenstände, Ei-Gacha).
  Dessen Aussehen und Spielprinzip 1:1 zu übernehmen geht nicht (Urheberrecht, und du wolltest ursprünglich keine Ähnlichkeit).
- Umgesetzt wird ein eigenes Design mit denselben Funktionen: Bus, Handy mit Karte und Selfie, Rucksack-Shop, Häuser kaufen, bessere Autos/Tiere.
- Keine Glücksspiel-Mechanik (kein Ei-Gacha) für Kinder.

## Aufgaben
- [x] 1. Bus: fährt auf der Ringstrasse, Position aus der Uhrzeit (alle sehen ihn am gleichen Ort), 4 Haltestellen, einsteigen/aussteigen. Logik im Test geprüft. Offen: Bus-Aussehen am Bildschirm bestätigen, Mitfahrende anderer Spieler sind noch nicht sichtbar.
- [x] 2. Handy (☰-Menü → 📱 Handy): Reiter Karte (Orte und Reisen), Selfie, Freunde (mit Grün=online), Sterne. Im Test geöffnet und alle Reiter geprüft. Offen: Profil-Reiter.
- [x] 3. Rucksack (Handy → Reiter 🎒 Rucksack): Fahrzeuge 10–60 ⭐ (mit Farbwahl, «Fahren» holt es überall draussen in der Stadt hervor), Deko 2–20 ⭐ («Hinstellen», danach «🤲 Hinlegen»), Tiere (Preise wie im Avatar-Shop, «Mitnehmen»). Einmal gekauft = für immer. Im Test gekauft, gefahren, Deko hingestellt.
- [x] 4. Häuser kaufen (24.10.): 12 Grundstücke im Norden der Hana-Stadt an der Ringstrasse. Handy → 🎒 Rucksack → 🏡 Häuser: Häuschen 40, Familienhaus 70, Villa 110, Schlösschen 150 ⭐. Wand-/Dachfarbe und Grundstück wählen, eigener Innenraum (Freunde dürfen rein). Ein Haus pro Spieler, Umbauen/Umziehen jederzeit. Server merkt sich den Besitzer. Im Test gebaut, betreten, Server-Regeln geprüft. Offen: Auf echtem Gerät durchspielen; Grundstücke werden nie frei (bei vielen Spielern weitere Reihe anlegen).
- [ ] 5. Autos und Tiere besser darstellen (Modelle, Farben, Animationen).
- [x] 6. Gesamtbild (Teil 1+2, 24.10.): Cel-Shading, Umrisslinien, kräftige Farben, runde Figuren/Fahrzeuge, Comic-Oberfläche. Layout auf Handy und PC geprüft. Teil 3: Gebäude (weiche Kanten, Rundbogentüren, Fensterläden) und Bäume (Wolkenkronen, Tannen, Palmen) erledigt. Teil 4: Tiere mit grossem Kopf, Kulleraugen und Bäckchen erledigt. Offen: echter iPad-Leistungstest.
- [ ] 7. Hochladen: git push, Render "Manual Deploy" → "Deploy latest commit".
- [x] 8. Wunschliste vom 24.10. (Nachmittag), alles umgesetzt und im Browser getestet:
  - Schatten kommen/gehen nicht mehr (wurden je nach Bildrate an/aus geschaltet), Schattenbereich grösser.
  - Tiere kleiner (Haustiere 0.95, frei laufende 1.1 statt 2.5). Fahrzeuge 0.15 angehoben (Räder steckten in Strasse/Gehweg).
  - Flüssiger: Welt nach Oberfläche statt Farbe zusammengefasst (etwa halb so viele Zeichenschritte), Teile im Nebel ausgeblendet, langsame Geräte senken Auflösung und Sichtweite schrittweise. Von 80 Bots pro Stadt werden nur die 30 nächsten gezeichnet.
  - Oben links nur noch ☰, 📱 und Profil-Karte (Figur, Name, Sterne). Karte, Selfie und Spielerliste sind im Handy.
  - Handy → Freunde: alle Online-Spieler automatisch, «📍 Hin» reist zu ihnen, ⭐ markiert Lieblingsfreunde.
  - 80 Bots in jeder Stadt (fest, Menü-Regler entfernt). Weit entfernte Bots warten, der Server schickt nur nahe Bots.
  - Eigenes Haus einrichten: Knopf «🛋️ Einrichten» im eigenen Haus, 21 Möbel, Drehen, Wegräumen, Wand- und Bodenfarbe (höchstens 40 Möbel).
  - Pizzeria (Einkaufsstrasse, auf der Karte): eigener Innenraum mit Holzofen, Pizza-Minispiel (Bestellung, Teig, Sauce, Käse, Beläge, Ofen, Servieren; 4 ⭐ pro Pizza, 3 Pizzas pro Schicht).
  - Ampeln an allen 36 Kreuzungen (für alle gleich geschaltet), Boote mit Fahrer fahren um alle Inseln.
  - Offen: echter Test auf iPad/Handy (Bildrate), Bots halten nicht an Ampeln, Boote fahren durch Spieler-Boote hindurch.

## Reihenfolge (Wunsch vom 24.10.)
- Zuerst die neue Grafik fertig machen, danach Häuser kaufen und die übrigen Punkte.

## Regeln
- Jeder Schritt wird einzeln committet und getestet, bevor der nächste beginnt.
- Keine echten Fotos von Kindern im Spiel.

## Vorgaben vom 24.10. (verbindlich)
- Kein echtes Geld. Häuser, Autos, Deko und Tiere werden nur mit Sternen aus dem Spiel bezahlt.
- Preise moderat: Häuser etwa 40–150 Sterne, Autos 10–60, Deko 2–20. Alles muss mit den Tages-Arbeitssternen (Deckel 90) erreichbar sein.
- Stil: warmer Trickfilm-Look, dicke weiche Konturen, runde Formen, kräftige Farben, schöne Lichter. Eigenständig gestaltet.
- Nicht erlaubt: Figuren, Logos oder der Stil einer bestehenden Serie oder eines Spiels (z. B. Simpsons, kommerzielle Spiele). Eigener Stil ist Pflicht.
- Grafik-Schritt (eigener Abschnitt): Cel-Shading mit Umrisslinien für Figuren, Autos, Häuser. Vorher Leistungstest auf dem iPad und Handy.
