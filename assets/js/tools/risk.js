/* 206206.com — bone health risk check. Educational: counts recognized risk factors; it is not FRAX
   and not a diagnosis. Weighting: factors that guidelines and FRAX treat as strong get 2 points,
   other clinical factors 1, lifestyle factors 0.5. */
(function () {
  "use strict";
  var T = window.Tools, h = T.h;
  var form = T.$("form[data-risk]");
  if (!form) return;
  var out = T.$("[data-risk-result]");
  var KEY = "risk-check";

  function val(name) {
    var el = T.$("[name=" + name + "]:checked", form) || T.$("[name=" + name + "]", form);
    if (!el) return "";
    if (el.type === "radio" || el.type === "checkbox") return el.checked ? el.value : "";
    return el.value;
  }
  function checked(name, value) { return !!T.$("[name=" + name + "][value=\"" + value + "\"]:checked", form); }

  function bmi() {
    var unit = val("unit");
    var hgt, wgt;
    if (unit === "metric") {
      hgt = parseFloat(val("height_cm")) / 100;
      wgt = parseFloat(val("weight_kg"));
    } else {
      hgt = ((parseFloat(val("height_ft")) || 0) * 12 + (parseFloat(val("height_in")) || 0)) * 0.0254;
      wgt = (parseFloat(val("weight_lb")) || 0) * 0.45359237;
    }
    if (!(hgt > 0.9 && hgt < 2.5 && wgt > 25 && wgt < 350)) return null;
    return wgt / (hgt * hgt);
  }

  function evaluate() {
    var sex = val("sex"), age = val("age");
    var f = [];
    function add(points, text, cls) { f.push({ p: points, t: text, c: cls || (points >= 2 ? "major" : "") }); }

    if (age === "75+" || age === "65-74") {
      if (sex === "female") add(2, "Age 65 or older. The US Preventive Services Task Force recommends bone density screening for all women 65 and older.");
      else if (age === "75+") add(2, "Age 75 or older. Many bone health organizations suggest men talk about testing from about age 70.");
      else add(1, "Age 65 to 74. Bone loss speeds up with age in men too; many organizations suggest men talk about testing from about age 70.");
    } else if (age === "50-64") add(1, "Age 50 to 64: the age range when bone loss usually accelerates, especially after menopause.");

    if (checked("history", "fragility_fracture")) add(3, "A broken bone after age 50 from a fall from standing height or less. This is one of the strongest warning signs; a first fracture nearly doubles the risk of another.");
    if (checked("history", "parent_hip")) add(2, "A parent broke a hip. Family history is part of standard fracture-risk tools such as FRAX.");
    if (checked("history", "steroids")) add(2, "Steroid (glucocorticoid) tablets for three months or more, a well-known cause of bone loss.");
    if (checked("history", "height_loss")) add(2, "Height loss of 4 cm (1.5 in) or more, which can be a sign of spinal compression fractures.");
    if (checked("history", "ra")) add(1, "Rheumatoid arthritis, which is linked to bone loss and included in FRAX.");
    if (checked("history", "conditions")) add(1, "A condition or treatment that can affect bones (for example celiac or inflammatory bowel disease, an overactive thyroid, type 1 diabetes, kidney or liver disease, or hormone-blocking cancer treatment).");
    if (sex === "female" && checked("history", "early_menopause")) add(1, "Menopause before age 45, or periods that stopped for a long time.");
    if (checked("history", "falls")) add(1, "A fall in the past year. Most fractures follow a fall, so falls risk matters as much as bone density.");
    if (val("smoke") === "yes") add(1, "Currently smoking, which is linked to lower bone density and slower healing.");
    if (val("alcohol") === "3+") add(1, "Three or more alcoholic drinks a day, a recognized fracture risk factor.");
    var b = bmi();
    if (b !== null && b < 19) add(1, "A body mass index under 19 (yours is about " + b.toFixed(1) + "). Low body weight is linked to lower bone density.");
    if (val("active") === "rarely") add(0.5, "Little weight-bearing activity. Bones respond to impact and strength training.", "");
    if (val("calcium") === "low") add(0.5, "Few calcium-rich foods most days.", "");
    if (val("sun") === "low") add(0.5, "Little sun exposure and no vitamin D supplement or fortified foods.", "");
    return { f: f, bmi: b, sex: sex, age: age };
  }

  function render() {
    var r = evaluate();
    var answered = T.$$("input:checked", form).length;
    out.innerHTML = "";
    if (!r.age || !r.sex || answered < 4) {
      out.appendChild(h("p", { class: "empty-note", text: "Answer the questions on the left (or above on a phone). Your result updates as you go and nothing leaves your device." }));
      return;
    }
    var score = r.f.reduce(function (s, x) { return s + x.p; }, 0);
    var fracture = checked("history", "fragility_fracture");
    var tier = fracture || score >= 4 ? 2 : score >= 2 ? 1 : 0;
    var titles = ["Few risk factors", "Some risk factors", "Several risk factors"];
    var advice = [
      "Your answers show few recognized risk factors. Keep building bone with activity, calcium and vitamin D, and recheck as your circumstances change.",
      "Your answers include some recognized risk factors. It's worth raising bone health at your next checkup and asking whether a bone density (DXA) scan or a FRAX assessment makes sense for you.",
      "Your answers include several recognized risk factors" + (fracture ? ", including a low-impact fracture" : "") + ". Book a conversation with a doctor about bone density testing and fracture prevention soon rather than waiting for a routine visit."
    ];
    var pos = Math.min(98, Math.max(2, (score / 7) * 100));
    T.save(KEY, { tier: tier, n: r.f.length, when: Date.now() });

    out.appendChild(h("p", { class: "result-label", text: "Your result" }));
    out.appendChild(h("p", { class: "result-num", style: "font-size:clamp(2rem,1.5rem + 2vw,2.8rem)", text: titles[tier] }));
    out.appendChild(h("div", { class: "meter", role: "img", "aria-label": titles[tier] }, [h("i", { style: "left:" + pos + "%" })]));
    out.appendChild(h("div", { class: "meter-labels" }, [h("span", { text: "Fewer" }), h("span", { text: "Some" }), h("span", { text: "Several" })]));
    out.appendChild(h("p", { text: advice[tier] }));
    if (r.f.length) {
      var ul = h("ul", { class: "factor-list" });
      r.f.forEach(function (x) { ul.appendChild(h("li", { class: x.c, text: x.t })); });
      out.appendChild(h("p", { class: "field-label", text: "What we counted (" + r.f.length + ")" }));
      out.appendChild(ul);
    }
    if (r.bmi) out.appendChild(h("p", { class: "result-sub", text: "Body mass index from your height and weight: " + r.bmi.toFixed(1) + "." }));
    out.appendChild(h("div", { class: "tool-actions" }, [
      h("a", { class: "btn btn-primary", href: "find-care.html?concern=bone-density", text: tier ? "Find a bone density service" : "Talk to a specialist" }),
      h("a", { class: "btn btn-ghost", href: "https://www.fraxplus.org/", target: "_blank", rel: "noopener", text: "Estimate FRAX risk" }),
      h("button", { type: "button", class: "btn btn-ghost", text: "Print or save", onclick: function () { window.print(); } })
    ]));
    out.appendChild(h("p", { class: "tool-note", text: "This check counts common risk factors. It isn't a diagnosis or a fracture probability, and it can't replace a clinician's assessment or a bone density test." }));

    var summary = T.$("input[name=result_summary]");
    if (summary) summary.value = titles[tier] + " — " + r.f.map(function (x) { return x.t.split(".")[0]; }).join("; ");
    T.track("risk_check_result", { tier: tier, factors: r.f.length });
  }

  function syncUnits() {
    var metric = val("unit") === "metric";
    T.$$("[data-units=metric]", form).forEach(function (el) { el.hidden = !metric; });
    T.$$("[data-units=imperial]", form).forEach(function (el) { el.hidden = metric; });
    T.$$("[data-female-only]", form).forEach(function (el) { el.hidden = val("sex") !== "female"; });
  }

  form.addEventListener("change", function () { syncUnits(); render(); });
  form.addEventListener("input", function (e) { if (e.target.type === "number") render(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); render(); out.scrollIntoView({ behavior: "smooth", block: "start" }); });
  var reset = T.$("[data-reset]", form);
  if (reset) reset.addEventListener("click", function () { form.reset(); syncUnits(); render(); });
  syncUnits();
  render();
})();
