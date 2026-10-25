const { chromium } = require("playwright");
const fs = require("fs");
const full = fs.readFileSync("design/icon-full.svg", "utf8");
const fg = fs.readFileSync("design/icon-fg.svg", "utf8");
const page = (html, size, radius, path, transparent) => `<!doctype html><meta charset="utf8">
<style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;background:transparent}</style>
<div style="width:${size}px;height:${size}px;border-radius:${radius}px;overflow:hidden;display:${transparent?"block":"flex"}">${html}</div>`;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ deviceScaleFactor: 1 })).newPage();
  const jobs = [
    // [name, svg, size, radius%, transparent, scale]
    ["icon-512.png", full, 512, 512 * 0.22, false],
    ["icon-192.png", full, 192, 192 * 0.22, false],
    ["apple-touch-icon.png", full, 180, 0, false],
    ["icon-maskable-512.png", full, 512, 0, false],
  ];
  for (const [name, svg, size, radius] of jobs) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(svgWrap(svg, size, radius), { waitUntil: "load" });
    await p.waitForTimeout(150);
    await p.screenshot({ path: "design/" + name });
    console.log("OK " + name);
  }
  // Android foreground: transparent, Motiv auf 66% Safe-Zone zentriert
  for (const [name, size] of [["fg-432.png", 432], ["fg-324.png", 324], ["fg-216.png", 216], ["fg-162.png", 162], ["fg-108.png", 108]]) {
    await p.setViewportSize({ width: size, height: size });
    const inner = Math.round(size * 0.66);
    await p.setContent(`<!doctype html><meta charset="utf8"><style>*{margin:0;padding:0}html,body{background:transparent}</style>
      <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center"><div style="width:${inner}px;height:${inner}px;border-radius:0;overflow:hidden">${fg}</div></div>`, { waitUntil: "load" });
    await p.waitForTimeout(150);
    await p.screenshot({ path: "design/" + name, omitBackground: true });
    console.log("OK " + name);
  }
  await b.close();
})();
function svgWrap(svg, size, radius) {
  return `<!doctype html><meta charset="utf8"><style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;background:transparent}</style>
  <div style="width:${size}px;height:${size}px;border-radius:${radius}px;overflow:hidden"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">${svg.replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg></div>`;
}
