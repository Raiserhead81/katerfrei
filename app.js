// Katerfrei - UI-Logik. Nutzt die globalen Funktionen aus calculator.js.
"use strict";

const $ = (sel) => document.querySelector(sel);
const LS_KEY = "katerfrei-v1";

const state = {
  profil: { geschlecht: null, alter: 30, gewicht: 75 },
  abend: { getraenk: "bier", start: "", schlafen: "23:30", aufwachen: "07:00", empfind: "normal" },
};

// ---------- Getraenk-Icons (inline SVG) ----------
const ICONS = {
  bier: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 4h10l-1 15a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2L7 4z"/><path d="M8.5 10h7M9 14h6" /><path d="M17 6h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1.4"/></svg>',
  wein: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 3h10l-1.2 8a4 4 0 0 1-3.8 3.2A4 4 0 0 1 8.2 11L7 3z"/><path d="M12 14v6M8.5 20h7"/></svg>',
  cocktail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5h16l-8 9-8-9z"/><path d="M12 14v6M8 20h8"/><path d="M14 3l-1.5 2M17 2l-1 2.5"/></svg>',
  shot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M5 4h14"/></svg>',
};
const ICON_ZUORDNUNG = { bier: "bier", weizen: "bier", radler: "bier", wein: "wein", sekt: "wein", aperol: "cocktail", longdrink: "cocktail", shot: "shot" };

// ---------- Persistenz ----------
function laden() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.profil) Object.assign(state.profil, s.profil);
    if (s.abend) Object.assign(state.abend, s.abend);
  } catch (e) { /* egal */ }
}
function speichern() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

// ---------- Views ----------
const views = ["view-setup", "view-plan", "view-ergebnis"];
function zeige(id) {
  for (const v of views) $("#" + v).hidden = v !== id;
  $("#" + id).hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Setup-View ----------
function segmentLogik(sel, initial, cb) {
  const box = $(sel);
  const set = (v) => {
    for (const b of box.querySelectorAll("button")) b.setAttribute("aria-checked", String(b.dataset.v === v));
    cb(v);
  };
  box.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) set(b.dataset.v);
  });
  if (initial) set(initial);
  return set;
}

function initSetup() {
  const inpAlter = $("#inp-alter"), inpGew = $("#inp-gewicht");
  const syncSliderFill = (el) => {
    const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty("--fill", pct + "%");
  };
  inpAlter.addEventListener("input", () => {
    state.profil.alter = +inpAlter.value;
    $("#out-alter").textContent = inpAlter.value;
    $("#warn-u18").hidden = inpAlter.value >= 18;
    syncSliderFill(inpAlter); speichern();
  });
  inpGew.addEventListener("input", () => {
    state.profil.gewicht = +inpGew.value;
    $("#out-gewicht").textContent = inpGew.value + " kg";
    syncSliderFill(inpGew); speichern();
  });
  segmentLogik("#seg-geschlecht", state.profil.geschlecht, (v) => { state.profil.geschlecht = v; speichern(); });

  inpAlter.value = state.profil.alter; inpGew.value = state.profil.gewicht;
  $("#out-alter").textContent = state.profil.alter;
  $("#out-gewicht").textContent = state.profil.gewicht + " kg";
  $("#warn-u18").hidden = state.profil.alter >= 18;
  syncSliderFill(inpAlter); syncSliderFill(inpGew);

  $("#btn-weiter").addEventListener("click", () => {
    if (!state.profil.geschlecht) {
      state.profil.geschlecht = "x"; // keine Angabe ist valide
      segmentLogik("#seg-geschlecht", "x", () => {});
    }
    zeige("view-plan");
  });
}

// ---------- Plan-View ----------
function initPlan() {
  const liste = $("#getraenke-liste");
  for (const g of GETRAENKE) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "getraenk";
    b.dataset.id = g.id;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(g.id === state.abend.getraenk));
    b.innerHTML = ICONS[ICON_ZUORDNUNG[g.id]] + '<span class="g-name">' + g.name + "</span>" + '<span class="g-detail">' + g.detail + "</span>";
    liste.appendChild(b);
  }
  liste.addEventListener("click", (e) => {
    const b = e.target.closest(".getraenk");
    if (!b) return;
    state.abend.getraenk = b.dataset.id;
    for (const el of liste.children) el.setAttribute("aria-checked", String(el === b));
    speichern();
  });
  $("#inp-start").value = state.abend.start || defaultStart();
  $("#inp-schlafen").value = state.abend.schlafen;
  $("#inp-aufwachen").value = state.abend.aufwachen;
  for (const id of ["inp-start", "inp-schlafen", "inp-aufwachen"]) {
    $("#" + id).addEventListener("change", (e) => {
      state.abend[id.replace("inp-", "")] = e.target.value;
      speichern();
    });
  }
  segmentLogik("#seg-empfind", state.abend.empfind, (v) => { state.abend.empfind = v; speichern(); });

  $("#btn-edit-profil").addEventListener("click", () => zeige("view-setup"));
  $("#btn-rechnen").addEventListener("click", () => { berechnenUndZeigen(); });
}

