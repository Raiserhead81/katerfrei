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
klick($("#btn-rechnen"));
setTimeout(() => {
  klick($("#btn-zurueck-plan"));
  $("#inp-fit").value = "06:00"; $("#inp-fit").dispatchEvent(new window.Event("change", { bubbles: true }));
  klick($("#btn-rechnen"));
  setTimeout(() => {
    klick($("#btn-zurueck-plan"));
    klick($('#seg-empfind button[data-v="zart"]'));
    klick($('#seg-abend button[data-v="120"]'));
    klick($("#btn-rechnen"));
    setTimeout(() => {
      console.log("kurzfall budget =>", $("#out-budget").textContent, "| sub =>", $("#out-budget-sub").textContent.slice(0, 80));
      klick($("#btn-von-vorn"));
      console.log("nach von-vorn: inp-start =", $("#inp-start").value, "| fit =", JSON.stringify($("#inp-fit").value), "| zart noch an:", $('#seg-empfind button[data-v="zart"]').getAttribute("aria-checked"));
      klick($("#btn-rechnen"));
      setTimeout(() => {
        console.log("endbudget =>", $("#out-budget").textContent, "| sub =>", $("#out-budget-sub").textContent);
      }, 200);
    }, 100);
  }, 100);
}, 300);
