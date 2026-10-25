const { JSDOM } = require("jsdom");
const fs = require("fs");
const dom = new JSDOM(fs.readFileSync("index.html", "utf8"), { url: "http://localhost/", runScripts: "outside-only", pretendToBeVisual: true });
const w = dom.window;
w.requestAnimationFrame = (cb) => setTimeout(() => cb(w.performance.now() + 16), 16);
w.cancelAnimationFrame = () => {};
w.scrollTo = () => {};
w.eval(fs.readFileSync("calculator.js", "utf8").replace(/if \(typeof module[\s\S]*$/, "") + "\n" + fs.readFileSync("app.js", "utf8"));
const $ = (s) => w.document.querySelector(s);
const klick = (el) => el.dispatchEvent(new w.Event("click", { bubbles: true }));
klick($('#seg-geschlecht button[data-v="m"]'));
klick($("#btn-weiter"));
klick($("#btn-rechnen"));
setTimeout(() => {
  w.document.querySelectorAll("#view-ergebnis *").forEach((el) => {
    if (el.children.length === 0 && el.textContent.includes("\u2030")) console.log("[" + (el.id || el.className) + "] " + JSON.stringify(el.textContent));
  });
  console.log("SVG: " + JSON.stringify([...w.document.querySelectorAll("#view-ergebnis text")].map((t) => t.textContent).filter((t) => t.includes("\u2030"))));
}, 1200);
