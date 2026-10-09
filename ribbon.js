(() => {
  const W = 2400, H = 1200, NS = "http://www.w3.org/2000/svg";
  const STOPS = ["#19E2D3", "#268CFF", "#8A5CF6"];
  const LAYERS = [[0.55, 0.035], [0.32, 0.05], [0.17, 0.07], [0.08, 0.1], [0.03, 0.16], [0.008, 0.35]];
  const RIBBON_Y = H * 0.5, AMP = H * 0.16, CYCLE = 10000;
  const MAIN = { period: W * 1.7, y0: RIBBON_Y, amp: AMP, strength: 1, shift: (p) => p };
  const ECHO = { period: W * 1.15, y0: RIBBON_Y - AMP * 0.45, amp: AMP * 0.7, strength: 0.6, shift: (p) => -p + 2.1 };
  const STEPS = 160;

  function wave(r, phase) {
    let d = "";
    for (let s = 0; s <= STEPS; s++) {
      const x = -W * 0.2 + (W * 1.4) * s / STEPS;
      const y = H - (r.y0 + r.amp * Math.sin(2 * Math.PI * x / r.period + 0.6 + r.shift(phase)));
      d += (s ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    return d;
  }

  let uid = 0;
  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function build(host) {
    const id = "rb" + (uid++);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "xMidYMid slice", class: "ribbon-svg", "aria-hidden": "true", focusable: "false" });
    const defs = el("defs", {}, svg);
    const base = el("linearGradient", { id: id + "b", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: 0, "stop-color": "#0B0D22" }, base);
    el("stop", { offset: 1, "stop-color": "#05061A" }, base);
    const glows = [[0, H * 0.02, Math.max(W, H) * 0.62, STOPS[0], 0.16, 1],
                   [W, H * 0.88, Math.max(W, H) * 0.62, STOPS[2], 0.16, 1],
                   [W / 2, H / 2, Math.max(W, H) * 0.45, STOPS[1], 0.14, 0.6]];
    glows.forEach(([cx, cy, r, c, a, squash], i) => {
      const g = el("radialGradient", { id: id + "g" + i, gradientUnits: "userSpaceOnUse", cx, cy, r,
        gradientTransform: `translate(${cx} ${cy}) scale(1 ${squash}) translate(${-cx} ${-cy})` }, defs);
      el("stop", { offset: 0, "stop-color": c, "stop-opacity": a }, g);
      el("stop", { offset: 1, "stop-color": c, "stop-opacity": 0 }, g);
    });
    const line = el("linearGradient", { id: id + "l", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: W, y2: 0 }, defs);
    STOPS.forEach((c, i) => el("stop", { offset: i / (STOPS.length - 1), "stop-color": c }, line));
    el("rect", { width: W, height: H, fill: `url(#${id}b)` }, svg);
    glows.forEach((_, i) => el("rect", { width: W, height: H, fill: `url(#${id}g${i})` }, svg));
    const g = el("g", { fill: "none", stroke: `url(#${id}l)`, "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);
    const paths = [ECHO, MAIN].map((r) => {
      const d = el("path", { id: id + (r === MAIN ? "m" : "e") }, defs);
      LAYERS.forEach(([w, a]) => el("use", { href: "#" + d.id, "stroke-width": (W * w).toFixed(1), "stroke-opacity": (a * r.strength).toFixed(4) }, g));
      return [r, d];
    });
    host.prepend(svg);
    return paths;
  }

  const hosts = Array.from(document.querySelectorAll("[data-ribbon]")).map((h) => ({ host: h, paths: build(h), on: true }));
  const draw = (phase) => {
    const cache = new Map();
    for (const h of hosts) {
      if (!h.on) continue;
      for (const [r, node] of h.paths) {
        if (!cache.has(r)) cache.set(r, wave(r, phase));
        node.setAttribute("d", cache.get(r));
      }
    }
  };
  draw(0);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const h = hosts.find((x) => x.host === e.target);
      if (h) h.on = e.isIntersecting;
    }
  });
  hosts.forEach((h) => seen.observe(h.host));
  const start = performance.now();
  let last = 0;
  const tick = (now) => {
    if (now - last >= 33) {
      last = now;
      draw(2 * Math.PI * (((now - start) % CYCLE) / CYCLE));
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
