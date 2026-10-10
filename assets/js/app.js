/* =====================================================================
   206206.com — site behavior (navigation, search, forms, ads, video,
   sharing, care-matching funnel, donations, contest countdown, skeleton).
   Settings live in config.js.
   ===================================================================== */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var doc = document;
  var $ = function (sel, root) { return (root || doc).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
  };

  var App = window.App = { store: store };

  /* ------------------------------------------------------------ analytics */

  App.track = function (name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  };

  function initAnalytics() {
    if (!SITE.ga4) return;
    var s = doc.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(SITE.ga4);
    doc.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", SITE.ga4);
  }

  /* ------------------------------------------------------------ toast */

  var toastTimer;
  App.toast = function (msg) {
    var t = $(".toast");
    if (!t) {
      t = doc.createElement("div");
      t.className = "toast";
      t.setAttribute("role", "status");
      doc.body.appendChild(t);
    }
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  };

  App.copy = function (text, okMsg) {
    var done = function () { App.toast(okMsg || "Copied"); };
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    }
    fallbackCopy(text);
    done();
    return Promise.resolve();
  };

  function fallbackCopy(text) {
    var ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    doc.body.appendChild(ta);
    ta.select();
    try { doc.execCommand("copy"); } catch (e) { /* ignore */ }
    doc.body.removeChild(ta);
  }

  /* ------------------------------------------------------------ theme */

  function initTheme() {
    var btn = $("[data-theme-toggle]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var root = doc.documentElement;
      var current = root.dataset.theme;
      var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var isDark = current ? current === "dark" : systemDark;
      var next = isDark ? "light" : "dark";
      root.dataset.theme = next;
      store.set("theme", next);
      App.toast(next === "dark" ? "Dark theme on" : "Light theme on");
    });
  }

  /* ------------------------------------------------------------ navigation */

  function initNav() {
    var buttons = $$(".nav-btn");
    function closeAll(except) {
      buttons.forEach(function (b) {
        if (b === except) return;
        b.setAttribute("aria-expanded", "false");
        var m = doc.getElementById(b.getAttribute("aria-controls"));
        if (m) m.classList.remove("open");
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = b.getAttribute("aria-expanded") === "true";
        closeAll(b);
        b.setAttribute("aria-expanded", String(!open));
        var m = doc.getElementById(b.getAttribute("aria-controls"));
        if (m) m.classList.toggle("open", !open);
      });
    });
    doc.addEventListener("click", function (e) {
      if (!e.target.closest(".has-menu")) closeAll();
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeAll();
        var t = $(".menu-toggle");
        if (t && t.getAttribute("aria-expanded") === "true") t.click();
      }
    });

    var toggle = $(".menu-toggle");
    var nav = $("#main-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
        nav.classList.toggle("open", !open);
        doc.body.classList.toggle("nav-open", !open);
        if (!toggle.__icon) toggle.__icon = toggle.innerHTML;
        toggle.innerHTML = open ? toggle.__icon : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
        doc.body.style.overflow = open ? "" : "hidden";
      });
    }
  }

  /* ------------------------------------------------------------ search */

  function initSearch() {
    var dlg = $("#search-dialog");
    if (!dlg || typeof dlg.showModal !== "function") {
      $$("[data-search-open]").forEach(function (b) { b.hidden = true; });
      return;
    }
    var input = $("#search-input");
    var list = $("#search-results");
    var loaded = false;
    var active = -1;

    function load(cb) {
      if (loaded || window.SEARCH_INDEX) { loaded = true; cb(); return; }
      var s = doc.createElement("script");
      s.src = "assets/js/search-index.js";
      s.onload = function () { loaded = true; cb(); };
      doc.head.appendChild(s);
    }

    function render(q) {
      var idx = window.SEARCH_INDEX || [];
      var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      var rows = idx.map(function (r) {
        var hay = (r.t + " " + r.d + " " + r.x).toLowerCase();
        var score = 0;
        for (var i = 0; i < terms.length; i++) {
          var t = terms[i];
          if (hay.indexOf(t) === -1) return null;
          if (r.t.toLowerCase().indexOf(t) !== -1) score += 3; else score += 1;
        }
        if (r.k === "Tool") score += 1;
        if (r.k === "Bone" && r.t.toLowerCase().indexOf(terms[0] || "") === 0) score += 2;
        return { r: r, s: score };
      }).filter(Boolean);
      if (!terms.length) rows = idx.slice(0, 8).map(function (r) { return { r: r, s: 0 }; });
      rows.sort(function (a, b) { return b.s - a.s; });
      list.innerHTML = "";
      active = -1;
      rows.slice(0, 12).forEach(function (row) {
        var li = doc.createElement("li");
        var a = doc.createElement("a");
        a.href = row.r.u;
        a.setAttribute("role", "option");
        var kind = doc.createElement("span");
        kind.className = "kind";
        kind.textContent = row.r.k;
        var strong = doc.createElement("strong");
        strong.textContent = row.r.t;
        var small = doc.createElement("small");
        small.textContent = row.r.d;
        a.appendChild(kind); a.appendChild(strong); a.appendChild(small);
        li.appendChild(a);
        list.appendChild(li);
      });
      if (!rows.length) {
        var li = doc.createElement("li");
        li.className = "muted";
        li.style.padding = "12px";
        li.textContent = "No matches. Try a shorter word, like “hip”, “calcium” or “spine”.";
        list.appendChild(li);
      }
    }

    function open() {
      load(function () { render(input.value); });
      dlg.showModal();
      input.focus();
    }

    $$("[data-search-open]").forEach(function (b) { b.addEventListener("click", open); });
    $$("[data-search-close]").forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("keydown", function (e) {
      var links = $$("a", list);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!links.length) return;
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        links.forEach(function (l, i) { l.setAttribute("aria-selected", String(i === active)); });
        links[active].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        var target = links[active >= 0 ? active : 0];
        if (target) { e.preventDefault(); location.href = target.href; }
      }
    });
    doc.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      var typing = tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        open();
      }
    });
  }

  /* ------------------------------------------------------------ hidden inbox */

  function inbox() {
    var r = window.__r || [], k = window.__k || "";
    var out = "";
    for (var i = 0; i < r.length; i++) out += String.fromCharCode(r[i] ^ k.charCodeAt(i % k.length));
    return out;
  }

  App.mailto = function (subject, body) {
    var url = "mailto:" + inbox() + "?subject=" + encodeURIComponent(subject || "Hello from 206206.com");
    if (body) url += "&body=" + encodeURIComponent(body.slice(0, 1800));
    return url;
  };

  function initMail() {
    doc.addEventListener("click", function (e) {
      var a = e.target.closest("[data-mail]");
      if (!a) return;
      e.preventDefault();
      window.location.href = App.mailto(a.getAttribute("data-subject"), a.getAttribute("data-body"));
    });
  }

  /* ------------------------------------------------------------ forms */

  function endpoint() {
    return "https://formsubmit.co/ajax/" + (SITE.formAlias || inbox());
  }

  function collect(form) {
    var data = {};
    var fd = new FormData(form);
    fd.forEach(function (value, key) {
      if (key === "_honey") return;
      if (typeof value !== "string") return;
      value = value.trim();
      if (data[key] !== undefined) data[key] = data[key] + ", " + value;
      else data[key] = value;
    });
    $$("input[data-consent]", form).forEach(function (cb) {
      if (cb.checked) {
        var label = cb.closest("label");
        data["consent_text_" + cb.name] = label ? label.textContent.replace(/\s+/g, " ").trim() : "yes";
      }
    });
    data._subject = form.getAttribute("data-subject") || "New submission — 206206.com";
    data._template = "table";
    data._captcha = "false";
    data.form_name = form.getAttribute("data-form");
    data.page = location.href;
    data.submitted_at = new Date().toISOString();
    return data;
  }

  function showSuccess(form, data) {
    var tpl = $("template[data-success-template]", form);
    var box = doc.createElement("div");
    box.className = "form-success";
    box.setAttribute("tabindex", "-1");
    if (tpl) {
      box.appendChild(tpl.content.cloneNode(true));
    } else {
      var h = doc.createElement("h3");
      h.textContent = form.getAttribute("data-success-title") || "Thank you";
      var p = doc.createElement("p");
      p.textContent = form.getAttribute("data-success") || "We received your message and will reply soon.";
      box.appendChild(h);
      box.appendChild(p);
    }
    form.replaceWith(box);
    box.focus();
    doc.dispatchEvent(new CustomEvent("form:success", { detail: { form: form.getAttribute("data-form"), data: data } }));
  }

  function bodyText(data) {
    return Object.keys(data).filter(function (k) { return k.charAt(0) !== "_"; })
      .map(function (k) { return k + ": " + data[k]; }).join("\n");
  }

  function checkGroups(form) {
    var groups = $$("[data-required-group]", form).filter(function (g) { return !g.closest("[hidden]"); });
    for (var i = 0; i < groups.length; i++) {
      if (!$("input:checked", groups[i])) return groups[i];
    }
    return null;
  }

  App.submitForm = function (form) {
    var status = $(".form-status", form);
    var btn = $("button[type=submit]", form);
    var honey = $("[name=_honey]", form);
    if (honey && honey.value) { showSuccess(form, {}); return; }
    var missingGroup = checkGroups(form);
    if (missingGroup) {
      if (status) { status.className = "form-status is-error"; status.textContent = missingGroup.getAttribute("data-required-group"); }
      var first = $("input", missingGroup);
      if (first) first.focus();
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      if (status) { status.className = "form-status is-error"; status.textContent = "Please complete the highlighted fields."; }
      return;
    }
    var data = collect(form);
    if (status) { status.className = "form-status"; status.textContent = "Sending…"; }
    if (btn) btn.disabled = true;
    fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (res.ok && (json.success === true || json.success === "true")) {
          App.track("form_submit", { form_name: data.form_name });
          store.del("funnel-" + data.form_name);
          showSuccess(form, data);
        } else {
          throw new Error(json.message || "Request failed");
        }
      });
    }).catch(function () {
      if (btn) btn.disabled = false;
      if (!status) return;
      status.className = "form-status is-error";
      status.textContent = "";
      status.appendChild(doc.createTextNode("We couldn't send that automatically. "));
      var a = doc.createElement("a");
      a.href = App.mailto(data._subject, bodyText(data));
      a.textContent = "Email your details to us instead";
      status.appendChild(a);
      status.appendChild(doc.createTextNode(" (your answers are filled in for you)."));
    });
  };

  function initForms() {
    $$("form[data-form]").forEach(function (form) {
      if (form.hasAttribute("data-steps")) initFunnel(form);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (form.hasAttribute("data-steps") && !form.__lastStep()) { form.__next(); return; }
        App.submitForm(form);
      });
    });
    prefill();
  }

  function prefill() {
    var params = new URLSearchParams(location.search);
    params.forEach(function (value, key) {
      $$("form[data-prefill] [name=\"" + key.replace(/"/g, "") + "\"]").forEach(function (el) {
        if (el.type === "checkbox" || el.type === "radio") {
          if (el.value === value) el.checked = true;
        } else if (!el.value) {
          el.value = value;
        }
      });
    });
  }

  /* ------------------------------------------------------------ multi-step lead funnel */

  var CHECKLIST_RULES = [
    { when: function (a) { return /density|osteoporosis/i.test(a.concern || ""); }, text: "Ask whether a DXA (bone density) scan is right for you, and how your FRAX 10-year fracture risk looks" },
    { when: function (a) { return /density|osteoporosis/i.test(a.concern || "") || /fracture/i.test(a.history || ""); }, text: "Bring a list of any broken bones since age 50, and how each one happened" },
    { when: function (a) { return /joint|arthritis/i.test(a.concern || ""); }, text: "Note which joints hurt, morning stiffness time, and any swelling, warmth or redness" },
    { when: function (a) { return /back|neck/i.test(a.concern || ""); }, text: "Track what makes the pain better or worse, and any numbness, weakness or bladder changes (urgent if new)" },
    { when: function (a) { return /sports/i.test(a.concern || ""); }, text: "Write down how the injury happened, when, and which movements you can't do yet" },
    { when: function (a) { return /broken|fracture/i.test(a.concern || ""); }, text: "Bring your imaging reports and ask about a rehab plan and a bone-health check after a low-impact fracture" },
    { when: function (a) { return /physio|rehab/i.test(a.concern || ""); }, text: "Ask for a written home-exercise program with clear progressions" },
    { when: function (a) { return /foot|ankle/i.test(a.concern || ""); }, text: "Bring the shoes you wear most and note where on the foot it hurts" },
    { when: function (a) { return /steroid|glucocorticoid/i.test(a.history || ""); }, text: "Mention long-term steroid use: it's a known risk factor for bone loss" },
    { when: function (a) { return /fall/i.test(a.history || ""); }, text: "Ask about a falls-risk assessment and balance training" },
    { when: function (a) { return a.age === "65-74" || a.age === "75+"; }, text: "Ask about vitamin D, calcium intake and a medication review for drugs that raise fall risk" },
    { when: function () { return true; }, text: "Bring a list of current medicines and supplements, with doses" },
    { when: function () { return true; }, text: "Check whether a referral is needed for your insurance or health plan" },
    { when: function () { return true; }, text: "Write down your top three questions before the visit" }
  ];

  function initFunnel(form) {
    var steps = $$(".step", form);
    var bar = $(".funnel-bar span", form);
    var count = $(".funnel-count b", form);
    var total = $(".funnel-count i", form);
    var prev = $("[data-prev]", form);
    var next = $("[data-next]", form);
    var submit = $("[data-submit]", form);
    var err = $(".funnel-error", form);
    var key = "funnel-" + form.getAttribute("data-form");
    var i = 0;
    if (total) total.textContent = String(steps.length);

    function answers() {
      var a = {};
      new FormData(form).forEach(function (v, k) {
        if (typeof v !== "string" || k.charAt(0) === "_") return;
        a[k] = a[k] ? a[k] + ", " + v : v;
      });
      return a;
    }

    function save() {
      var a = answers();
      ["first_name", "last_name", "email", "phone", "notes"].forEach(function (k) { delete a[k]; });
      a.__step = i;
      store.set(key, JSON.stringify(a));
    }

    function restore() {
      var raw = store.get(key);
      if (!raw) return;
      var a;
      try { a = JSON.parse(raw); } catch (e) { return; }
      Object.keys(a).forEach(function (k) {
        if (k === "__step") return;
        var vals = String(a[k]).split(", ");
        $$("[name=\"" + k + "\"]", form).forEach(function (el) {
          if (el.type === "checkbox" || el.type === "radio") el.checked = vals.indexOf(el.value) !== -1;
          else el.value = a[k];
        });
      });
    }

    function renderSummary() {
      var a = answers();
      var box = $("[data-summary]", form);
      if (box) {
        var rows = [["Help with", a.concern], ["For", a.patient], ["Age", a.age], ["How long", a.duration],
          ["Looking for", a.provider_type], ["Timing", a.timing], ["Coverage", a.coverage], ["Area", [a.city, a.country].filter(Boolean).join(", ")]]
          .filter(function (r) { return r[1]; });
        var dl = doc.createElement("dl");
        rows.forEach(function (r) {
          var dt = doc.createElement("dt"); dt.textContent = r[0];
          var dd = doc.createElement("dd"); dd.textContent = r[1];
          dl.appendChild(dt); dl.appendChild(dd);
        });
        box.innerHTML = "";
        box.appendChild(dl);
      }
      var list = $("[data-checklist]", form);
      if (list) {
        list.innerHTML = "";
        var picked = CHECKLIST_RULES.filter(function (r) { return r.when(a); }).slice(0, 7);
        picked.forEach(function (r) {
          var li = doc.createElement("li");
          li.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
          li.appendChild(doc.createTextNode(r.text));
          list.appendChild(li);
        });
        var hidden = $("input[name=visit_checklist]", form);
        if (hidden) hidden.value = picked.map(function (r) { return r.text; }).join(" | ");
      }
    }

    function show(n, focus) {
      i = Math.max(0, Math.min(n, steps.length - 1));
      steps.forEach(function (s, idx) { s.hidden = idx !== i; });
      if (bar) bar.style.width = ((i + 1) / steps.length * 100) + "%";
      if (count) count.textContent = String(i + 1);
      if (prev) prev.hidden = i === 0;
      var last = i === steps.length - 1;
      if (next) next.hidden = last;
      if (submit) submit.hidden = !last;
      if (err) err.textContent = "";
      if (last) renderSummary();
      if (focus) {
        var legend = $("legend", steps[i]) || steps[i];
        legend.setAttribute("tabindex", "-1");
        legend.focus();
        var top = form.getBoundingClientRect().top + window.scrollY - 90;
        if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
      }
      App.track("funnel_step", { form_name: form.getAttribute("data-form"), step: i + 1 });
    }

    function valid() {
      var step = steps[i];
      var groups = $$("[data-required-group]", step);
      for (var g = 0; g < groups.length; g++) {
        if (!$("input:checked", groups[g])) {
          if (err) err.textContent = groups[g].getAttribute("data-required-group");
          var first = $("input", groups[g]);
          if (first) first.focus();
          return false;
        }
      }
      var fields = $$("input, select, textarea", step);
      for (var f = 0; f < fields.length; f++) {
        if (!fields[f].checkValidity()) {
          fields[f].reportValidity();
          return false;
        }
      }
      return true;
    }

    form.__lastStep = function () { return i === steps.length - 1; };
    form.__next = function () { if (valid()) { show(i + 1, true); save(); } };

    if (next) next.addEventListener("click", form.__next);
    if (prev) prev.addEventListener("click", function () { show(i - 1, true); });
    form.addEventListener("change", function () { if (err) err.textContent = ""; save(); });

    restore();
    var params = new URLSearchParams(location.search);
    var preset = false;
    params.forEach(function (value, k) {
      $$("[name=\"" + k.replace(/"/g, "") + "\"]", form).forEach(function (el) {
        if ((el.type === "radio" || el.type === "checkbox") && el.getAttribute("data-key") === value) { el.checked = true; preset = true; }
      });
    });
    show(preset ? 1 : 0, false);
    if (preset) {
      if (err) err.textContent = "";
    }
  }

  /* ------------------------------------------------------------ ads */

  var HOUSE = [
    { t: "Find a bone and joint specialist", s: "Four quick questions, free, and you choose who contacts you.", c: "Get matched", h: "find-care.html" },
    { t: "How strong are your bones?", s: "Take the private two-minute bone health risk check.", c: "Start the check", h: "bone-health-risk-check.html" },
    { t: "Win prizes for bone-smart ideas", s: "This season's contest pays cash and gift cards to the top entries.", c: "Enter the contest", h: "contests.html" },
    { t: "Reach people who care about their bones", s: "Sponsor a tool, a guide, the newsletter or a contest.", c: "See sponsorship options", h: "advertise.html" },
    { t: "Keep 206206 free", s: "Support independent, sourced bone health education.", c: "Support 206206", h: "support.html" },
    { t: "Treat bones and joints?", s: "List your clinic and receive matched patient inquiries.", c: "List your practice", h: "list-your-practice.html" }
  ];

  function fillAd(el, n) {
    var slots = (SITE.adsense && SITE.adsense.slots) || {};
    var slot = slots[el.getAttribute("data-ad")];
    if (slot) {
      var cfg = typeof slot === "string" ? { id: slot } : slot;
      var ins = doc.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.setAttribute("data-ad-client", SITE.adsense.client);
      ins.setAttribute("data-ad-slot", cfg.id);
      if (cfg.layout) ins.setAttribute("data-ad-layout", cfg.layout);
      ins.setAttribute("data-ad-format", cfg.format || "auto");
      if (!cfg.format || cfg.format === "auto") ins.setAttribute("data-full-width-responsive", "true");
      el.appendChild(ins);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked */ }
      return;
    }
    var here = location.pathname.split("/").pop() || "index.html";
    var pool = HOUSE.filter(function (h) { return h.h !== here; });
    var pick = pool[(n + here.length) % pool.length];
    var a = doc.createElement("a");
    a.className = "house-ad";
    a.href = pick.h;
    a.innerHTML = "<strong></strong><span></span><em></em>";
    a.children[0].textContent = pick.t;
    a.children[1].textContent = pick.s;
    a.children[2].textContent = pick.c;
    el.appendChild(a);
  }

  function initAds() {
    var ads = $$(".ad-slot");
    if (!ads.length) return;
    if (!("IntersectionObserver" in window)) { ads.forEach(fillAd); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        fillAd(en.target, ads.indexOf(en.target));
      });
    }, { rootMargin: "400px 0px" });
    ads.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------ video facades */

  function initVideo() {
    doc.addEventListener("click", function (e) {
      var b = e.target.closest(".yt[data-yt]");
      if (!b) return;
      var id = b.getAttribute("data-yt");
      var f = doc.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
      f.title = b.getAttribute("aria-label") || "YouTube video";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.setAttribute("allowfullscreen", "");
      f.loading = "lazy";
      b.innerHTML = "";
      b.appendChild(f);
      b.removeAttribute("data-yt");
      App.track("video_play", { video_id: id });
    });
    var sub = $("[data-yt-subscribe]");
    if (sub && SITE.youtube && SITE.youtube.channel) {
      sub.href = SITE.youtube.channel;
      sub.hidden = false;
    }
  }

  /* ------------------------------------------------------------ share */

  function initShare() {
    var url = location.href.split("#")[0];
    var title = doc.title;
    var targets = {
      whatsapp: "https://wa.me/?text=" + encodeURIComponent(title + " " + url),
      facebook: "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url),
      linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url),
      x: "https://twitter.com/intent/tweet?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(title)
    };
    $$("[data-share-to]").forEach(function (a) {
      a.href = targets[a.getAttribute("data-share-to")] || "#";
      a.addEventListener("click", function () { App.track("share", { method: a.getAttribute("data-share-to") }); });
    });
    $$("[data-share-copy]").forEach(function (b) {
      b.addEventListener("click", function () { App.copy(url, "Link copied"); App.track("share", { method: "copy" }); });
    });
    $$("[data-share-native]").forEach(function (b) {
      if (!navigator.share) { b.hidden = true; return; }
      b.addEventListener("click", function () { navigator.share({ title: title, url: url }).catch(function () { }); });
    });
  }

  /* ------------------------------------------------------------ consent notice */

  function initConsent() {
    if (store.get("consent-ok") || !$(".ad-slot, script[src*='adsbygoogle']")) return;
    var box = doc.createElement("div");
    box.className = "consent";
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Cookie notice");
    box.innerHTML = '<p>We use cookies to show ads and understand which pages help most. Answers you enter in our tools stay on your device. <a href="privacy.html">Privacy policy</a></p>' +
      '<div class="consent-actions"><button type="button" class="btn btn-primary btn-sm" data-ok>OK</button><a class="btn btn-ghost btn-sm" href="privacy.html#choices">Ad choices</a></div>';
    doc.body.appendChild(box);
    $("[data-ok]", box).addEventListener("click", function () { store.set("consent-ok", "1"); box.remove(); });
  }

  /* ------------------------------------------------------------ exit-intent lead magnet */

  function initExitIntent() {
    if (doc.body.hasAttribute("data-no-exit") || !window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;
    var last = parseInt(store.get("exit-shown") || "0", 10);
    if (Date.now() - last < 30 * 864e5) return;
    var armed = false;
    setTimeout(function () { armed = true; }, 45000);
    function onLeave(e) {
      if (!armed || e.clientY > 0 || e.relatedTarget) return;
      doc.removeEventListener("mouseout", onLeave);
      store.set("exit-shown", String(Date.now()));
      openKit();
    }
    doc.addEventListener("mouseout", onLeave);
  }

  function openKit() {
    var dlg = doc.createElement("dialog");
    dlg.className = "modal";
    dlg.setAttribute("aria-labelledby", "kit-title");
    dlg.innerHTML =
      '<button type="button" class="icon-btn modal-close" aria-label="Close"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<div class="modal-inner"><h2 id="kit-title">Get the Strong Bones Starter Kit</h2>' +
      '<p>Your bone health risk checklist, a calcium tracker, a printable weekly bone-exercise plan and 10 questions to ask at your next checkup. Free.</p>' +
      '<form class="form" data-form="starter-kit" data-subject="New lead magnet signup (Strong Bones Starter Kit) — 206206" novalidate>' +
      '<div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>' +
      '<label class="field"><span>Email</span><input type="email" name="email" required autocomplete="email"></label>' +
      '<label class="field"><span>I\'m mostly here for</span><select name="audience"><option>My own bone and joint health</option><option>A parent or family member</option><option>Studying anatomy</option><option>My work as a health professional</option></select></label>' +
      '<label class="check"><input type="checkbox" name="consent_newsletter" value="yes" required data-consent> <span>Send me the kit and The 206 Brief (about two emails a month). Unsubscribe any time.</span></label>' +
      '<button class="btn btn-primary" type="submit">Send my kit</button><p class="form-status" role="status" aria-live="polite"></p>' +
      '<template data-success-template><h3>Your kit is ready</h3><ul class="plain-list">' +
      '<li><a href="bone-health-risk-check.html">Bone health risk check</a></li><li><a href="calcium-calculator.html">Calcium and vitamin D tracker</a></li>' +
      '<li><a href="bone-exercise-planner.html">Printable weekly bone-exercise plan</a></li><li><a href="find-care.html">Questions for your next checkup, built from your answers</a></li></ul></template>' +
      "</form></div>";
    doc.body.appendChild(dlg);
    var form = $("form", dlg);
    form.addEventListener("submit", function (e) { e.preventDefault(); App.submitForm(form); });
    $(".modal-close", dlg).addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("close", function () { dlg.remove(); });
    dlg.showModal();
    App.track("exit_intent_shown");
  }

  /* ------------------------------------------------------------ skeleton (home + explorer) */

  App.zoneNames = {};
  function initSkeleton() {
    var data = window.BONES;
    if (data) data.zones.forEach(function (z) { App.zoneNames[z.id] = z; });
    $$("svg.skeleton").forEach(function (svg) {
      var host = svg.closest("[data-skeleton]");
      var mode = host ? host.getAttribute("data-skeleton") : "link";
      var tip = host ? $(".zone-tip", host) : null;
      $$(".zone", svg).forEach(function (g) {
        var label = g.getAttribute("aria-label");
        function enter() { if (tip) { tip.textContent = label; tip.classList.add("show"); } }
        function leave() { if (tip) tip.classList.remove("show"); }
        function go() {
          var z = g.getAttribute("data-zone");
          App.track("skeleton_zone", { zone: z, mode: mode });
          if (mode === "link") { location.href = "bone-explorer.html#zone-" + z; return; }
          doc.dispatchEvent(new CustomEvent("zone:select", { detail: { zone: z } }));
        }
        g.addEventListener("mouseenter", enter);
        g.addEventListener("focus", enter);
        g.addEventListener("mouseleave", leave);
        g.addEventListener("blur", leave);
        g.addEventListener("click", go);
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
    });
  }

  /* ------------------------------------------------------------ back to top + toc */

  function initToTop() {
    var b = doc.createElement("button");
    b.type = "button";
    b.className = "to-top";
    b.setAttribute("aria-label", "Back to top");
    b.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>';
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    doc.body.appendChild(b);
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { b.classList.toggle("show", window.scrollY > 1400); ticking = false; });
    }, { passive: true });
  }

  function initToc() {
    var links = $$(".toc a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          var a = map[en.target.id];
          if (a) a.classList.add("active");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    $$(".prose h2[id]").forEach(function (h) { io.observe(h); });
  }

  /* ------------------------------------------------------------ contest countdown */

  function initCountdown() {
    $$("[data-countdown]").forEach(function (el) {
      var end = new Date(el.getAttribute("data-countdown")).getTime();
      if (isNaN(end)) return;
      function tick() {
        var ms = end - Date.now();
        if (ms <= 0) { el.innerHTML = "<p><strong>Entries are closed.</strong> Winners are announced on this page.</p>"; return; }
        var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
        el.innerHTML = "";
        [[d, "days"], [h, "hours"], [m, "minutes"], [s, "seconds"]].forEach(function (p) {
          var div = doc.createElement("div");
          div.innerHTML = "<b>" + p[0] + "</b><span>" + p[1] + "</span>";
          el.appendChild(div);
        });
        setTimeout(tick, 1000);
      }
      tick();
    });
  }

  /* ------------------------------------------------------------ donations */

  var AMOUNTS = { once: [5, 10, 25, 50, 100], monthly: [3, 5, 10, 25, 50] };
  var PAY_LABELS = { paypal: "PayPal", stripe: "Card (Stripe)", buymeacoffee: "Buy Me a Coffee", kofi: "Ko-fi", patreon: "Patreon" };

  function initDonate() {
    var box = $("[data-donate]");
    if (!box) return;
    var freq = "once";
    var amountWrap = $("[data-amounts]", box);
    var custom = $("input[name=custom_amount]", box);
    var summary = $("[data-donate-summary]", box);
    var payWrap = $("[data-pay]", box);
    var pledge = $("form[data-form=pledge]");

    function amount() {
      var c = parseFloat(custom && custom.value);
      if (c > 0) return c;
      var r = $("input[name=amount]:checked", box);
      return r ? parseFloat(r.value) : 0;
    }

    function renderAmounts() {
      amountWrap.innerHTML = "";
      AMOUNTS[freq].forEach(function (v, idx) {
        var lab = doc.createElement("label");
        lab.className = "choice";
        lab.innerHTML = '<input type="radio" name="amount" value="' + v + '"' + (idx === 2 ? " checked" : "") + '><span>$' + v + (freq === "monthly" ? "/mo" : "") + "</span>";
        amountWrap.appendChild(lab);
      });
      update();
    }

    function update() {
      var amt = amount();
      var alloc = $("select[name=allocation]", box);
      var text = amt ? "$" + amt + (freq === "monthly" ? " a month" : " one time") : "Choose an amount";
      if (summary) summary.textContent = text + (alloc ? " — " + alloc.value : "");
      if (pledge) {
        var set = function (n, v) { var el = $("[name=" + n + "]", pledge); if (el) el.value = v; };
        set("amount", amt ? String(amt) : "");
        set("frequency", freq === "monthly" ? "Monthly" : "One time");
        set("allocation", alloc ? alloc.value : "");
      }
      if (payWrap) {
        payWrap.innerHTML = "";
        var links = SITE.donate || {};
        var any = false;
        Object.keys(PAY_LABELS).forEach(function (k) {
          if (!links[k]) return;
          any = true;
          var a = doc.createElement("a");
          a.className = "btn " + (k === "paypal" || k === "stripe" ? "btn-primary" : "btn-ghost");
          a.href = links[k].replace("{amount}", amt ? String(amt) : "");
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = "Give with " + PAY_LABELS[k];
          a.addEventListener("click", function () { App.track("donate_click", { method: k, value: amt }); });
          payWrap.appendChild(a);
        });
        var note = $("[data-pay-note]", box);
        if (note) note.hidden = any;
      }
    }

    $$("[data-freq]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        freq = b.getAttribute("data-freq");
        $$("[data-freq]", box).forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        renderAmounts();
      });
    });
    box.addEventListener("change", function (e) {
      if (e.target.name === "amount" && custom) custom.value = "";
      update();
    });
    if (custom) custom.addEventListener("input", function () {
      if (custom.value) $$("input[name=amount]", box).forEach(function (r) { r.checked = false; });
      update();
    });
    renderAmounts();
  }

  /* ------------------------------------------------------------ service worker */

  function initSW() {
    if (!("serviceWorker" in navigator) || location.protocol !== "https:") return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* ignore */ });
    });
  }

  /* ------------------------------------------------------------ boot */

  function boot() {
    initAnalytics();
    initTheme();
    initNav();
    initSearch();
    initMail();
    initForms();
    initAds();
    initVideo();
    initShare();
    initConsent();
    initExitIntent();
    initToTop();
    initToc();
    initCountdown();
    initDonate();
    initSkeleton();
    initSW();
    $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
