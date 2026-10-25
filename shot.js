const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("https://gemivo.de/store/?" + Date.now(), { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const s1 = await p.evaluate(() => Array.from(document.querySelectorAll("#grid .card img")).map(i => i.src.split("/").pop().split("?")[0]));
  console.log("STORE:", s1.length, "Karten, katerfrei.png dabei:", s1.includes("katerfrei.png"), "| Fehler:", errs.length ? errs.join(";") : "keine");
  await p.goto("https://gemivo.de?v=" + Date.now(), { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const s2 = await p.evaluate(() => {
    const sec = document.getElementById("apps") || document.querySelector("main");
    return { karten: sec ? sec.querySelectorAll("a.card, .appcard, a[href*=katerfrei]").length : 0, katerfreiLink: !!document.querySelector('a[href*="katerfrei"]') };
  });
  console.log("STARTSEITE:", JSON.stringify(s2), "| Fehler:", errs.length ? errs.join(";") : "keine");
  await b.close();
})();
