// Katerfrei - Alkohol-Rechner (Widmark-Modell, lineare Elimination)
// Reine Logik, kein DOM -> testbar mit node.

const DICHTE = 0.789;          // Alkohol-Dichte g/ml
const ABBAU = 0.15;            // Promille-Abbau pro Stunde (Spanne 0.1-0.2)
const RESORPTION_H = 0.75;     // Std. bis ein Drink voll im Blut ist
const WAKE_TOLERANZ = 0.05;    // Rest-Promille beim Aufwachen, die als "0" gilt

const GETRAENKE = [
  { id: 'bier',      name: 'Bier',           detail: '0,5 l · 5 %',    ml: 500, vol: 5.0 },
  { id: 'weizen',    name: 'Weizen',         detail: '0,5 l · 5,6 %',  ml: 500, vol: 5.6 },
  { id: 'radler',    name: 'Radler',         detail: '0,5 l · 2,5 %',  ml: 500, vol: 2.5 },
  { id: 'wein',      name: 'Wein',           detail: '0,2 l · 12,5 %', ml: 200, vol: 12.5 },
  { id: 'sekt',      name: 'Sekt',           detail: '0,1 l · 11 %',   ml: 100, vol: 11 },
  { id: 'aperol',    name: 'Aperol Spritz',  detail: '0,3 l · 11 %',   ml: 300, vol: 11 },
  { id: 'longdrink', name: 'Longdrink',      detail: '0,2 l · 10 %',   ml: 200, vol: 10 },
  { id: 'shot',      name: 'Kurzer',         detail: '2 cl · 40 %',    ml: 20,  vol: 40 },
];

const EMPFINDLICHKEIT = [
  { id: 'zart',  name: 'zartbesaitet', peak: 0.6, gProKg: 0.6 },
  { id: 'normal', name: 'normal',      peak: 0.8, gProKg: 0.8 },
  { id: 'robust', name: 'robust',      peak: 1.0, gProKg: 1.0 },
];

function verteilFaktor(geschlecht) {
  if (geschlecht === 'w') return 0.55;
  if (geschlecht === 'm') return 0.68;
  return 0.61; // ohne Angabe: Mitte
}

function alkoholGramm(ml, volProzent) {
  return ml * (volProzent / 100) * DICHTE;
}

// Promille-Zuwachs eines Drinks (vollstaendig resorbiert), Widmark
function promilleZuwachs(gramm, geschlecht, gewicht) {
  return gramm / (gewicht * verteilFaktor(geschlecht));
}

// BAC-Kurve: Drinks wirken linear ueber RESORPTION_H, parallel laeuft der Abbau.
// drinkTimesStd: Startzeiten der Drinks in Stunden ab Trinkbeginn.
// Rueckgabe: Array {t, bac} im 5-Minuten-Raster bis bisStd.
function bacVerlauf(drinkTimesStd, grammProDrink, geschlecht, gewicht, bisStd) {
  const d = promilleZuwachs(grammProDrink, geschlecht, gewicht);
  const punkte = [];
  const schritt = 5 / 60;
  for (let t = 0; t <= bisStd + 1e-9; t += schritt) {
    let bac = 0;
    for (const t0 of drinkTimesStd) {
      if (t <= t0) continue;
      const aufgenommen = d * Math.min(1, (t - t0) / RESORPTION_H);
      const abgebaut = ABBAU * (t - t0);
      bac += Math.max(0, aufgenommen - abgebaut);
    }
    punkte.push({ t, bac: Math.max(0, bac) });
  }
  return punkte;
}

// Maximaler Plan: n Drinks gleichmaessig ueber die Trinkzeit verteilen,
// so dass Peak <= Limit und BAC beim Aufwachen ~0.
// trinkMin/schlafMin in Minuten. Rueckgabe: Plan oder null.
function planBerechnen({ geschlecht, gewicht, trinkMin, schlafMin, getraenk, peakLimit, grammGesamtLimit }) {
  const gramm = alkoholGramm(getraenk.ml, getraenk.vol);
  // Promille-Budget beim Einschlafen: was der Schlaf abbauen kann
  const abbauBudget = ABBAU * (schlafMin / 60);
  const limit = Math.min(peakLimit, abbauBudget);
  const gesamtMin = trinkMin + schlafMin;

  let beste = null;
  for (let n = 1; n <= 25; n++) {
    if (gramm * n > grammGesamtLimit) break; // Gesamtmenge = Kater-Treiber Nr. 1
    const zeiten = [];
    for (let i = 0; i < n; i++) zeiten.push((trinkMin / n) * i / 60);
    const kurve = bacVerlauf(zeiten, gramm, geschlecht, gewicht, gesamtMin / 60);
    const peak = Math.max(...kurve.map(p => p.bac));
    const wakeIdx = Math.round((gesamtMin / 60) / (5 / 60));
    const wake = kurve[Math.min(wakeIdx, kurve.length - 1)].bac;
    if (peak <= limit && wake <= WAKE_TOLERANZ) {
      beste = { anzahl: n, zeitenStd: zeiten, grammProDrink: gramm, grammGesamt: gramm * n,
        peakPromille: peak, wakePromille: wake, limitPromille: limit, kurve };
    } else {
      break;
    }
  }
  if (beste) {
    // Nur die Rest-Gradienten behalten, volle Kurve fuer SVG gleich mitgeben
    beste.trinkMin = trinkMin;
    beste.schlafMin = schlafMin;
  }
  return beste;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DICHTE, ABBAU, RESORPTION_H, WAKE_TOLERANZ, GETRAENKE,
    EMPFINDLICHKEIT, verteilFaktor, alkoholGramm, promilleZuwachs,
    bacVerlauf, planBerechnen };
}
