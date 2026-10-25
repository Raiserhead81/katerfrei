const c = require('./calculator');
const bier = c.GETRAENKE.find(g => g.id === 'bier');
const EMP = Object.fromEntries(c.EMPFINDLICHKEIT.map(e => [e.id, e]));
// grammGesamtLimit = gProKg * kg, wie die UI es uebergibt (Doppel-Grenze: Peak + Gesamtmenge)
const cases = [
  { name: 'Mann 80kg, 4h trinken, 8h Schlaf, normal (0.8) -> erwartet 3 Bier, 59 g',
    args: { geschlecht: 'm', gewicht: 80, trinkMin: 240, schlafMin: 480, getraenk: bier, peakLimit: EMP.normal.peak, grammGesamtLimit: 80 * EMP.normal.gProKg },
    erw: { anzahl: 3, gramm: 59 } },
  { name: 'Frau 60kg, 4h trinken, 8h Schlaf, normal (0.8) -> erwartet 2 Bier, 39 g',
    args: { geschlecht: 'w', gewicht: 60, trinkMin: 240, schlafMin: 480, getraenk: bier, peakLimit: EMP.normal.peak, grammGesamtLimit: 60 * EMP.normal.gProKg },
    erw: { anzahl: 2, gramm: 39 } },
  { name: 'Mann 90kg, 5h, 9h Schlaf, robust, Weizen -> erwartet 4 Drinks, 88 g',
    args: { geschlecht: 'm', gewicht: 90, trinkMin: 300, schlafMin: 540,
      getraenk: c.GETRAENKE.find(g => g.id === 'weizen'), peakLimit: EMP.robust.peak, grammGesamtLimit: 90 * EMP.robust.gProKg },
    erw: { anzahl: 4, gramm: 88 } },
  { name: 'Frau 55kg, zart, Wein, 3h/8h -> nur Gesamtbudget 33 g zulassen',
    args: { geschlecht: 'w', gewicht: 55, trinkMin: 180, schlafMin: 480,
      getraenk: c.GETRAENKE.find(g => g.id === 'wein'), peakLimit: EMP.zart.peak, grammGesamtLimit: 55 * EMP.zart.gProKg },
    erw: null },
];
let fail = 0;
for (const t of cases) {
  const p = c.planBerechnen(t.args);
  if (!p) { console.log('FAIL (kein Plan):', t.name); fail++; continue; }
  const ok = p.peakPromille <= p.limitPromille + 1e-9 && p.wakePromille <= c.WAKE_TOLERANZ + 1e-9
    && (!t.erw || (p.anzahl === t.erw.anzahl && Math.abs(p.grammGesamt - t.erw.gramm) < 1.5));
  const mono = p.kurve.length > 0 && p.peakPromille > 0;
  console.log(`${ok && mono ? 'PASS' : 'FAIL'} | ${t.name}\n  -> ${p.anzahl} Drinks, Peak ${p.peakPromille.toFixed(2)} (Limit ${p.limitPromille.toFixed(2)}), beim Aufwachen ${p.wakePromille.toFixed(3)} Promille, ${p.grammGesamt.toFixed(0)} g Alkohol`);
  if (!ok || !mono) fail++;
}
// Grenzfall: extremer Kurzschlaefer
const kurz = c.planBerechnen({ geschlecht: 'm', gewicht: 80, trinkMin: 60, schlafMin: 120, getraenk: bier, peakLimit: EMP.normal.peak, grammGesamtLimit: 80 * EMP.normal.gProKg });
console.log('Kurz-Fall (1h trinken/2h Schlaf):', kurz ? `${kurz.anzahl} Bier, wake ${kurz.wakePromille.toFixed(2)}` : 'PASS (kein Plan)');
process.exit(fail ? 1 : 0);
