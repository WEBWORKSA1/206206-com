/* 206206.com — skeleton quiz, flashcards and bone of the day. Data: window.BONES. */
(function () {
  "use strict";
  var T = window.Tools, h = T.h;
  var root = T.$("[data-quiz]");
  var data = window.BONES;
  if (!root || !data) return;

  var zones = {};
  data.zones.forEach(function (z) {
    z.total = data.bones.filter(function (b) { return b.zone === z.id; }).reduce(function (s, b) { return s + b.count; }, 0);
    zones[z.id] = z;
  });
  var bones = data.bones;
  var best = T.load("quiz-best", 0);

  /* ------------------------------------------------ tabs */
  var tabs = T.$$("[role=tab]", root);
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (o) {
        var on = o === t;
        o.setAttribute("aria-selected", String(on));
        T.$("#" + o.getAttribute("aria-controls")).hidden = !on;
      });
      T.track("quiz_tab", { tab: t.id });
    });
  });

  /* ------------------------------------------------ question bank */
  function pick(arr, n, exclude) {
    return T.shuffle(arr.filter(function (x) { return exclude.indexOf(x) === -1; })).slice(0, n);
  }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  var makers = [
    function () {
      var b = bones[Math.floor(Math.random() * bones.length)];
      var right = zones[b.zone].name;
      var others = pick(data.zones.map(function (z) { return z.name; }), 3, [right]);
      return { q: "Where in the body would you find the " + b.name.replace(/ \(.+\)$/, "") + "?", right: right, opts: others.concat(right),
        why: b.name + ": " + b.region + ". " + b.fn };
    },
    function () {
      var pool = bones.filter(function (b) { return b.count > 1 || /^(Sternum|Mandible|Sacrum|Coccyx|Hyoid bone|Vomer|Frontal bone|Occipital bone)$/.test(b.name); });
      var b = pool[Math.floor(Math.random() * pool.length)];
      var right = String(b.count);
      var others = pick(["1", "2", "4", "5", "6", "8", "10", "12", "14", "16", "24", "26"], 3, [right]);
      return { q: "How many " + lower(b.name.replace(/s$/, "s")) + " are in a typical adult body?", right: right, opts: others.concat(right),
        why: "There " + (b.count === 1 ? "is 1" : "are " + b.count) + ". " + b.fact };
    },
    function () {
      var common = ["clavicle", "patella", "coccyx", "tibia", "sternum", "femur", "calcaneus", "zygomatic", "mandible",
        "scapula", "stapes", "malleus", "incus", "hyoid", "humerus", "talus", "fibula", "maxilla"];
      var pool = bones.filter(function (b) { return common.indexOf(b.id) !== -1; });
      var b = pool[Math.floor(Math.random() * pool.length)];
      var aka = b.aka[0];
      var others = pick(bones.map(function (x) { return x.name; }), 3, [b.name]);
      return { q: "Which bone is commonly called the “" + aka + "”?", right: b.name, opts: others.concat(b.name), why: b.name + ": " + b.fn };
    },
    function () {
      var b = bones[Math.floor(Math.random() * bones.length)];
      var others = pick(bones.filter(function (x) { return x.zone !== b.zone; }).map(function (x) { return x.name; }), 3, [b.name]);
      return { q: "Which bone does this? " + b.fn, right: b.name, opts: others.concat(b.name), why: b.fact };
    },
    function () {
      var z = data.zones[Math.floor(Math.random() * data.zones.length)];
      var right = String(z.total);
      var others = pick(["1", "2", "4", "8", "14", "22", "25", "26", "28", "30", "52", "54", "60"], 3, [right]);
      return { q: "How many bones are in the " + lower(z.name) + " (both sides together)?", right: right, opts: others.concat(right), why: z.summary };
    }
  ];

  /* ------------------------------------------------ quiz */
  var qBox = T.$("[data-q]", root), opts = T.$("[data-opts]", root), fb = T.$("[data-feedback]", root);
  var nextBtn = T.$("[data-next-q]", root), bar = T.$(".quiz-progress span", root);
  var scoreEl = T.$("[data-score]", root), streakEl = T.$("[data-streak]", root), bestEl = T.$("[data-best]", root);
  var LEN = 10, n = 0, score = 0, streak = 0, current;

  function setStats() {
    scoreEl.textContent = score + "/" + n;
    streakEl.textContent = String(streak);
    bestEl.textContent = String(best);
  }

  function ask() {
    var q;
    for (var tries = 0; tries < 20; tries++) {
      q = makers[Math.floor(Math.random() * makers.length)]();
      var uniq = q.opts.filter(function (o, i) { return q.opts.indexOf(o) === i; });
      if (uniq.length === 4) break;
    }
    current = q;
    qBox.textContent = q.q;
    opts.innerHTML = "";
    fb.textContent = "";
    nextBtn.hidden = true;
    T.shuffle(q.opts).forEach(function (o) {
      opts.appendChild(h("button", { type: "button", class: "quiz-opt", text: o, onclick: function (e) { answer(e.currentTarget, o); } }));
    });
    bar.style.width = (n / LEN * 100) + "%";
  }

  function answer(btn, o) {
    var ok = o === current.right;
    T.$$(".quiz-opt", opts).forEach(function (b) {
      b.disabled = true;
      if (b.textContent === current.right) b.classList.add("right");
    });
    if (!ok) btn.classList.add("wrong");
    n++;
    if (ok) { score++; streak++; } else { streak = 0; }
    if (streak > best) { best = streak; T.save("quiz-best", best); }
    fb.textContent = (ok ? "Correct. " : "Not quite: the answer is " + current.right + ". ") + current.why;
    setStats();
    bar.style.width = (n / LEN * 100) + "%";
    if (n >= LEN) { finish(); return; }
    nextBtn.hidden = false;
    nextBtn.focus();
  }

  function finish() {
    T.track("quiz_complete", { score: score });
    var msg = score >= 9 ? "Bone-afide expert." : score >= 7 ? "Strong skeleton knowledge." : score >= 4 ? "Solid start: try another round." : "Every expert starts somewhere.";
    var end = h("div", { class: "results" }, [
      h("p", { class: "result-label", text: "Your score" }),
      h("p", { class: "result-num", text: score + "/" + LEN }),
      h("p", { text: msg }),
      h("div", { class: "tool-actions" }, [
        h("button", { type: "button", class: "btn btn-primary", text: "Play again", onclick: restart }),
        h("button", { type: "button", class: "btn btn-ghost", text: "Share my score", onclick: function () {
          var text = "I scored " + score + "/" + LEN + " on the 206206 skeleton quiz. Can you beat it?";
          if (navigator.share) navigator.share({ title: "206206 skeleton quiz", text: text, url: location.href }).catch(function () {});
          else if (window.App) App.copy(text + " " + location.href, "Score copied: paste it anywhere");
        } }),
        h("a", { class: "btn btn-ghost", href: "contests.html", text: "Enter the bone trivia contest" })
      ])
    ]);
    fb.textContent = "";
    fb.appendChild(end);
  }

  function restart() { n = 0; score = 0; streak = 0; setStats(); ask(); }
  nextBtn.addEventListener("click", ask);
  setStats();
  ask();

  /* ------------------------------------------------ flashcards */
  var deck = T.shuffle(bones), fi = 0, known = 0;
  var fc = T.$("[data-flashcard]", root);
  function drawCard() {
    var b = deck[fi];
    fc.classList.remove("flipped");
    T.$("[data-front]", fc).innerHTML = "";
    T.$("[data-front]", fc).appendChild(h("div", {}, [h("p", { class: "muted", text: "Card " + (fi + 1) + " of " + deck.length + " · tap to flip" }),
      h("h3", { text: b.name }), h("p", { class: "muted", text: b.aka && b.aka.length ? "Also called: " + b.aka.join(", ") : "" })]));
    T.$("[data-back]", fc).innerHTML = "";
    T.$("[data-back]", fc).appendChild(h("div", {}, [h("h3", { text: b.count + (b.count === 1 ? " bone" : " bones") }),
      h("p", { text: b.region + " · " + b.type + " bone" }), h("p", { text: b.fn }), h("p", { text: b.fact })]));
    T.$("[data-known]", root).textContent = String(known);
  }
  function flip() { fc.classList.toggle("flipped"); }
  fc.addEventListener("click", flip);
  fc.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
  T.$("[data-fc-next]", root).addEventListener("click", function () { fi = (fi + 1) % deck.length; drawCard(); });
  T.$("[data-fc-prev]", root).addEventListener("click", function () { fi = (fi - 1 + deck.length) % deck.length; drawCard(); });
  T.$("[data-fc-known]", root).addEventListener("click", function () { known++; fi = (fi + 1) % deck.length; drawCard(); });
  drawCard();

  /* ------------------------------------------------ bone of the day */
  var bod = T.$("[data-bod]");
  if (bod) {
    var b = bones[T.dayIndex(bones.length)];
    bod.innerHTML = "";
    bod.appendChild(h("p", { class: "result-label", text: "Bone of the day · " + new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" }) }));
    bod.appendChild(h("h3", { text: b.name }));
    bod.appendChild(h("p", { text: b.fn + " " + b.fact }));
    bod.appendChild(h("p", {}, [h("a", { href: "bone-explorer.html#" + b.id, text: "See it on the skeleton" })]));
  }
})();
