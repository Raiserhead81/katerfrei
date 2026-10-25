// Katerfrei - UI-Logik. Nutzt die globalen Funktionen aus calculator.js.
"use strict";

const $ = (sel) => document.querySelector(sel);
const LS_KEY = "katerfrei-v2";

const state = {
  profil: { geschlecht: null, alter: 30, gewicht: 75 },
  abend: { getraenke: ["bier"], start: "", abendMin: 240, empfind: "normal", fit: "" },
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
    if (s.abend && Array.isArray(s.abend.getraenke) && s.abend.getraenke.length) {
      Object.assign(state.abend, s.abend);
    }
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
    b.setAttribute("role", "checkbox");
    b.setAttribute("aria-checked", String(state.abend.getraenke.includes(g.id)));
    b.innerHTML = ICONS[ICON_ZUORDNUNG[g.id]] + '<span class="g-name">' + g.name + "</span>" + '<span class="g-detail">' + g.detail + "</span>";
    liste.appendChild(b);
  }
  liste.addEventListener("click", (e) => {
    const b = e.target.closest(".getraenk");
    if (!b) return;
    const id = b.dataset.id;
    const aktiv = state.abend.getraenke.includes(id);
    if (aktiv && state.abend.getraenke.length === 1) return; // mind. 1 bleibt an
    state.abend.getraenke = aktiv
      ? state.abend.getraenke.filter((x) => x !== id)
      : state.abend.getraenke.concat(id);
    b.setAttribute("aria-checked", String(!aktiv));
    speichern();
  });
  $("#inp-start").value = state.abend.start || defaultStart();
  $("#inp-start").addEventListener("change", (e) => {
    state.abend.start = e.target.value;
    speichern();
  });
  $("#inp-fit").value = state.abend.fit || "";
  $("#inp-fit").addEventListener("change", (e) => {
    state.abend.fit = e.target.value;
    speichern();
  });
  segmentLogik("#seg-abend", String(state.abend.abendMin), (v) => { state.abend.abendMin = +v; speichern(); });
  segmentLogik("#seg-empfind", state.abend.empfind, (v) => { state.abend.empfind = v; speichern(); });

  $("#btn-edit-profil").addEventListener("click", () => zeige("view-setup"));
  $("#btn-rechnen").addEventListener("click", () => { berechnenUndZeigen(); });
  $("#btn-zurueck-plan").addEventListener("click", () => zeige("view-plan"));
  $("#btn-von-vorn").addEventListener("click", () => neuerAbend());
  $("#btn-share").addEventListener("click", teilePlan);
}

// "Neuer Abend": Abendeinstellungen zurueck auf Default, wieder zum Plan
// Teilen: Web Share API, Fallback Clipboard
function teilePlan() {
  const budget = $("#out-budget").textContent.replace(/\s+/g, " ").trim();
  const rang = $("#rang-badge").textContent;
  const text = budget + " - Rang: " + rang + ". Rechne deinen Abend selbst: https://katerfrei.gemivo.de";
  const btn = $("#btn-share");
  const fertig = () => { const alt = btn.textContent; btn.textContent = "Kopiert!"; setTimeout(() => { btn.textContent = alt; }, 1600); };
  if (navigator.share) {
    navigator.share({ title: "Katerfrei", text }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(fertig).catch(() => {});
  }
}

function neuerAbend() {
  state.abend = { getraenke: ["bier"], start: "", abendMin: 240, empfind: state.abend.empfind, fit: "" };
  window.document.querySelectorAll(".getraenk").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.id === "bier")));
  $("#inp-start").value = defaultStart();
  $("#inp-fit").value = "";
  for (const b of $("#seg-abend").querySelectorAll("button")) b.setAttribute("aria-checked", String(b.dataset.v === "240"));
  speichern();
  zeige("view-plan");
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
  let schlafMin = SCHLAF_ANNAHME_H * 60; // Worst-Case-Nacht, falls kein Fit-Ziel
  let fitMin = 0;
  if (state.abend.fit) {
    fitMin = hmZuMin(state.abend.fit);
    while (fitMin <= start + state.abend.abendMin) fitMin += 1440; // naechster Morgen
    schlafMin = fitMin - start - state.abend.abendMin;
  }
  return { start, trink: state.abend.abendMin, schlafMin, fitMin };
}

