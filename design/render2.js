const { chromium } = require("playwright");
const fs = require("fs");
const full = fs.readFileSync("design/icon-full.svg", "utf8");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ deviceScaleFactor: 1 })).newPage();
  for (const [size, round] of [[48,false],[72,false],[96,false],[144,false],[192,false],[48,true],[72,true],[96,true],[144,true],[192,true]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<!doctype html><meta charset="utf8"><style>*{margin:0;padding:0}html,body{background:transparent}</style>
      <div style="width:${size}px;height:${size}px;border-radius:${round ? 50 : size * 0.22}px;overflow:hidden"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">${full.replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg></div>`, { waitUntil: "load" });
    await p.waitForTimeout(120);
    await p.screenshot({ path: `design/legacy-${round ? "round" : "sq"}-${size}.png` });
  }
  await b.close(); console.log("LEGACY_OK");
})();