function defaultStart() {
  const jetzt = new Date();
  const h = (jetzt.getHours() + 1) % 24; // naechste volle Stunde
  return String(h).padStart(2, "0") + ":00";
}

// "HH:MM" -> Minuten seit Mitternacht
function hmZuMin(s) { const [h, m] = s.split(":").map(Number); return h * 60 + m; }
function minZuHM(min) { min = ((min % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"); }

function abendDauerMin() {
  const start = hmZuMin($("#inp-start").value);
  const schlaf = hmZuMin($("#inp-schlafen").value);
  const wake = hmZuMin($("#inp-aufwachen").value);
  let trink = schlaf - start;
  if (trink <= 0) trink += 1440; // ueber Mitternacht trinken
  let schlafDauer = wake - schlaf;
  if (schlafDauer <= 0) schlafDauer += 1440;
  return { start, trink, schlafDauer };
}

// ---------- Berechnung + Ergebnis ----------
function berechnenUndZeigen() {
  const getraenk = GETRAENKE.find((g) => g.id === state.abend.getraenk);
  const empfind = EMPFINDLICHKEIT.find((e) => e.id === state.abend.empfind);
  const { start, trink, schlafDauer } = abendDauerMin();
  const plan = planBerechnen({
    geschlecht: state.profil.geschlecht,
    gewicht: state.profil.gewicht,
    trinkMin: trink,
    schlafMin: schlafDauer,
    getraenk,
    peakLimit: empfind.peak,
    grammGesamtLimit: state.profil.gewicht * empfind.gProKg,
  });

  zeige("view-ergebnis");
  glaeserBuehne(plan, getraenk);
  wissenschaftFuellen(plan, getraenk, empfind);
  if (!plan) {
    $("#out-budget").innerHTML = "Heiter bleiben.";
    $("#out-budget-sub").textContent = "Mit so wenig Schlaf und dieser Zeit passt kein Drink rein, ohne morgen zu leiden.";
    $("#out-peak").textContent = "-"; $("#out-gramm").textContent = "0 g"; $("#out-wake").textContent = minZuHM(start + trink + schlafDauer);
    $("#plan-liste").innerHTML = "";
    $("#out-stopp").innerHTML = "<b>Ohne Alkohol</b> wird das morgen ein guter Morgen.";
  } else {
    const singular = plan.anzahl === 1;
    $("#out-budget").innerHTML = '<span class="cnt">0</span> &times; ' + getraenk.name;
    countUp($("#out-budget .cnt"), plan.anzahl, 700);
    $("#out-budget-sub").textContent = singular ? "und du bist morgen frisch." : "und du bist morgen frisch.";
    const peakEl = $("#out-peak"), grammEl = $("#out-gramm");
    peakEl.innerHTML = "0&permil;"; grammEl.textContent = "0 g";
    countUp(peakEl, plan.peakPromille, 900, (v) => v.toFixed(1).replace(".", ",") + "&permil;");
    countUp(grammEl, plan.grammGesamt, 900, (v) => Math.round(v) + " g");
    $("#out-wake").textContent = minZuHM(start + trink + schlafDauer);

    // Plan-Liste
    const ul = $("#plan-liste");
    ul.innerHTML = "";
    plan.zeitenStd.forEach((tStd, i) => {
      const li = document.createElement("li");
      const uhr = minZuHM(start + Math.round(tStd * 60));
      li.innerHTML = '<span class="p-zeit">' + uhr + "</span>" +
        '<span class="p-was"><b>' + getraenk.name + (i === 0 ? " - langsam antrinken" : "") + "</b><span>dazu ein grosses Glas Wasser</span></span>" +
        '<span class="p-nr">' + (i + 1) + "/" + plan.anzahl + "</span>";
      ul.appendChild(li);
    });
    const letzte = minZuHM(start + Math.round(plan.zeitenStd[plan.zeitenStd.length - 1] * 60));
    $("#out-stopp").innerHTML = "Um <b>" + letzte + " Uhr</b> ist der letzte " + getraenk.name + " fertig. Danach nur noch Wasser - so hat dein Koerper bis <b>" + minZuHM(start + trink + schlafDauer) + " Uhr</b> Zeit, alles abzubauen.";
  }
  zeichneKurve(plan, start, trink, schlafDauer);
  speichern();
}

// ---------- BAC-Kurve (SVG) ----------
function zeichneKurve(plan, startMin, trinkMin, schlafMin) {
  const svg = $("#kurve");
  const W = 640, H = 240, PAD_L = 40, PAD_R = 14, PAD_T = 18, PAD_B = 26;
  const gesamtStd = (trinkMin + schlafMin) / 60;
  const kurve = plan ? plan.kurve : [];
  const yMax = Math.max(1, Math.ceil((plan ? plan.peakPromille : 0) * 1.3));
  const x = (t) => PAD_L + (t / gesamtStd) * (W - PAD_L - PAD_R);
  const y = (bac) => H - PAD_B - (bac / yMax) * (H - PAD_T - PAD_B);

  let g = "";
  // Skala + Gitter
  for (let v = 0; v <= yMax + 1e-9; v += 0.5) {
    g += '<line x1="' + PAD_L + '" y1="' + y(v) + '" x2="' + (W - PAD_R) + '" y2="' + y(v) + '" stroke="#3d2c1e" stroke-width="1" stroke-dasharray="1 4"/>' +
      '<text x="' + (PAD_L - 6) + '" y="' + (y(v) + 4) + '" fill="#b09878" font-size="10" text-anchor="end" font-family="IBM Plex Mono">' + v.toFixed(1).replace(".", ",") + "</text>";
  }
  // Trink- / Schlafzone
  g += '<rect x="' + x(trinkMin / 60) + '" y="' + PAD_T + '" width="' + (W - PAD_R - x(trinkMin / 60)) + '" height="' + (H - PAD_T - PAD_B) + '" fill="rgba(255,255,255,.02)"/>' +
    '<line x1="' + x(trinkMin / 60) + '" y1="' + PAD_T + '" x2="' + x(trinkMin / 60) + '" y2="' + (H - PAD_B) + '" stroke="#b09878" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>';
  // Zeitlabels
  g += '<text x="' + x(0) + '" y="' + (H - 8) + '" fill="#b09878" font-size="10" font-family="IBM Plex Mono">' + minZuHM(startMin) + "</text>" +
    '<text x="' + x(trinkMin / 60) + '" y="' + (H - 8) + '" fill="#b09878" font-size="10" text-anchor="middle" font-family="IBM Plex Mono">' + minZuHM(startMin + trinkMin) + "</text>" +
    '<text x="' + (W - PAD_R) + '" y="' + (H - 8) + '" fill="#8fbf6f" font-size="10" text-anchor="end" font-family="IBM Plex Mono">' + minZuHM(startMin + trinkMin + schlafMin) + "</text>";
  // Mond + Sonne
  g += '<text x="' + (x(trinkMin / 60) + 12) + '" y="' + (PAD_T + 12) + '" font-size="13">🌙</text>' +
    '<text x="' + (W - PAD_R - 14) + '" y="' + (PAD_T + 12) + '" font-size="13">☀️</text>';

  let pfad = "", flaeche = "";
  if (kurve.length) {
    pfad = "M" + kurve.map((p) => x(p.t).toFixed(1) + "," + y(p.bac).toFixed(1)).join(" L");
    flaeche = pfad + " L" + x(kurve[kurve.length - 1].t).toFixed(1) + "," + (H - PAD_B) + " L" + PAD_L + "," + (H - PAD_B) + " Z";
    // Drink-Marker
    for (const t0 of plan.zeitenStd) {
      const pt = kurve.reduce((a, b) => (Math.abs(b.t - t0) < Math.abs(a.t - t0) ? b : a));
      g += '<circle class="drink-dot" cx="' + x(pt.t) + '" cy="' + y(pt.bac) + '" r="4" fill="#f2a33c" stroke="#16100b" stroke-width="2"/>';
    }
    // Peak-Label
    const peakP = kurve.reduce((a, b) => (b.bac > a.bac ? b : a));
    g += '<text x="' + x(peakP.t) + '" y="' + (y(peakP.bac) - 10) + '" fill="#f2a33c" font-size="11" font-weight="600" text-anchor="middle" font-family="IBM Plex Mono">' + peakP.bac.toFixed(2).replace(".", ",") + "&permil; hoch</text>";
  }
  svg.innerHTML = '<defs><linearGradient id="amf" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#f2a33c" stop-opacity=".30"/><stop offset="1" stop-color="#f2a33c" stop-opacity="0"/></linearGradient></defs>' +
    g + '<path class="kurve-flaeche" d="' + flaeche + '" fill="url(#amf)"/>' +
    '<path class="kurve-linie" d="' + pfad + '" fill="none" stroke="#f2a33c" stroke-width="2.5" stroke-linejoin="round" pathLength="1"/>';
}

// ---------- Start ----------
laden();
initSetup();
initPlan();
if (state.profil.geschlecht) zeige(state.profil.geschlecht ? "view-plan" : "view-setup");

// ---------- Epik: Zaehler-Animation ----------
function countUp(el, ziel, dauer, fmt) {
  dauer = dauer || 750; fmt = fmt || ((v) => Math.round(v));
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dauer);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(ziel * e);
    if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(ziel);
  };
  requestAnimationFrame(tick);
}

// ---------- Epik: Glaeser-Buehne ----------
const GLAS_FARBEN = { bier: "#e8912d", weizen: "#e8a84e", radler: "#f0c766", wein: "#a3313f", sekt: "#e8c56a", aperol: "#e3572d", longdrink: "#e8a33c", shot: "#f2e8dc" };
function glasSvg(typ, farbe, i) {
  const cid = "clip" + i;
  const kopf = typ === "bier"
    ? '<svg viewBox="0 0 40 58"><defs><clipPath id="' + cid + '"><path d="M8 12h24l-2.3 36a4.5 4.5 0 0 1-4.5 4h-10.4a4.5 4.5 0 0 1-4.5-4z"/></clipPath></defs>' +
      '<g clip-path="url(#' + cid + ')"><g class="fluessigkeit" style="animation-delay:' + (0.15 + i * 0.22) + 's">' +
      '<rect x="5" y="22" width="30" height="34" fill="' + farbe + '"/>' +
      '<ellipse cx="20" cy="22.5" rx="15" ry="3.2" fill="#f7ecdc"/><ellipse cx="20" cy="21" rx="15" ry="3.4" fill="#fdf6ea" opacity=".9"/>' +
      '<circle class="blase b1" cx="14" cy="46" r="1.3" fill="#fdf6ea" opacity=".5"/><circle class="blase b2" cx="24" cy="50" r="1.1" fill="#fdf6ea" opacity=".4"/><circle class="blase b3" cx="20" cy="44" r="0.9" fill="#fdf6ea" opacity=".45"/></g></g>' +
      '<path d="M8 12h24l-2.3 36a4.5 4.5 0 0 1-4.5 4h-10.4a4.5 4.5 0 0 1-4.5-4z" fill="none" stroke="#f2a33c" stroke-width="2" stroke-linejoin="round"/></svg>'
    : typ === "wein"
    ? '<svg viewBox="0 0 40 58"><defs><clipPath id="' + cid + '"><path d="M10 10c0 9 3 13 10 13s10-4 10-13z"/></clipPath></defs>' +
      '<g clip-path="url(#' + cid + ')"><g class="fluessigkeit" style="animation-delay:' + (0.15 + i * 0.22) + 's"><rect x="8" y="14" width="24" height="10" fill="' + farbe + '"/></g></g>' +
      '<path d="M10 10c0 9 3 13 10 13s10-4 10-13zM20 23v14M13 48h14l-1.5-6h-11z" fill="none" stroke="#f2a33c" stroke-width="2" stroke-linejoin="round"/></svg>'
    : typ === "cocktail"
    ? '<svg viewBox="0 0 40 58"><defs><clipPath id="' + cid + '"><path d="M6 11h28L20 27z"/></clipPath></defs>' +
      '<g clip-path="url(#' + cid + ')"><g class="fluessigkeit" style="animation-delay:' + (0.15 + i * 0.22) + 's"><rect x="4" y="16" width="32" height="12" fill="' + farbe + '"/></g></g>' +
      '<path d="M6 11h28L20 27zM20 27v14M13 48h14l-1.5-6h-11z" fill="none" stroke="#f2a33c" stroke-width="2" stroke-linejoin="round"/></svg>'
    : '<svg viewBox="0 0 40 58"><defs><clipPath id="' + cid + '"><path d="M12 24h16l-1.5 24a3.5 3.5 0 0 1-3.5 3h-6a3.5 3.5 0 0 1-3.5-3z"/></clipPath></defs>' +
      '<g clip-path="url(#' + cid + ')"><g class="fluessigkeit" style="animation-delay:' + (0.15 + i * 0.22) + 's"><rect x="10" y="28" width="20" height="24" fill="' + farbe + '"/></g></g>' +
      '<path d="M12 24h16l-1.5 24a3.5 3.5 0 0 1-3.5 3h-6a3.5 3.5 0 0 1-3.5-3z" fill="none" stroke="#f2a33c" stroke-width="2" stroke-linejoin="round"/></svg>';
  return '<div class="glas-wrap">' + kopf + "</div>";
}
function glaeserBuehne(plan, getraenk) {
  const buehne = $("#glas-buehne");
  buehne.innerHTML = "";
  if (!plan) { buehne.classList.add("leer"); return; }
  buehne.classList.remove("leer");
  const typ = ICON_ZUORDNUNG[getraenk.id];
  const farbe = GLAS_FARBEN[getraenk.id] || "#e8912d";
  const max = 6;
  for (let i = 0; i < Math.min(max, plan.anzahl); i++) buehne.insertAdjacentHTML("beforeend", glasSvg(typ, farbe, i));
  if (plan.anzahl > max) buehne.insertAdjacentHTML("beforeend", '<div class="glas-wrap glas-mehr">+' + (plan.anzahl - max) + "</div>");
  const stempel = $("#stempel");
  stempel.hidden = true;
  setTimeout(() => { stempel.hidden = false; }, 350 + Math.min(max, plan.anzahl) * 220 + 250);
}

// ---------- Wissenschaft: Herleitung mit eingesetzten Werten ----------
function wissenschaftFuellen(plan, getraenk, empfind) {
  const p = state.profil;
  const r = verteilFaktor(p.geschlecht);
  const kw = p.gewicht * r;                       // Koerperwasser in kg
  const gramm = alkoholGramm(getraenk.ml, getraenk.vol);
  const bacProDrink = promilleZuwachs(gramm, p.geschlecht, p.gewicht);
  const dauer = abendDauerMin();
  const abbauImSchlaf = ABBAU * (dauer.schlafDauer / 60);
  const grenzG = p.gewicht * empfind.gProKg;

  const z = (v) => String(v).replace(".", ",");
  const sexTxt = p.geschlecht === "w" ? "weiblich (r = 0,55)" : p.geschlecht === "m" ? "maennlich (r = 0,68)" : "ohne Angabe (r = 0,61, Mitwert)";

  $("#wis-koerper").innerHTML =
    "Widmark-Modell: BAC = Alkohol in g / (Koerpergewicht &times; Verteilungsfaktor r)" +
    "<br>Bei dir: " + p.gewicht + " kg, " + sexTxt +
    "<br>&rarr; dein Verteilungsraum: " + p.gewicht + " kg &times; " + z(r.toFixed(2)) + " = <b>" + z(kw.toFixed(1)) + " kg</b> Koerperwasser.";

  $("#wis-drink").innerHTML =
    "Ein " + getraenk.name + " (" + getraenk.detail + ") enthaelt <b>" + z(gramm.toFixed(1)) + " g</b> reinsten Alkohol" +
    " (Volumen &times; Vol.% &times; Dichte 0,789 g/ml)." +
    "<br>&rarr; Promille-Sprung pro " + getraenk.name + ": " + gramm.toFixed(1) + " / " + kw.toFixed(1) + " = <b>" + z(bacProDrink.toFixed(2)) + "&permil;</b>";

  $("#wis-abbau").innerHTML =
    "Dein Koerper baut Alkohol nahezu konstant ab - im Mittel <b>0,15&permil; pro Stunde</b> (Literatur-Spanne 0,10-0,20&permil;/h, Jones 2010)." +
    "<br>In deinen " + z((dauer.schlafDauer / 60).toFixed(1)) + " h Schlaf baut er bis zu <b>" + z(abbauImSchlaf.toFixed(2)) + "&permil;</b> ab. Deshalb duerfen beim Einschlafen nur Reste uebrig sein, die die Nacht sicher schafft.";

  $("#wis-grenzen").innerHTML =
    "Der Plan haelt <b>drei</b> medizinische Grenzen gleichzeitig ein:" +
    "<br>1. <b>Peak &le; " + z(empfind.peak.toFixed(1)) + "&permil;</b> - je hoeher die Spitze, desto sicherer der Kater (Wiese et al. 2000, Ann Intern Med 132:897)." +
    "<br>2. <b>Gesamtmenge &le; " + Math.round(grenzG) + " g</b> (" + z(empfind.gProKg.toFixed(1)) + " g/kg Koerpergewicht bei \"" + empfind.name + "\") - deine Leber metabolisiert nur ~7-10 g/h (ADH/ALDH-Kapazitaet); drueber staust sich Acetaldehyd, der Hauptverdaechtige des Katers." +
    "<br>3. <b>0&permil; beim Aufwachen</b> (&le; 0,05&permil; Toleranz) - aufwachen mit Restalkohol ist Kater-Garantie (Verster et al., Curr Drug Abuse Rev 2010).";
}
