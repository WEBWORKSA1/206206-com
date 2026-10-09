/* 206206.com — bone exercise planner.
   Built around widely published guidance: WHO 2020 activity guidelines (150–300 minutes of moderate
   activity a week, muscle strengthening on 2+ days, balance and strength on 3+ days for older adults)
   and the Royal Osteoporosis Society's "Strong, Steady and Straight" consensus (about 50 moderate
   impacts most days where suitable, strength 2–3 days a week, balance work, care with loaded forward bending). */
(function () {
  "use strict";
  var T = window.Tools, h = T.h;
  var form = T.$("form[data-planner]");
  var out = T.$("[data-plan]");
  if (!form || !out) return;

  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var ACTIVE = { 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };
  var CODE = { impact: "eve", strength: "night", balance: "rest", posture: "day", cardio: "hist" };

  var IMPACT = {
    high: ["Jogging on the spot", "Skipping, with or without a rope", "Small jumps on the spot", "Brisk stair climbing"],
    moderate: ["Heel drops: rise onto your toes, then drop onto your heels", "Stamping on the spot", "Brisk marching with firm steps", "Step-ups onto a low step"],
    low: ["Marching on the spot", "Heel raises holding a counter", "Brisk walking with a firm heel strike"]
  };
  var STRENGTH = {
    none: ["Sit-to-stand from a chair", "Wall push-ups", "Step-ups onto a stair", "Glute bridges", "Calf raises", "Hip hinge with hands on hips", "Back extension lying face down (gentle)", "Lunges holding a chair"],
    bands: ["Band rows", "Band pull-aparts", "Band chest press", "Sit-to-stand with a band above the knees", "Band overhead press", "Band hip hinge", "Calf raises", "Glute bridges with a band"],
    weights: ["Goblet squats", "One-arm dumbbell rows", "Romanian deadlift (hip hinge) with light weights", "Dumbbell overhead press", "Farmer's carry", "Step-ups holding dumbbells", "Dumbbell chest press", "Calf raises holding dumbbells"]
  };
  var BALANCE = ["Heel-to-toe stand, holding support if needed", "Single-leg stand next to a counter", "Heel-to-toe walk along a hallway", "Side steps", "Tai chi-style weight shifts", "Standing on one leg while brushing teeth"];
  var POSTURE = ["Chin tucks", "Shoulder blade squeezes", "Wall angels", "Lying face down: gentle back extension"];

  function v(name) { var el = T.$("[name=" + name + "]:checked", form) || T.$("select[name=" + name + "]", form); return el ? el.value : ""; }

  function plan() {
    var level = v("level"), bones = v("bones"), bal = v("balance"), age = v("age"), equip = v("equipment");
    var days = parseInt(v("days"), 10) || 4;
    var active = ACTIVE[days] || ACTIVE[4];
    var spine = bones === "spine";
    var cautious = spine || bal === "falls";
    var impactLevel = cautious ? "low" : (bones === "osteoporosis" || level === "new" || age === "65+") ? "moderate" : "high";
    var sCount = level === "new" ? 2 : 3;
    var bCount = (age === "65+" || bal !== "steady") ? 3 : 2;
    var sets = level === "new" ? "1–2 sets of 8–10" : level === "some" ? "2–3 sets of 8–12" : "3 sets of 8–12, adding load as it gets easier";
    var week = DAYS.map(function (d) { return { day: d, items: [], rest: true }; });

    var strengthDays = active.filter(function (_, i) { return i % 2 === 0; }).slice(0, sCount);
    if (strengthDays.length < sCount) strengthDays = strengthDays.concat(active.filter(function (d) { return strengthDays.indexOf(d) === -1; }).slice(0, sCount - strengthDays.length));
    var balanceDays = active.slice().reverse().slice(0, bCount);
    var lib = STRENGTH[equip] || STRENGTH.none;
    var rot = 0;

    active.forEach(function (d) {
      var w = week[d];
      w.rest = false;
      var isStrength = strengthDays.indexOf(d) !== -1;
      w.items.push({ c: "cardio", n: isStrength ? "Warm-up walk" : "Brisk walk", d: isStrength ? "8–10 minutes" : (days >= 5 ? "25–30 minutes" : "30–40 minutes") });
      var imp = IMPACT[impactLevel][d % IMPACT[impactLevel].length];
      w.items.push({ c: "impact", n: imp, d: impactLevel === "low" ? "5 minutes, steady pace" : "about 50 impacts, in short sets" });
      if (isStrength) {
        var picks = [];
        for (var k = 0; k < 5; k++) picks.push(lib[(rot + k) % lib.length]);
        rot += 3;
        picks.forEach(function (p) { w.items.push({ c: "strength", n: p, d: sets }); });
      }
      if (balanceDays.indexOf(d) !== -1) {
        w.items.push({ c: "balance", n: BALANCE[d % BALANCE.length], d: "3 × 30 seconds each side" });
        w.items.push({ c: "balance", n: BALANCE[(d + 2) % BALANCE.length], d: "2–3 minutes" });
      }
      w.items.push({ c: "posture", n: POSTURE[d % POSTURE.length], d: "10 slow reps" });
    });
    week.forEach(function (w, i) {
      if (w.rest) w.items.push({ c: "cardio", n: "Rest or an easy walk", d: "plus " + POSTURE[i % POSTURE.length].toLowerCase() });
    });

    var minutes = active.reduce(function (s, d) { return s + (strengthDays.indexOf(d) !== -1 ? 30 : (days >= 5 ? 35 : 45)); }, 0);
    return { week: week, impact: impactLevel, sCount: sCount, bCount: bCount, minutes: minutes, cautious: cautious, spine: spine, bones: bones };
  }

  function render() {
    var p = plan();
    out.innerHTML = "";
    var weekEl = h("div", { class: "week" });
    p.week.forEach(function (w) {
      var ul = h("ul");
      w.items.forEach(function (it) { ul.appendChild(h("li", { class: "code-" + CODE[it.c] }, [h("strong", { text: it.n }), it.d])); });
      weekEl.appendChild(h("section", { class: "day" + (w.rest ? " rest-day" : ""), "aria-label": w.day }, [
        h("h3", {}, [h("span", { text: w.day }), h("span", { class: "tag", text: w.rest ? "Recovery" : "Active" })]), ul]));
    });
    out.appendChild(h("dl", { class: "result-grid" }, [
      h("div", {}, [h("dt", { text: "Strength days" }), h("dd", { text: String(p.sCount) })]),
      h("div", {}, [h("dt", { text: "Balance days" }), h("dd", { text: String(p.bCount) })]),
      h("div", {}, [h("dt", { text: "Impact level" }), h("dd", { text: p.impact.charAt(0).toUpperCase() + p.impact.slice(1) })]),
      h("div", {}, [h("dt", { text: "Active minutes" }), h("dd", { text: "~" + p.minutes }, [])])
    ]));
    out.appendChild(h("p", { class: "legend-row" }, [
      h("span", { class: "code-eve", text: "Impact" }), h("span", { class: "code-night", text: "Strength" }),
      h("span", { class: "code-rest", text: "Balance" }), h("span", { class: "code-day", text: "Posture" }), h("span", { class: "code-hist", text: "Walking" })]));
    out.appendChild(weekEl);
    var notes = h("ul", { class: "warnings" });
    if (p.cautious) notes.appendChild(h("li", { text: "Because you mentioned " + (p.spine ? "a spinal fracture" : "falls") + ", this plan uses low-impact moves only. Ask a physiotherapist to check your technique before progressing." }));
    if (p.bones === "osteoporosis" || p.spine) notes.appendChild(h("li", { text: "With osteoporosis, take care with loaded or repeated forward bending (such as sit-ups or toe touches). Bend from the hips, keeping your back straight." }));
    notes.appendChild(h("li", { class: "info", text: "Stop and get medical advice if you have chest pain, dizziness, new joint swelling, or pain that's sharp or lasts after exercise." }));
    notes.appendChild(h("li", { class: "info", text: "Move up gradually: add reps, then sets, then load, every one to two weeks if the last session felt manageable." }));
    out.appendChild(notes);
    T.save("planner", T.$$("input:checked, select", form).map(function (el) { return [el.name, el.value]; }));
    T.track("planner_render", { impact: p.impact });
  }

  var saved = T.load("planner", null);
  if (saved) saved.forEach(function (pair) {
    var el = T.$("[name=" + pair[0] + "][value=\"" + pair[1] + "\"]", form) || T.$("select[name=" + pair[0] + "]", form);
    if (!el) return;
    if (el.tagName === "SELECT") el.value = pair[1]; else el.checked = true;
  });
  form.addEventListener("change", render);
  form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
  var print = T.$("[data-print]");
  if (print) print.addEventListener("click", function () { window.print(); });
  render();
})();