// ---------- Berechnung + Ergebnis ----------
function berechnenUndZeigen() {
  const getraenke = GETRAENKE.filter((g) => state.abend.getraenke.includes(g.id));
  const empfind = EMPFINDLICHKEIT.find((e) => e.id === state.abend.empfind);
  const { start, trink, schlafMin, fitMin } = abendDauerMin();
  const plan = planBerechnen({
    geschlecht: state.profil.geschlecht,
    gewicht: state.profil.gewicht,
    trinkMin: trink,
    getraenke,
    peakLimit: empfind.peak,
    grammGesamtLimit: state.profil.gewicht * empfind.gProKg,
    schlafMin,
  });

  zeige("view-ergebnis");
  glaeserBuehne(plan);
  setzeRang(plan);
  wissenschaftFuellen(plan, getraenke, empfind, { start, trink, schlafMin, fitMin });
  if (!plan && schlafMin < 30) {
    $("#out-budget").innerHTML = "Zu knapp.";
    $("#out-budget-sub").textContent = "Zwischen Feierabend und deinem Fit-Ziel um " + minZuHM(fitMin) + " Uhr bleibt keine Zeit zum Abbauen - heute wird das nix mit Alkohol.";
    $("#out-peak").textContent = "-"; $("#out-gramm").textContent = "0 g"; $("#out-wake").textContent = "--:--";
    $("#plan-liste").innerHTML = "";
    $("#out-stopp").innerHTML = "<b>Ohne Alkohol</b> wird das morgen ein guter Morgen - und du puenktlich fit.";
  } else if (!plan) {
    $("#out-budget").innerHTML = "Heiter bleiben.";
    $("#out-budget-sub").textContent = "So eng wie heute Abend passt kein Drink rein, ohne morgen zu leiden.";
    $("#out-peak").textContent = "-"; $("#out-gramm").textContent = "0 g"; $("#out-wake").textContent = "--:--";
    $("#plan-liste").innerHTML = "";
    $("#out-stopp").innerHTML = "<b>Ohne Alkohol</b> wird das morgen ein guter Morgen.";
  } else {
    // Budget-Zeile: "3 &times; Bier" oder "4 Drinks" + Mix-Aufschloesselung
    const counts = [];
    for (const g of getraenke) {
      const c = plan.items.filter((x) => x.getraenk.id === g.id).length;
      if (c) counts.push(c + " &times; " + g.name);
    }
    const misch = counts.length > 1;
    $("#out-budget").innerHTML = '<span class="cnt">0</span> ' + (misch ? "Drinks" : "&times; " + plan.items[0].getraenk.name);
    countUp($("#out-budget .cnt"), plan.anzahl, 700);
    const erster = minZuHM(start + Math.round(plan.items[0].t * 60));
    $("#out-budget-sub").innerHTML = (misch ? counts.join(" &middot; ") + " - d" : "D") + "ein erster um " + erster + " Uhr, und du bist morgen frisch.";
    const peakEl = $("#out-peak"), grammEl = $("#out-gramm");
    peakEl.textContent = "0\u2030"; grammEl.textContent = "0 g";
    countUp(peakEl, plan.peakPromille, 900, (v) => v.toFixed(1).replace(".", ",") + "\u2030");
    countUp(grammEl, plan.grammGesamt, 900, (v) => Math.round(v) + " g");
    const nuechtern = minZuHM(start + Math.ceil(plan.nuechternStd * 60 / 5) * 5);
    $("#out-wake").textContent = "~" + nuechtern;

    // Plan-Liste
    const ul = $("#plan-liste");
    ul.innerHTML = "";
    plan.items.forEach((it, i) => {
      const li = document.createElement("li");
      const uhr = minZuHM(start + Math.round(it.t * 60));
      const sub = i === 0 ? "vorher richtig etwas essen"
        : i === plan.items.length - 1 ? "danach Feierabend - Wasser & Salzstangen ans Bett"
        : "dazwischen ruhig mal ein alkoholfreies Getraenk";
      li.innerHTML = '<span class="p-zeit">' + uhr + "</span>" +
        '<span class="p-was"><b>' + it.getraenk.name + (i === 0 ? " - langsam antrinken" : "") + "</b><span>" + sub + "</span></span>" +
        '<span class="p-nr">' + (i + 1) + "/" + plan.anzahl + "</span>";
      ul.appendChild(li);
    });
    const letzte = minZuHM(start + Math.round(plan.items[plan.items.length - 1].t * 60));
    $("#out-stopp").innerHTML = fitMin
      ? "Um <b>" + letzte + " Uhr</b> ist der letzte Drink fertig - danach Feierabend. Dein Fit-Ziel um <b>" + minZuHM(fitMin) + " Uhr</b> sitzt: spaetestens um <b>" + nuechtern + " Uhr</b> bist du komplett nuechtern."
      : "Um <b>" + letzte + " Uhr</b> ist der letzte Drink fertig - danach Feierabend. Egal, wann du ins Bett kommst und wie lange du schlaefst: um <b>" + nuechtern + " Uhr</b> bist du komplett nuechtern.";
  }
  zeichneKurve(plan, start, trink, schlafMin, !!fitMin);
  speichern();
}

