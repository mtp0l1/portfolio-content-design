/* Demos do portfólio: celular do Pronto App e celular do Campana (troca de tema). Sem dependências. */
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function whenVisible(el, cb, th) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { threshold: th || 0.35 }).observe(el);
  }

  /* ---------- Pronto: celular com 4 telas ---------- */
  document.querySelectorAll(".pd").forEach(function (pd) {
    var slides = [].slice.call(pd.querySelectorAll(".pd-slide")),
        steps = [].slice.call(pd.querySelectorAll(".pd-step")),
        cur = 0, timer = null, playing = false, started = false;
    function dur(n) { return parseInt(slides[n].getAttribute("data-dur") || "6000", 10); }
    function go(n) {
      cur = n;
      slides.forEach(function (s, k) {
        var inn = s.querySelector(".pd-in");
        s.classList.toggle("on", k === n);
        if (inn) { inn.style.transition = "none"; inn.style.transform = "none"; }
      });
      steps.forEach(function (b, k) { b.classList.toggle("on", k === n); b.setAttribute("aria-current", k === n ? "true" : "false"); });
      pd.style.setProperty("--dur", dur(n) + "ms");
      pd.classList.remove("is-playing"); void pd.offsetWidth;
      if (playing) pd.classList.add("is-playing");
      var s = slides[n], inn = s.querySelector(".pd-in");
      if (inn && s.hasAttribute("data-scroll") && !reduce) {
        var max = inn.offsetHeight - s.parentNode.clientHeight;
        if (max > 0) setTimeout(function () {
          if (cur !== n) return;
          inn.style.transition = "transform " + Math.max(2.5, dur(n) / 1000 - 2.2) + "s cubic-bezier(.45,0,.2,1)";
          inn.style.transform = "translateY(" + (-max) + "px)";
        }, 1100);
      }
    }
    function arm() { clearTimeout(timer); if (playing) timer = setTimeout(function () { go((cur + 1) % slides.length); arm(); }, dur(cur)); }
    steps.forEach(function (b, k) {
      b.addEventListener("click", function () { playing = false; clearTimeout(timer); go(k); });
    });
    go(0);
    whenVisible(pd, function (vis) {
      if (vis && !started && !reduce) { started = true; playing = true; go(0); arm(); }
      else if (!vis && playing) { playing = false; clearTimeout(timer); pd.classList.remove("is-playing"); }
      else if (vis && started && !playing && !pd.hasAttribute("data-stopped")) { /* retoma só se o usuário não interagiu */ }
    }, 0.4);
    steps.forEach(function (b) { b.addEventListener("click", function () { pd.setAttribute("data-stopped", ""); }); });
  });

  /* ---------- Campana: mesma tela, três marcas ---------- */
  var T = [{ id: "a", hex: "#F2A545" }, { id: "b", hex: "#45C1A5" }, { id: "c", hex: "#7DA3F5" }];
  document.querySelectorAll(".cdemo").forEach(function (el) {
    var i = 0, timer = null, stopped = false,
        hexes = el.querySelectorAll("[data-hex]"),
        dots = el.querySelectorAll(".cd-dots span"),
        btns = el.parentNode.querySelectorAll("[data-theme]");
    function fit() { el.style.setProperty("--k", el.clientWidth / 560); }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(el); else window.addEventListener("resize", fit);
    el.querySelectorAll(".cd-sc > *").forEach(function (n, k) { n.style.setProperty("--j", k); });
    function set(n, anim) {
      i = n; el.setAttribute("data-t", T[n].id);
      hexes.forEach(function (h) { h.textContent = T[n].hex; });
      dots.forEach(function (d, k) { d.classList.toggle("on", k === n); });
      btns.forEach(function (b, k) { b.setAttribute("aria-pressed", k === n ? "true" : "false"); });
      el.classList.remove("swap"); void el.offsetWidth; if (anim) el.classList.add("swap");
    }
    set(0, false);
    btns.forEach(function (b, k) { b.addEventListener("click", function () { stopped = true; clearInterval(timer); set(k, true); }); });
    if (reduce) { el.classList.remove("play"); return; }
    whenVisible(el, function (vis) {
      clearInterval(timer);
      if (vis) {
        if (!el.classList.contains("play")) el.classList.add("play");
        if (!stopped) timer = setInterval(function () { set((i + 1) % T.length, true); }, 3600);
      }
    }, 0.25);
  });

  /* ---------- Revelar ao rolar (páginas de case) ---------- */
  var rv = document.querySelectorAll(".cp-rv, .cp-bars");
  if (rv.length) {
    if (!("IntersectionObserver" in window) || reduce) rv.forEach(function (n) { n.classList.add("in"); });
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      rv.forEach(function (n) { io.observe(n); });
    }
  }
})();
