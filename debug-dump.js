const { JSDOM } = require("jsdom");
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
window.requestAnimationFrame = (cb) => setTimeout(() => cb(window.performance.now() + 16), 16);
window.cancelAnimationFrame = () => {};
window.scrollTo = () => {};
const calcSrc = fs.readFileSync("calculator.js", "utf8").replace(/if \(typeof module[\s\S]*$/, "");
window.eval(calcSrc + "\n" + fs.readFileSync("app.js", "utf8"));
const $ = (s) => window.document.querySelector(s);
const klick = (el) => el.dispatchEvent(new window.Event("click", { bubbles: true }));

klick($('#seg-geschlecht button[data-v="m"]'));
$("#inp-gewicht").value = "80";
$("#inp-gewicht").dispatchEvent(new window.Event("input", { bubbles: true }));
klick($("#btn-weiter"));
klick(window.document.querySelector('.getraenk[data-id="wein"]'));
klick(window.document.querySelector('.getraenk[data-id="shot"]'));
klick($("#btn-rechnen"));
setTimeout(() => {
  ["#out-budget", "#out-budget-sub", "#out-stopp", "#out-wake"].forEach(s => console.log(s + " =>", $(s).textContent.trim().slice(0, 170)));
  console.log("plan-liste =>", [...window.document.querySelectorAll("#plan-liste li")].map(li => li.textContent.replace(/\s+/g, " ").trim()).join(" | "));
  klick($("#btn-von-vorn"));
  setTimeout(() => console.log("nach btn-von-vorn: view-plan sichtbar =", !$("#view-plan").hidden), 50);
}, 1100);
