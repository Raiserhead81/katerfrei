const c = require('./calculator');
const G = Object.fromEntries(c.GETRAENKE.map(g => [g.id, g]));
const EMP = Object.fromEntries(c.EMPFINDLICHKEIT.map(e => [e.id, e]));
// grammGesamtLimit = gProKg * kg, wie die UI es uebergibt (Doppel-Grenze: Peak + Gesamtmenge)
// schlafMin default: 5h nach letztem Drink nuechtern (Worst-Case-Nacht, keine Nutzereingabe mehr)
const cases = [
  { name: 'Mann 80kg, 4h Abend, normal, nur Bier',
    args: { geschlecht: 'm', gewicht: 80, trinkMin: 240, getraenke: [G.bier], peakLimit: EMP.normal.peak, grammGesamtLimit: 80 * EMP.normal.gProKg } },
  { name: 'Frau 60kg, 4h Abend, normal, nur Bier',
    args: { geschlecht: 'w', gewicht: 60, trinkMin: 240, getraenke: [G.bier], peakLimit: EMP.normal.peak, grammGesamtLimit: 60 * EMP.normal.gProKg } },
  { name: 'Mann 90kg, 5h Abend, robust, nur Weizen',
    args: { geschlecht: 'm', gewicht: 90, trinkMin: 300, getraenke: [G.weizen], peakLimit: EMP.robust.peak, grammGesamtLimit: 90 * EMP.robust.gProKg } },
  { name: 'Mann 80kg, 4h Abend, normal, MIX Bier+Wein (round-robin)',
    args: { geschlecht: 'm', gewicht: 80, trinkMin: 240, getraenke: [G.bier, G.wein], peakLimit: EMP.normal.peak, grammGesamtLimit: 80 * EMP.normal.gProKg } },
  { name: 'Frau 55kg, 3h Abend, zart, MIX Sekt+Bier',
    args: { geschlecht: 'w', gewicht: 55, trinkMin: 180, getraenke: [G.sekt, G.bier], peakLimit: EMP.zart.peak, grammGesamtLimit: 55 * EMP.zart.gProKg } },
];
let fail = 0;
for (const t of cases) {
  const p = c.planBerechnen(t.args);
  if (!p) { console.log('FAIL (kein Plan):', t.name); fail++; continue; }
  const ok = p.peakPromille <= p.limitPromille + 1e-9 && p.wakePromille <= c.WAKE_TOLERANZ + 1e-9
    && p.grammGesamt <= t.args.grammGesamtLimit + 1e-9
    && p.items.length === p.anzahl && p.items.every(it => it.gramm > 0 && it.t >= 0 && it.t <= t.args.trinkMin / 60 + 1e-9)
    && p.nuechternStd <= (t.args.trinkMin + c.SCHLAF_ANNAHME_H * 60) / 60 + 1e-9;
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${t.name}\n  -> ${p.anzahl} Drinks (${p.items.map(i => i.getraenk.id).join(',')}), Peak ${p.peakPromille.toFixed(2)} (Limit ${p.limitPromille.toFixed(2)}), wake ${p.wakePromille.toFixed(3)}, ${p.grammGesamt.toFixed(0)} g, nuechternStd ${p.nuechternStd.toFixed(2)}`);
  if (!ok) fail++;
}
// Mix-Verifikation: round-robin verteilt wirklich beide Getraenke
const mix = c.planBerechnen({ geschlecht: 'm', gewicht: 80, trinkMin: 240, getraenke: [G.bier, G.wein], peakLimit: EMP.normal.peak, grammGesamtLimit: 80 * EMP.normal.gProKg });
const ids = new Set(mix.items.map(i => i.getraenk.id));
console.log(ids.size >= 2 && mix.anzahl >= 2 ? 'PASS' : 'FAIL', '| Mix enthaelt beide Getraenke:', [...ids].join(','));
if (ids.size < 2 || mix.anzahl < 2) fail++;
// Grenzfall: extrem kurzer Abend + zart + leicht -> vmtl. kein Plan
const grenz = c.planBerechnen({ geschlecht: 'w', gewicht: 50, trinkMin: 60, getraenke: [G.shot], peakLimit: EMP.zart.peak, grammGesamtLimit: 50 * EMP.zart.gProKg });
console.log(grenz ? `Kurz-Fall: ${grenz.anzahl} Shot(s)` : 'Kurz-Fall: kein Plan');
// Kompatibilitaet: getraenk-Einzelobjekt ohne schlafMin
const single = c.planBerechnen({ geschlecht: 'm', gewicht: 80, trinkMin: 240, getraenk: G.bier, peakLimit: EMP.normal.peak, grammGesamtLimit: 80 * EMP.normal.gProKg });
console.log(single && single.schlafMin === c.SCHLAF_ANNAHME_H * 60 && single.anzahl >= 1 ? 'PASS' : 'FAIL', '| Einzel-Getraenk + schlafMin-Default', single ? `(${single.anzahl} Bier)` : '');
if (!single || single.schlafMin !== c.SCHLAF_ANNAHME_H * 60) fail++;
// Fit-Ziel: kuerzeres Abbaubudget schraenkt ein, laengeres erweitert nie ueber Gesamtlimit
const fBase = { geschlecht: 'm', gewicht: 80, trinkMin: 240, getraenke: [G.bier], peakLimit: EMP.normal.peak, grammGesamtLimit: 80 * EMP.normal.gProKg };
const fDef = c.planBerechnen({ ...fBase, schlafMin: 300 });
const fKurz = c.planBerechnen({ ...fBase, schlafMin: 120 });
const fLang = c.planBerechnen({ ...fBase, schlafMin: 480 });
console.log(fKurz.anzahl < fDef.anzahl ? 'PASS' : 'FAIL', '| Fit-Ziel kurz (2h Budget):', fKurz.anzahl, 'statt', fDef.anzahl);
if (!(fKurz.anzahl < fDef.anzahl)) fail++;
console.log(fLang.anzahl >= fDef.anzahl ? 'PASS' : 'FAIL', '| Fit-Ziel lang (8h Budget):', fLang.anzahl, '>=', fDef.anzahl);
if (!(fLang.anzahl >= fDef.anzahl)) fail++;
process.exit(fail ? 1 : 0);