// ---------- BAC-Kurve (SVG) ----------
function zeichneKurve(plan, startMin, trinkMin, schlafMin = SCHLAF_ANNAHME_H * 60, fitAktiv = false) {
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
    '<text x="' + x(trinkMin / 60) + '" y="' + (H - 8) + '" fill="#b09878" font-size="10" text-anchor="middle" font-family="IBM Plex Mono">Feierabend</text>' +
    '<text x="' + (W - PAD_R) + '" y="' + (H - 8) + '" fill="#8fbf6f" font-size="10" text-anchor="end" font-family="IBM Plex Mono">' + minZuHM(startMin + trinkMin + schlafMin) + (fitAktiv ? " fit" : " nüchtern") + "</text>";
  // Mond + Sonne
  g += '<text x="' + (x(trinkMin / 60) + 12) + '" y="' + (PAD_T + 12) + '" font-size="13">🌙</text>' +
    '<text x="' + (W - PAD_R - 14) + '" y="' + (PAD_T + 12) + '" font-size="13">☀️</text>';

  let pfad = "", flaeche = "";
  if (kurve.length) {
    pfad = "M" + kurve.map((p) => x(p.t).toFixed(1) + "," + y(p.bac).toFixed(1)).join(" L");
    flaeche = pfad + " L" + x(kurve[kurve.length - 1].t).toFixed(1) + "," + (H - PAD_B) + " L" + PAD_L + "," + (H - PAD_B) + " Z";
    // Drink-Marker
    for (const it of plan.items) {
      const pt = kurve.reduce((a, b) => (Math.abs(b.t - it.t) < Math.abs(a.t - it.t) ? b : a));
      g += '<circle class="drink-dot" cx="' + x(pt.t) + '" cy="' + y(pt.bac) + '" r="4" fill="' + (GLAS_FARBEN[it.getraenk.id] || "#f2a33c") + '" stroke="#16100b" stroke-width="2"/>';
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
function glaeserBuehne(plan) {
  const buehne = $("#glas-buehne");
  buehne.innerHTML = "";
  if (!plan) { buehne.classList.add("leer"); return; }
  buehne.classList.remove("leer");
  const max = 6;
  plan.items.slice(0, max).forEach((it, i) => {
    buehne.insertAdjacentHTML("beforeend", glasSvg(ICON_ZUORDNUNG[it.getraenk.id], GLAS_FARBEN[it.getraenk.id] || "#e8912d", i));
  });
  if (plan.anzahl > max) buehne.insertAdjacentHTML("beforeend", '<div class="glas-wrap glas-mehr">+' + (plan.anzahl - max) + "</div>");
  const stempel = $("#stempel");
  stempel.hidden = true;
  setTimeout(() => { stempel.hidden = false; }, 350 + Math.min(max, plan.anzahl) * 220 + 250);
}

// ---------- Wissenschaft: Herleitung mit eingesetzten Werten ----------
// ---------- Epik: Rang + Spruch + Konfetti ----------
const RAENGE = [
  { max: 0.5, name: "Eiskalter Feldherr", sprueche: ["Der Kater wartet draussen im Regen.", "Wissenschaft 1, Kater 0.", "Du planst wie ein General und trinkst wie ein Kenner."] },
  { max: 0.8, name: "Feierabend-Stratege", sprueche: ["Trinken wie ein Stratege, schlafen wie ein Stein.", "Promille im Griff, Ehre unversehrt.", "Der Abend gehoert dir - und morgen auch."] },
  { max: 1.01, name: "Grenzgaenger mit Stil", sprueche: ["Knapp am Limit - aber mit Plan und Haltung.", "Volle Kraft, klare Rechnung.", "Du tanzt auf der Klinge und landest auf den Fuessen."] },
];
const RANG_NUECHTERN = { name: "Ehrenwacher Nuechterner", sprueche: ["Heute siegt der Verstand - staerker als jeder Drink.", "Null Promille, volle Ehre.", "Der klueste Drink ist manchmal kein Drink."] };

function setzeRang(plan) {
  const badge = $("#rang-badge"), spruch = $("#rang-spruch"), zeile = $("#out-rang"), fakten = $("#rang-fakten");
  if (!plan) {
    badge.textContent = RANG_NUECHTERN.name;
    spruch.textContent = RANG_NUECHTERN.sprueche[Math.floor(Math.random() * RANG_NUECHTERN.sprueche.length)];
    fakten.hidden = true;
  } else {
    const ratio = plan.peakPromille / plan.limitPromille;
    const rang = RAENGE.find((r) => ratio < r.max) || RAENGE[RAENGE.length - 1];
    badge.textContent = rang.name;
    spruch.textContent = rang.sprueche[Math.floor(Math.random() * rang.sprueche.length)];
    const frei = Math.max(0, Math.round((1 - ratio) * 100));
    fakten.textContent = "Peak " + plan.peakPromille.toFixed(2).replace(".", ",") + "\u2030 - " + frei + "% unter deinem Limit von " + plan.limitPromille.toFixed(2).replace(".", ",") + "\u2030.";
    fakten.hidden = false;
    starteKonfetti();
  }
  zeile.hidden = false;
}

function starteKonfetti() {
  const cv = $("#konfetti");
  const ctx = cv.getContext ? cv.getContext("2d") : null;
  if (!ctx) return;
  const el = cv.parentElement || {};
  const breit = el.offsetWidth || 0, hoch = el.offsetHeight || 0;
  if (!breit || !hoch) return; // unsichtbar (Tests/WebView-Vorlauf) -> kein Konfetti
  const dpr = window.devicePixelRatio || 1;
  cv.width = breit * dpr; cv.height = Math.min(340, Math.round(hoch * 0.5)) * dpr;
  cv.style.height = Math.min(340, Math.round(hoch * 0.5)) + "px";
  const farben = Object.values(GLAS_FARBEN);
  const teile = Array.from({ length: 70 }, () => ({
    x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.3,
    w: (5 + Math.random() * 5) * dpr, h: (8 + Math.random() * 6) * dpr,
    vy: (1.6 + Math.random() * 2.2) * dpr, vx: (Math.random() - 0.5) * 1.4 * dpr,
    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
    farbe: farben[Math.floor(Math.random() * farben.length)],
  }));
  const t0 = performance.now();
  const tick = (t) => {
    const vergh = (t - t0) / 1900;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, vergh - 0.6) / 0.4);
    for (const p of teile) {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.farbe; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (vergh < 1) requestAnimationFrame(tick); else ctx.clearRect(0, 0, cv.width, cv.height);
  };
  requestAnimationFrame(tick);
}

function wissenschaftFuellen(plan, getraenke, empfind, dauer) {
  const p = state.profil;
  const r = verteilFaktor(p.geschlecht);
  const kw = p.gewicht * r;                       // Koerperwasser in kg
  const grenzG = p.gewicht * empfind.gProKg;

  const z = (v) => String(v).replace(".", ",");
  const sexTxt = p.geschlecht === "w" ? "weiblich (r = 0,55)" : p.geschlecht === "m" ? "maennlich (r = 0,68)" : "ohne Angabe (r = 0,61, Mitwert)";

  $("#wis-koerper").innerHTML =
    "Widmark-Modell: BAC = Alkohol in g / (Koerpergewicht &times; Verteilungsfaktor r)" +
    "<br>Bei dir: " + p.gewicht + " kg, " + sexTxt +
    "<br>&rarr; dein Verteilungsraum: " + p.gewicht + " kg &times; " + z(r.toFixed(2)) + " = <b>" + z(kw.toFixed(1)) + " kg</b> Koerperwasser.";

  const drinkTxt = getraenke.map((g) => {
    const gramm = alkoholGramm(g.ml, g.vol);
    const sprung = promilleZuwachs(gramm, p.geschlecht, p.gewicht);
    return "<b>" + g.name + "</b> (" + g.detail + "): " + z(gramm.toFixed(1)) + " g &rarr; <b>+" + z(sprung.toFixed(2)) + "&permil;</b>";
  }).join("<br>");
  $("#wis-drink").innerHTML =
    "Alkoholmenge = Volumen &times; Vol.% &times; Dichte 0,789 g/ml - pro Getraenk deiner Auswahl:" +
    "<br>" + drinkTxt;

  const abbauTxt = dauer && dauer.fitMin
    ? "Dein Koerper baut Alkohol nahezu konstant ab - im Mittel <b>0,15&permil; pro Stunde</b> (Literatur-Spanne 0,10-0,20&permil;/h, Jones 2010)." +
      "<br>Dein Fit-Ziel: Feierabend um <b>" + minZuHM(dauer.start + dauer.trink) + " Uhr</b>, fit um <b>" + minZuHM(dauer.fitMin) + " Uhr</b> - das sind <b>" + z((dauer.schlafMin / 60).toFixed(1)) + " h</b> Abbauleistung, also bis zu <b>" + z((ABBAU * dauer.schlafMin / 60).toFixed(2)) + "&permil;</b> Reserve fuer die Nacht. Genauso hat der Plan gerechnet."
    : "Dein Koerper baut Alkohol nahezu konstant ab - im Mittel <b>0,15&permil; pro Stunde</b> (Literatur-Spanne 0,10-0,20&permil;/h, Jones 2010)." +
      "<br>Weil niemand vorher weiss, wann er ins Bett faellt, rechnet der Plan ohne Fit-Ziel mit der <b>Worst-Case-Nacht</b>: alles, was du trinkst, ist <b>5 h nach deinem letzten Drink</b> komplett abgebaut (0,15&permil;/h &times; 5 h = 0,75&permil; Reserve) - egal, wann du pennt und wie lange du schlaefst.";
  $("#wis-abbau").innerHTML = abbauTxt +
    "<br>Und egal, wie lang die Nacht ist: Alkohol im Blut waehrend des Schlafs unterdrueckt den REM-Schlaf und zerhackt die Schlafphasen - du wachst auch ohne Kater zerrupft auf (Ebrahim et al. 2013). N&uuml;chtern einschlafen ist deshalb doppelt wertvoll.";

  $("#wis-grenzen").innerHTML =
    "Der Plan haelt <b>drei</b> medizinische Grenzen gleichzeitig ein:" +
    "<br>1. <b>Peak &le; " + z(empfind.peak.toFixed(1)) + "&permil;</b> - je hoeher die Spitze, desto sicherer der Kater (Wiese et al. 2000, Ann Intern Med 132:897)." +
    "<br>2. <b>Gesamtmenge &le; " + Math.round(grenzG) + " g</b> (" + z(empfind.gProKg.toFixed(1)) + " g/kg Koerpergewicht bei \"" + empfind.name + "\") - deine Leber metabolisiert nur ~7-10 g/h (ADH/ALDH-Kapazitaet); drueber staust sich Acetaldehyd, der Hauptverdaechtige des Katers." +
    "<br>3. <b>0&permil; spaetestens 5 h nach dem letzten Drink</b> (&le; 0,05&permil; Toleranz) - mit Restalkohol im Schlaf aufwachen ist Kater-Garantie (Verster et al., Curr Drug Abuse Rev 2010).";
}

// --- PWA: Service Worker + Auto-Update ueber /VERSION (gemivo-Standard) ---
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then((reg) => {
      fetch("VERSION", { cache: "no-store" }).then((r) => r.text()).then((v) => {
        if (localStorage.getItem("kf-version") && localStorage.getItem("kf-version") !== v) {
          reg.update().then(() => location.reload());
        }
        localStorage.setItem("kf-version", v);
      }).catch(() => {});
    }).catch(() => {});
  });
}
