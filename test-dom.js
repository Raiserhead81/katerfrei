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
check("Bier vorausgewaehlt", window.document.querySelector('.getraenk[data-id="bier"]').getAttribute("aria-checked") === "true");
klick(window.document.querySelector('.getraenk[data-id="wein"]'));
$("#inp-start").value = "19:00"; $("#inp-start").dispatchEvent(new window.Event("change", { bubbles: true }));
$("#inp-schlafen").value = "23:00"; $("#inp-schlafen").dispatchEvent(new window.Event("change", { bubbles: true }));
$("#inp-aufwachen").value = "07:00"; $("#inp-aufwachen").dispatchEvent(new window.Event("change", { bubbles: true }));
klick($("#btn-rechnen"));
check("View-Wechsel zu Ergebnis", !$("#view-ergebnis").hidden);

// 3) Ergebnis
setTimeout(() => {
  check("Budget enthaelt x Wein", $("#out-budget").textContent.includes("Wein"));
  const n = window.document.querySelectorAll("#plan-liste li").length;
  check("Plan-Liste hat " + n + " Eintraege (>0)", n > 0);
  check("Stopp-Uhrzeit gesetzt", $("#out-stopp").textContent.includes("Uhr"));
  check("Kurve gezeichnet (Pfad vorhanden)", !!window.document.querySelector("#kurve .kurve-linie"));
  check("Glaeser auf der Buehne", window.document.querySelectorAll(".glas-wrap").length === Math.min(6, n));
  check("Wissenschaft: Koerperwasser 54,4 kg", $("#wis-koerper").textContent.includes("54,4"));
  check("Wissenschaft: Grenzen 1-3", $("#wis-grenzen").textContent.includes("drei"));
  check("Quellen vorhanden (6)", window.document.querySelectorAll(".quellen li").length === 6);
  check("localStorage gespeichert", !!window.localStorage.getItem("katerfrei-v1"));

  // 4) Grenzfall: Extremkurzer Abend -> kein Plan
  klick($("#btn-zurueck-plan"));
  $("#inp-schlafen").value = "19:40"; $("#inp-schlafen").dispatchEvent(new window.Event("change", { bubbles: true }));
  $("#inp-aufwachen").value = "20:40"; $("#inp-aufwachen").dispatchEvent(new window.Event("change", { bubbles: true }));
  klick($("#btn-rechnen"));
  setTimeout(() => {
    const kein = $("#out-budget").textContent.includes("Heiter") || window.document.querySelectorAll("#plan-liste li").length === 0;
    check("Kurzschlaefer-Abend abgefangen", kein);
    console.log(fehler ? fehler + " FEHLER" : "ALLE PASS");
    process.exit(fehler ? 1 : 0);
  }, 100);
}, 100);
