// DOM-Smoke-Test: echter Klickpfad durch die App (jsdom)
const { JSDOM } = require("jsdom");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const dom = new JSDOM(html, {
  url: "http://localhost/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const { window } = dom;
// rAF-Stubs (jsdom hat keinen)
window.requestAnimationFrame = (cb) => setTimeout(() => cb(window.performance.now() + 16), 16);
window.cancelAnimationFrame = () => {};
window.scrollTo = () => {};

// Beide Skripte in EINEM gemeinsamen Scope (wie im Browser ueber zwei <script>-Tags)
const calcSrc = fs.readFileSync("calculator.js", "utf8").replace(/if \(typeof module[\s\S]*$/, "");
window.eval(calcSrc + "\n" + fs.readFileSync("app.js", "utf8"));

const $ = (s) => window.document.querySelector(s);
const klick = (el) => el.dispatchEvent(new window.Event("click", { bubbles: true }));
let fehler = 0;
const check = (name, cond) => { console.log((cond ? "PASS" : "FAIL") + " | " + name); if (!cond) fehler++; };

// 1) Setup
klick($('#seg-geschlecht button[data-v="m"]'));
$("#inp-gewicht").value = "80";
$("#inp-gewicht").dispatchEvent(new window.Event("input", { bubbles: true }));
check("Gewicht gesetzt (80 kg)", $("#out-gewicht").textContent === "80 kg");
klick($("#btn-weiter"));
check("View-Wechsel zu Plan", !$("#view-plan").hidden);

// 2) Plan
check("8 Getraenke gerendert", window.document.querySelectorAll(".getraenk").length === 8);
check("Bier vorausgewaehlt (Multi-Default)", window.document.querySelector('.getraenk[data-id="bier"]').getAttribute("aria-checked") === "true");
check("Letztes Getraenk bleibt an", (() => {
  klick(window.document.querySelector('.getraenk[data-id="bier"]')); // einziges -> kein Toggle
  return window.document.querySelector('.getraenk[data-id="bier"]').getAttribute("aria-checked") === "true";
})());
klick(window.document.querySelector('.getraenk[data-id="bier"]')); // wieder an
klick(window.document.querySelector('.getraenk[data-id="wein"]'));
klick(window.document.querySelector('.getraenk[data-id="shot"]'));
check("Wein + Shot dazugewaehlt (3 aktiv)", window.document.querySelectorAll('.getraenk[aria-checked="true"]').length === 3);
$("#inp-start").value = "19:00"; $("#inp-start").dispatchEvent(new window.Event("change", { bubbles: true }));
klick($('#seg-abend button[data-v="240"]')); // 4h Abend
klick($("#btn-rechnen"));
check("View-Wechsel zu Ergebnis", !$("#view-ergebnis").hidden);

// 3) Ergebnis (Mix: Bier + Wein + Shot)
setTimeout(() => {
  check("Budget zeigt Drinks (Mix)", $("#out-budget").textContent.includes("Drinks"));
  check("Mix-Aufschluesselung vorhanden", $("#out-budget-sub").textContent.includes("\u00d7"));
  const lis = window.document.querySelectorAll("#plan-liste li");
  check("Plan-Liste hat " + lis.length + " Eintraege (>0)", lis.length > 0);
  const namen = new Set([...lis].map((li) => li.querySelector(".p-was b").textContent.split(" - ")[0]));
  check("Plan-Liste enthaelt mehrere Getraenke", namen.size >= 2);
  check("Stopp-Uhrzeit + nuechtern", $("#out-stopp").textContent.includes("nuechtern"));
  check("Nuechtern-Uhrzeit (out-wake)", /^\d\d:\d\d$/.test($("#out-wake").textContent.replace("~", "")));
  check("Kurve gezeichnet (Pfad vorhanden)", !!window.document.querySelector("#kurve .kurve-linie"));
  check("Glaeser auf der Buehne (mix-farbig)", window.document.querySelectorAll(".glas-wrap svg").length === Math.min(6, lis.length));
  check("Wissenschaft: Koerperwasser 54,4 kg", $("#wis-koerper").textContent.includes("54,4"));
  check("Wissenschaft: Drinkliste mit Spruengen", $("#wis-drink").textContent.includes("Kurzer") && $("#wis-drink").textContent.includes("+"));
  check("Wissenschaft: Worst-Case 5 h erklaert", $("#wis-abbau").textContent.includes("5 h"));
  check("Wissenschaft: Grenzen 1-3", $("#wis-grenzen").textContent.includes("drei"));
  check("Quellen vorhanden (8)", window.document.querySelectorAll(".quellen li").length === 8);
  check("localStorage v2 gespeichert", !!window.localStorage.getItem("katerfrei-v2"));

  // 3b) Fit-Ziel 06:00 -> Stopp-Text + dynamische Wissenschaft + Kurve
  klick($("#btn-zurueck-plan"));
  $("#inp-fit").value = "06:00"; $("#inp-fit").dispatchEvent(new window.Event("change", { bubbles: true }));
  klick($("#btn-rechnen"));
  setTimeout(() => {
    check("Fit-Ziel im Stopp-Text (06:00)", $("#out-stopp").textContent.includes("06:00"));
    check("Wissenschaft: Fit-Ziel-Aufstellung", $("#wis-abbau").textContent.includes("Fit-Ziel") && $("#wis-abbau").textContent.includes("fit um"));
    check("Wissenschaft: REM-Schlaf-Hinweis", $("#wis-abbau").textContent.includes("REM"));
    check("Kurve endet auf fit-Label", $("#kurve").textContent.includes("fit"));

  // 4) Grenzfall: sehr kurzer Abend + zart -> evtl. kein/mini Plan
  klick($("#btn-zurueck-plan"));
  klick($('#seg-empfind button[data-v="zart"]'));
  klick($('#seg-abend button[data-v="120"]'));
  klick($("#btn-rechnen"));
  setTimeout(() => {
    const ok = window.document.querySelectorAll("#plan-liste li").length >= 0; // stuerzt nicht, zeigt irgendetwas
    check("Kurz-Abend-Fall laeuft ohne Crash", ok && !$("#view-ergebnis").hidden);

  // 5) Regression: Neuer-Abend-Button + Sub-Text mit erstem Drink
  klick($("#btn-von-vorn"));
  check("Neuer Abend: zurueck zum Plan", !$("#view-plan").hidden && $("#view-ergebnis").hidden);
  check("Neuer Abend: nur Bier gewaehlt, Fit-Feld leer",
    window.document.querySelector('.getraenk[data-id="bier"]').getAttribute("aria-checked") === "true" &&
    !$("#inp-fit").value);
  klick($("#btn-rechnen"));
  setTimeout(() => {
    check("Sub nennt ersten Drink (erster um)", $("#out-budget-sub").textContent.toLowerCase().includes("erster um"));
    check("Epik: Rang-Badge gefuellt", !$("#out-rang").hidden && $("#rang-badge").textContent.length > 3);
    check("Epik: Spruch dabei", $("#rang-spruch").textContent.length > 5);
    check("Epik: Teilen-Button da", !!$("#btn-share"));
    klick($("#btn-zurueck-plan"));
    check("Aendern-Button wechselt zum Plan", !$("#view-plan").hidden);
    console.log(fehler ? fehler + " FEHLER" : "ALLE PASS");
    process.exit(fehler ? 1 : 0);
  }, 120);
  }, 100);
}, 100);
}, 100);
