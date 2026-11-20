// ---------- drawings slideshow ----------
(() => {
  const N = 19;
  const root = document.getElementById("slides");
  const frame = root.querySelector(".frame");
  const count = root.querySelector(".count");
  const playBtn = root.querySelector("[data-play]");
  const thumbs = document.getElementById("thumbs");
  const pad = (n) => String(n).padStart(2, "0");
  const src = (i) => `assets/kresby/k${pad(i + 1)}.jpg`;

  const imgs = [], tbs = [];
  for (let i = 0; i < N; i++) {
    const im = new Image();
    im.alt = `Kresba ${i + 1}`;
    im.decoding = "async";
    if (i < 2) im.src = src(i); else im.dataset.src = src(i);
    frame.appendChild(im); imgs.push(im);

    const b = document.createElement("button");
    b.setAttribute("aria-label", `Kresba ${i + 1}`);
    const t = new Image(); t.src = `assets/kresby/t/k${pad(i + 1)}.jpg`; t.loading = "lazy"; t.alt = "";
    b.appendChild(t); b.onclick = () => { stop(); show(i); };
    thumbs.appendChild(b); tbs.push(b);
  }

  let cur = 0, timer = null;
  const load = (i) => { const im = imgs[(i + N) % N]; if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } };
  function show(i) {
    cur = (i + N) % N;
    load(cur); load(cur + 1); load(cur - 1);
    imgs.forEach((im, k) => im.classList.toggle("on", k === cur));
    tbs.forEach((b, k) => b.classList.toggle("on", k === cur));
    count.textContent = `${pad(cur + 1)} / ${N}`;
  }
  function play() { stop(); timer = setInterval(() => show(cur + 1), 4000); playBtn.textContent = "Pauza"; }
  function stop() { clearInterval(timer); timer = null; playBtn.textContent = "Přehrát"; }

  root.querySelector(".hit.prev").onclick = () => { stop(); show(cur - 1); };
  root.querySelector(".hit.next").onclick = () => { stop(); show(cur + 1); };
  root.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { stop(); show(cur + +b.dataset.go); }));
  playBtn.onclick = () => (timer ? stop() : play());

  // autoplay only while the slideshow is on screen
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!timer && playBtn.textContent === "Pauza") play(); }
    else if (timer) { clearInterval(timer); timer = null; }
  }, { threshold: 0.4 }).observe(root);

  document.addEventListener("keydown", (e) => {
    if (document.getElementById("lb").classList.contains("open")) return;
    const r = root.getBoundingClientRect();
    if (r.top > innerHeight || r.bottom < 0) return;
    if (e.key === "ArrowRight") { stop(); show(cur + 1); }
    if (e.key === "ArrowLeft") { stop(); show(cur - 1); }
  });

  show(0);
})();

// ---------- lightbox for project images ----------
(() => {
  const lb = document.getElementById("lb");
  const img = lb.querySelector("img");
  const t = lb.querySelector(".t"), n = lb.querySelector(".n");
  let set = [], idx = 0;

  function open(list, i) { set = list; show(i); lb.classList.add("open"); document.body.style.overflow = "hidden"; }
  function close() { lb.classList.remove("open"); document.body.style.overflow = ""; }
  function show(i) {
    idx = (i + set.length) % set.length;
    const s = set[idx];
    img.src = s.currentSrc || s.src; img.alt = s.alt;
    t.textContent = s.alt; n.textContent = `${idx + 1} / ${set.length}`;
  }

  document.querySelectorAll(".project").forEach((p) => {
    const list = [...p.querySelectorAll("figure img")];
    list.forEach((im, i) => im.closest("figure").addEventListener("click", () => open(list, i)));
  });
  lb.querySelector(".close").onclick = close;
  lb.querySelector(".side.prev").onclick = () => show(idx - 1);
  lb.querySelector(".side.next").onclick = () => show(idx + 1);
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") show(idx + 1);
    if (e.key === "ArrowLeft") show(idx - 1);
  });
})();

// ---------- active nav item + barva pozadí podle sekce ----------
(() => {
  const root = document.documentElement;
  const links = [...document.querySelectorAll(".nav a")];
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
      root.dataset.theme = e.target.dataset.theme || "white";
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll(".section, .intro").forEach((s) => io.observe(s));
})();

// ---------- jméno přes celou úvodní obrazovku ----------
(() => {
  const h1 = document.querySelector(".intro h1.fit");
  const intro = h1.parentElement;
  function fit() {
    h1.style.fontSize = "100px";
    const cs = getComputedStyle(intro);
    const w = intro.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const h = intro.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const widest = Math.max(...[...h1.children].map((s) => s.getBoundingClientRect().width));
    const tall = h1.getBoundingClientRect().height;
    const size = Math.min((w / widest) * 100, (h / tall) * 100) * 0.995;
    h1.style.fontSize = size + "px";
  }
  fit();
  document.fonts && document.fonts.ready.then(fit);
  addEventListener("resize", fit);
})();
