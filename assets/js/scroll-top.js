(() => {
  const btn = document.querySelector(".scroll-top");
  if (!btn) return;

  const showAt = 320;

  function update() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const show = y > showAt;
    btn.hidden = !show;
    btn.classList.toggle("scroll-top--visible", show);
  }

  btn.addEventListener("click", () => {
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
  });

  window.addEventListener("scroll", update, { passive: true });
  update();
})();
