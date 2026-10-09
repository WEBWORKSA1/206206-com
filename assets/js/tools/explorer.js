/* 206206.com — 206 Bone Explorer. Data: window.BONES (built from src/data/bones.json). */
(function () {
  "use strict";
  var T = window.Tools, h = T.h;
  var root = T.$("[data-explorer]");
  var data = window.BONES;
  if (!root || !data) return;

  var zones = {};
  data.zones.forEach(function (z) {
    z.bones = data.bones.filter(function (b) { return b.zone === z.id; });
    z.total = z.bones.reduce(function (s, b) { return s + b.count; }, 0);
    zones[z.id] = z;
  });
  var byId = {};
  data.bones.forEach(function (b) { byId[b.id] = b; });

  var head = T.$("[data-zone-head]", root);
  var list = T.$("[data-bone-cards]", root);
  var search = T.$("input[name=bone_search]", root);
  var chips = T.$("[data-zone-chips]");
  var svg = T.$("svg.skeleton");

  function card(b, hit) {
    return h("li", { class: "bone-card" + (hit ? " hit" : ""), id: "card-" + b.id }, [
      h("h3", {}, [h("span", { text: b.name }), h("b", { text: String(b.count), title: b.count === 1 ? "1 in the body" : b.count + " in the body" })]),
      h("p", { class: "meta" }, [h("span", { text: b.region }), h("span", { text: b.type + " bone" }),
        b.aka && b.aka.length ? h("span", { text: "Also called: " + b.aka.join(", ") }) : null]),
      h("p", { text: b.fn }),
      h("p", { class: "bfact", text: b.fact })
    ]);
  }

  function highlight(zoneId) {
    if (!svg) return;
    T.$$(".zone", svg).forEach(function (g) {
      var on = zoneId && g.getAttribute("data-zone") === zoneId;
      g.classList.toggle("active", !!on);
      g.classList.toggle("dim", !!zoneId && !on);
      g.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (chips) T.$$("button", chips).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-zone") === zoneId)); });
  }

  function overview() {
    highlight(null);
    head.innerHTML = "";
    head.appendChild(h("div", {}, [h("h2", { text: "All 206 bones" }),
      h("p", { class: "muted", text: "Choose a region on the skeleton, tap a chip, or search for a bone by name." })]));
    head.appendChild(h("p", { class: "zone-count" }, ["206", h("small", { text: "bones" })]));
    list.innerHTML = "";
    var tally = h("dl", { class: "tally" });
    [["Axial skeleton", 80], ["Appendicular", 126], ["Hands and wrists", 54], ["Feet and ankles", 52], ["Skull and ears", 28], ["Spine", 26]]
      .forEach(function (r) { tally.appendChild(h("div", {}, [h("dt", { text: r[0] }), h("dd", { text: String(r[1]) })])); });
    list.appendChild(h("li", { style: "grid-column:1/-1" }, [tally]));
    data.zones.forEach(function (z) {
      list.appendChild(h("li", { class: "bone-card" }, [
        h("h3", {}, [h("a", { href: "#zone-" + z.id, text: z.name }), h("b", { text: String(z.total) })]),
        h("p", { text: z.summary })
      ]));
    });
  }

  function showZone(id, hitBone, scroll) {
    var z = zones[id];
    if (!z) { overview(); return; }
    highlight(id);
    head.innerHTML = "";
    head.appendChild(h("div", {}, [h("h2", { text: z.name }), h("p", { class: "muted", text: z.summary })]));
    head.appendChild(h("p", { class: "zone-count" }, [String(z.total), h("small", { text: z.total === 1 ? "bone" : "bones" })]));
    list.innerHTML = "";
    z.bones.forEach(function (b) { list.appendChild(card(b, b.id === hitBone)); });
    list.appendChild(h("li", { style: "grid-column:1/-1" }, [h("p", { class: "fine-print" }, [
      "Counts are for a typical adult. Many people have a few extra small bones; ",
      h("a", { href: "list-of-206-bones.html", text: "see why counts vary" }), "."])]));
    if (hitBone) {
      var el = document.getElementById("card-" + hitBone);
      if (el && scroll !== false) el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (scroll) {
      // Hash links also match ids in the static tables lower on the page; bring the reader back to the panel.
      var top = (window.innerWidth < 900 ? root : root.closest(".explorer")).getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: Math.max(0, top), behavior: scroll === "instant" ? "auto" : "smooth" });
    }
    T.track("explorer_zone", { zone: id });
  }

  function runSearch(q) {
    q = q.trim().toLowerCase();
    if (!q) { route(); return; }
    var hits = data.bones.filter(function (b) {
      return (b.name + " " + (b.aka || []).join(" ") + " " + b.region).toLowerCase().indexOf(q) !== -1;
    });
    highlight(hits.length && hits.every(function (b) { return b.zone === hits[0].zone; }) ? hits[0].zone : null);
    head.innerHTML = "";
    head.appendChild(h("div", {}, [h("h2", { text: hits.length ? "Bones matching “" + q + "”" : "No bones match “" + q + "”" }),
      h("p", { class: "muted", text: hits.length ? "" : "Try a common name like kneecap, collarbone or tailbone." })]));
    var count = hits.reduce(function (s, b) { return s + b.count; }, 0);
    head.appendChild(h("p", { class: "zone-count" }, [String(count), h("small", { text: "in the body" })]));
    list.innerHTML = "";
    hits.forEach(function (b) { list.appendChild(card(b)); });
  }

  function route(first) {
    var hash = decodeURIComponent(location.hash.slice(1));
    var how = first === true ? "instant" : true;
    if (hash.indexOf("zone-") === 0) { showZone(hash.slice(5), null, how); return; }
    if (byId[hash]) {
      showZone(byId[hash].zone, null, how);
      var c = document.getElementById("card-" + hash);
      if (c) { c.classList.add("hit"); setTimeout(function () { c.scrollIntoView({ block: "center" }); }, first === true ? 0 : 60); }
      return;
    }
    overview();
  }

  if (chips) {
    data.zones.forEach(function (z) {
      chips.appendChild(h("button", { type: "button", "data-zone": z.id, "aria-pressed": "false",
        onclick: function () { history.replaceState(null, "", "#zone-" + z.id); search.value = ""; showZone(z.id, null, true); } },
        [h("span", { text: z.name }), h("b", { text: String(z.total) })]));
    });
  }

  document.addEventListener("zone:select", function (e) {
    history.replaceState(null, "", "#zone-" + e.detail.zone);
    if (search) search.value = "";
    showZone(e.detail.zone, null, true);
  });
  window.addEventListener("hashchange", route);
  if (search) {
    var timer;
    search.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { runSearch(search.value); }, 120); });
  }
  var reset = T.$("[data-explorer-reset]", root);
  if (reset) reset.addEventListener("click", function () { history.replaceState(null, "", location.pathname); search.value = ""; overview(); });

  // The static tables below stay for search engines and no-JS readers.
  window.addEventListener("load", function () { if (location.hash) route(true); });
  route(true);
})();
