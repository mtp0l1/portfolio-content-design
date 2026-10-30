(function () {
  var g = document.querySelector(".sp-globe .sp-mer");
  if (!g) return;
  var NS = "http://www.w3.org/2000/svg", CX = 15, CY = 11, RX = 13.5, RY = 9.5, N = 16, STEP = 360 / N;
  var DEG = 80; // graus por segundo (uma volta a cada 4,5s)
  var paths = [];
  for (var i = 0; i < N; i++) { var p = document.createElementNS(NS, "path"); g.appendChild(p); paths.push(p); }
  function draw(t) {
    for (var i = 0; i < N; i++) {
      var a = ((i * STEP - t * DEG) % 360 + 360) % 360 * Math.PI / 180;
      var p = paths[i];
      if (Math.cos(a) <= 0.02) { p.setAttribute("d", ""); continue; }
      var x = RX * Math.sin(a), ax = Math.abs(x);
      p.setAttribute("d", ax < 0.25
        ? "M" + CX + " " + (CY - RY) + "V" + (CY + RY)
        : "M" + CX + " " + (CY - RY) + "A" + ax.toFixed(2) + " " + RY + " 0 0 " + (x > 0 ? 1 : 0) + " " + CX + " " + (CY + RY));
      p.setAttribute("transform", "translate(0 0)");
    }
  }
  draw(0);
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var t0 = null;
  function loop(ts) { if (t0 === null) t0 = ts; draw((ts - t0) / 1000); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
})();
