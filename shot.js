const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto("https://katerfrei.gemivo.de?v=" + Date.now(), { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  const check = await p.evaluate(async () => {
    const sw = navigator.serviceWorker ? !!(await navigator.serviceWorker.getRegistration()) : false;
    const l = document.querySelector('link[rel="manifest"]');
    const man = l ? await (await fetch(l.href, { cache: "no-store" })).json() : null;
    return { sw, name: man && man.short_name, display: man && man.display, icons: man && man.icons.length };
  });
  console.log(JSON.stringify(check));
  await b.close();
})();
