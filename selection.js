(function () {
  if (!window.getSelection || !document.createRange) return;
  var st = document.createElement("style");
  st.textContent =
    "::selection{background:transparent;color:inherit}" +
    "#sp-sel{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483000;mix-blend-mode:difference}" +
    "#sp-sel i{position:absolute;background:#fff;border-radius:6px}" +
    "@media (forced-colors:active){::selection{background:Highlight;color:HighlightText}#sp-sel{display:none}}";
  document.head.appendChild(st);
  var box = document.createElement("div");
  box.id = "sp-sel";
  box.setAttribute("aria-hidden", "true");
  document.body.appendChild(box);
  var raf = 0;
  function draw() {
    raf = 0;
    box.textContent = "";
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    var sx = window.pageXOffset, sy = window.pageYOffset, frag = document.createDocumentFragment();
    for (var i = 0; i < sel.rangeCount; i++) {
      var r = sel.getRangeAt(i);
      var root = r.commonAncestorContainer;
      if (root.nodeType === 3) root = root.parentNode;
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var n;
      while ((n = w.nextNode())) {
        if (!r.intersectsNode(n) || !n.nodeValue.trim()) continue;
        var p = n.parentNode && n.parentNode.nodeName;
        if (p === "SCRIPT" || p === "STYLE" || p === "NOSCRIPT") continue;
        var sub = document.createRange();
        sub.selectNodeContents(n);
        if (n === r.startContainer) sub.setStart(n, r.startOffset);
        if (n === r.endContainer) sub.setEnd(n, r.endOffset);
        var rs = sub.getClientRects();
        for (var k = 0; k < rs.length; k++) {
          var q = rs[k];
          if (q.width < 1 || q.height < 1) continue;
          var d = document.createElement("i");
          d.style.left = q.left + sx - 3 + "px";
          d.style.top = q.top + sy - 1 + "px";
          d.style.width = q.width + 6 + "px";
          d.style.height = q.height + 2 + "px";
          frag.appendChild(d);
        }
      }
    }
    box.appendChild(frag);
  }
  function sched() { if (!raf) raf = requestAnimationFrame(draw); }
  document.addEventListener("selectionchange", sched);
  window.addEventListener("resize", sched);
})();
