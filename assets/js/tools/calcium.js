/* 206206.com — calcium and vitamin D calculator.
   Data: window.CALCIUM_FOODS and window.CALCIUM_RDA (NIH Office of Dietary Supplements values). */
(function () {
  "use strict";
  var T = window.Tools, h = T.h;
  var root = T.$("[data-calcium]");
  var foods = window.CALCIUM_FOODS, rda = window.CALCIUM_RDA;
  if (!root || !foods || !rda) return;

  var KEY = "calcium";
  var state = T.load(KEY, { stage: 4, qty: {}, supp: 0 });
  var stageSel = T.$("select[name=stage]", root);
  var listEl = T.$("[data-foods]", root);
  var supp = T.$("input[name=supplement_mg]", root);
  var filter = T.$("input[name=food_filter]", root);

  rda.forEach(function (r, i) { stageSel.appendChild(h("option", { value: String(i), text: r.stage })); });
  stageSel.value = String(state.stage < rda.length ? state.stage : 4);
  supp.value = state.supp || "";

  var groups = [];
  foods.forEach(function (f, i) { f._i = i; if (groups.indexOf(f.group) === -1) groups.push(f.group); });

  function row(f) {
    var q = state.qty[f._i] || 0;
    var out = h("output", { text: String(q), "aria-live": "polite" });
    function set(v) {
      v = Math.max(0, Math.min(9, v));
      if (v) state.qty[f._i] = v; else delete state.qty[f._i];
      out.textContent = String(v);
      li.classList.toggle("on", v > 0);
      update();
    }
    var li = h("li", { class: "food-row" + (q ? " on" : ""), "data-name": (f.food + " " + f.group).toLowerCase() }, [
      h("span", { class: "name", text: f.food }),
      h("span", { class: "per", text: f.serving + " · " + f.mg + " mg" }),
      h("span", { class: "stepper" }, [
        h("button", { type: "button", "aria-label": "One less serving of " + f.food, text: "−", onclick: function () { set((state.qty[f._i] || 0) - 1); } }),
        out,
        h("button", { type: "button", "aria-label": "One more serving of " + f.food, text: "+", onclick: function () { set((state.qty[f._i] || 0) + 1); } })
      ])
    ]);
    return li;
  }

  groups.forEach(function (g) {
    listEl.appendChild(h("li", { class: "food-group-head", "data-group": g, text: g }));
    foods.filter(function (f) { return f.group === g; }).forEach(function (f) { listEl.appendChild(row(f)); });
  });

  var totalEl = T.$("[data-total]", root), targetEl = T.$("[data-target]", root), gapEl = T.$("[data-gap]", root);
  var gauge = T.$(".gauge", root), gaugeFill = T.$(".gauge span", root), mark = T.$(".gauge-mark", root);
  var vitdEl = T.$("[data-vitd]", root), ulEl = T.$("[data-ul]", root), tips = T.$("[data-tips]", root);

  function update() {
    state.stage = parseInt(stageSel.value, 10);
    state.supp = Math.max(0, parseFloat(supp.value) || 0);
    T.save(KEY, state);
    var r = rda[state.stage];
    var food = Object.keys(state.qty).reduce(function (s, i) { return s + foods[i].mg * state.qty[i]; }, 0);
    var total = food + state.supp;
    var max = Math.max(r.calcium_ul, total) * 1.02;
    totalEl.textContent = T.num(total) + " mg";
    targetEl.textContent = T.num(r.calcium_mg) + " mg";
    ulEl.textContent = T.num(r.calcium_ul) + " mg";
    vitdEl.textContent = T.num(r.vitd_iu) + " IU (" + T.num(r.vitd_iu / 40) + " mcg)";
    gaugeFill.style.width = Math.min(100, total / max * 100) + "%";
    mark.style.left = (r.calcium_mg / max * 100) + "%";
    gauge.classList.toggle("over", total > r.calcium_ul);
    var gap = r.calcium_mg - total;
    gapEl.textContent = gap > 0 ? T.num(gap) + " mg to go" : (total > r.calcium_ul ? "Above the upper limit" : "Target reached");

    tips.innerHTML = "";
    var t = [];
    if (total > r.calcium_ul) t.push("Your total is above the tolerable upper intake level for your age. Very high intakes, mostly from supplements, are linked to kidney stones and other problems. Talk to a clinician before taking more.");
    else if (gap > 0 && food > 0) {
      var best = foods.slice().sort(function (a, b) { return b.mg - a.mg; }).slice(0, 3).map(function (f) { return f.food.toLowerCase() + " (" + f.mg + " mg)"; });
      t.push("To close the gap, the richest sources in this list are " + best.join(", ") + ".");
    }
    if (state.supp > 500) t.push("Your body absorbs calcium best in doses of 500 mg or less, so split larger supplement amounts across the day.");
    if (state.supp > 0) t.push("Calcium carbonate is absorbed best with food; calcium citrate can be taken with or without food.");
    if (food === 0 && state.supp === 0) t.push("Tap + next to the foods you eat on a typical day. Your list is saved on this device only.");
    t.push("Vitamin D helps you absorb calcium. Your daily target is " + T.num(r.vitd_iu) + " IU, from sunlight, fatty fish, fortified foods or a supplement.");
    t.forEach(function (x) { tips.appendChild(h("li", { class: "info", text: x })); });
    T.track("calcium_update", { total: Math.round(total) });
  }

  stageSel.addEventListener("change", update);
  supp.addEventListener("input", update);
  if (filter) filter.addEventListener("input", function () {
    var q = filter.value.trim().toLowerCase();
    T.$$(".food-row", listEl).forEach(function (li) { li.hidden = q && li.getAttribute("data-name").indexOf(q) === -1; });
    T.$$(".food-group-head", listEl).forEach(function (g) { g.hidden = !!q; });
  });
  var reset = T.$("[data-reset]", root);
  if (reset) reset.addEventListener("click", function () {
    state.qty = {}; supp.value = "";
    T.$$(".food-row", listEl).forEach(function (li) { li.classList.remove("on"); T.$("output", li).textContent = "0"; });
    update();
  });
  update();
})();
