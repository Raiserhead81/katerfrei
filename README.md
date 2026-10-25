# Katerfrei

Trinkplan-Rechner: Was, wie viel und wann du heute Abend trinken kannst,
ohne morgen komplett am Arsch zu sein. Laeuft komplett lokal im Browser -
keine Daten, kein Server, nur Mathe.

Live: https://katerfrei.gemivo.de

## Das Modell (und warum es haltbar ist)

### 1. Blutalkohol nach Widmark
    BAC [Promille] = Alkohol [g] / (Koerpergewicht [kg] * r)

- r (Verteilungsfaktor, Anteil Koerperwasser): w = 0,55 / m = 0,68 / ohne Angabe = 0,61
  (Mittel aus beiden; Quelle: Widmark 1932; verfeinert durch Watson et al. 1981,
  die Koerperwasser aus Geschlecht, Groesse und Gewicht schaetzen - wir nutzen
  die Geschlechts-Mittelwerte als gute Naeherung.)
- Alkoholmasse pro Drink: Volumen[ml] * Vol.% * 0,789 g/ml
  Beispiel Bier 500 ml * 5 % * 0,789 = 19,7 g

### 2. Resorption und Abbau
- Resorption: linear ueber 0,75 h (Trinkvolumen im oberen Duenndarm,
  Austauschgeschwindigkeit ca. 1,3 g/h/kg Fluessigkeit; 45 min bis zur
  vollstaendigen Aufnahme ist der Literatur-Konsens fuer grosse Portionen).
- Elimination: linear 0,15 Promille/h (Literatur-Spanne 0,10-0,20;
  Jones 2010, Forensic Sci Int 200:1-20). Wir rechnen konservativ mit dem
  Mittel, nicht mit dem Optimum.
- BAC(t) = Summe ueber alle Drinks [aufgenommen(t) - 0,15/h * Zeit], min 0.

### 3. Die drei Kater-Grenzen
Ein Plan gilt nur, wenn ALLES gleichzeitig gilt:

1. **Peak <= Empfindlichkeits-Limit** (0,6 / 0,8 / 1,0 Promille):
   Die Hangover-Forschung zeigt durchgaengig: Katerrisiko und -schwere
   korrelieren mit der maximalen BAC (Wiese et al. 2000, Ann Intern Med).
2. **Gesamtmenge <= 0,6 / 0,8 / 1,0 g pro kg Koerpergewicht**:
   Die Leber metabolisiert Ethanol nullter Ordnung mit fixer Rate
   (~7-10 g/h, ADH-Kapazitaet). Wer die Gesamtdosis erhoeht, verlaengert
   die Acetaldehyd-Exposition und verschlechtert die Fluessigkeitsbilanz -
   die beiden Haupttreiber des Katers. (Begrifflich gestuetzt auf
   Verster et al. 2010, Curr Drug Abuse Rev; die g/kg-Zahlen selbst sind
   konservative Setzungen dieser App, keine Laborwerte.)
3. **Beim Aufwachen <= 0,05 Promille** (ausgeschlafen = nuechtern):
   Restalkohol beim Aufwachen ist Kater-Garantie (Verster et al. 2010).

### 4. Der Solver
`planBerechnen()` probiert Getraenkeanzahlen n = 1..25 gleichmaessig ueber
die Trinkzeit verteilt und waehlt das groesste n, das alle drei Grenzen
haelt. Greedy, deterministisch, in <1 ms durch.

### 5. Wasser-Regel
Pro 10 g Ethanol ~100 ml zusaetzlicher Fluessigkeitsverlust
(ADH-Hemmung, Eggleton 1942, J Physiol 101:172). Deshalb der Plan-Hinweis:
ein grosses Glas Wasser pro Drink.

## Dateien
- `calculator.js` - reine Rechenlogik (Widmark, Kurve, Solver), UMD-guarded: laeuft in Node (Tests) und Browser
- `app.js` - UI: 3-View-Wizard, Glaeser-Buehne, SVG-Kurve, Wissenschafts-Herleitung mit eingesetzten Werten
- `index.html` / `style.css` - dunkle Bar-Aesthetik (Fraunces + IBM Plex)
- `test.js` - Rechen-Tests (node test.js)
- `test-dom.js` - jsdom-Smoke-Test des echten Klickpfads (node test-dom.js)

## Grenzen des Modells (ehrlich)
- Individuelle Streuung der Eliminationsrate +/-20 % ist normal.
- Essen, Medikamente, Gewoehnung, Schlafqualitaet und Konstitutionsfaktoren
  (Watson-Formel nutzt zusaetzlich Groesse) sind nicht drin.
- Kater ist multifaktoriell (u.a. Congener, Schlafstoerung, Zigaretten,
  Stress). Die App minimiert die zwei groessten Hebel: Dosis und Timing.
- Kein medizinischer Rat. Am Steuer gilt 0,0.

## Deploy
Statisch nach /var/www/katerfrei auf gemivo (nginx katerfrei.gemivo.de),
siehe Skill gemivo-deploy.
