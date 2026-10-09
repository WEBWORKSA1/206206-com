/* 206206.com — shared helpers for the tools. */
(function () {
  "use strict";
  var T = window.Tools = {};

  T.$ = function (sel, root) { return (root || document).querySelector(sel); };
  T.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* Build an element: T.h("p", {class: "x", text: "hi"}, [children]) */
  T.h = function (tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "class") el.className = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  };

  T.num = function (n, digits) {
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits || 0, minimumFractionDigits: digits || 0 });
  };

  T.load = function (key, fallback) {
    try { var v = localStorage.getItem("tool-" + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  };
  T.save = function (key, value) {
    try { localStorage.setItem("tool-" + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  };

  /* Deterministic daily index, so "bone of the day" is the same for everyone on a given date. */
  T.dayIndex = function (len) {
    var d = new Date();
    var n = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    return ((n * 2654435761) >>> 0) % len;
  };

  T.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  T.track = function (name, params) { if (window.App && App.track) App.track(name, params); };
})();
