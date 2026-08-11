(() => {
  const LINKS = [
    { href: "./index.html", en: "TOP", ja: "トップ" },
    { href: "./concept.html", en: "CONCEPT", ja: "コンセプト" },
    { href: "./menu.html", en: "MENU", ja: "メニュー" },
    { href: "./news.html", en: "NEWS", ja: "お知らせ" },
    { href: "./shop.html", en: "SHOP", ja: "店舗情報" },
    { href: "./gift.html", en: "GIFT", ja: "ギフト・贈り物" },
    { href: "./contact.html", en: "CONTACT", ja: "お問い合わせ" },
  ];

  const ANCHOR_TO_CAT = {
    "#menu-sp-pasta": "pasta",
    "#menu-sp-salad": "salad",
    "#menu-sp-bread-sweets": "bread-sweets",
    "#menu-sp-drink": "drink",
    "#menu-pc-drink": "drink",
  };

  function currentPath() {
    const p = location.pathname.split("/").pop() || "";
    return p || "index.html";
  }

  function normalizeDrawerNav() {
    const nav = document.querySelector(".drawer__nav");
    if (!nav) return;

    // Guard: only replace when existing links match the expected set
    // (order-insensitive). Divergent drawers are left untouched.
    const expected = new Set(LINKS.map((l) => l.href.replace(/^\.\//, "")));
    const existing = Array.from(nav.querySelectorAll("a.drawer__link")).map((a) => {
      const href = a.getAttribute("href") || "";
      return href.split("/").pop() || href;
    });
    const existingSet = new Set(existing);
    if (
      existing.length === 0 ||
      existingSet.size !== expected.size ||
      [...expected].some((h) => !existingSet.has(h))
    ) {
      return;
    }

    const p = currentPath();
    nav.innerHTML = LINKS.map((l) => {
      const aria = l.href.endsWith(p) ? ' aria-current="page"' : "";
      return `<li class="drawer__item"><a href="${l.href}" class="drawer__link"${aria}><span class="drawer__link-en">${l.en}</span><span class="drawer__link-separator">／</span><span class="drawer__link-ja">${l.ja}</span></a></li>`;
    }).join("");
  }

  function markCardCategories(container) {
    if (!container) return;
    let current = "pasta";
    const cards = Array.from(container.querySelectorAll(":scope > article"));
    for (const card of cards) {
      const id = card.getAttribute("id") || "";
      if (id === "menu-sp-pasta") current = "pasta";
      else if (id === "menu-sp-salad") current = "salad";
      else if (id === "menu-sp-bread-sweets") current = "bread-sweets";
      card.dataset.kumaCat = current;
    }
  }

  function setActiveMenuNav(cat) {
    const navs = document.querySelectorAll(".menu-page-sp__nav, .menu-page-pc__nav");
    navs.forEach((n) => n.classList.add("kuma-menu-nav"));
    const btns = document.querySelectorAll(".menu-page-sp__nav-btn, .menu-page-pc__nav-btn");
    btns.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const c = ANCHOR_TO_CAT[href] || null;
      const active = !!cat && c === cat;
      a.classList.toggle("kuma-is-active", active);
      if (active) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  function applyMenuFilter(cat) {
    const showAll = !cat;

    for (const sel of [".menu-page-sp__cards", ".menu-page-pc__cards"]) {
      const container = document.querySelector(sel);
      if (!container) continue;
      const cards = container.querySelectorAll(":scope > article");
      cards.forEach((card) => {
        const c = card.dataset.kumaCat || "";
        const hide = !showAll && cat !== "drink" && c !== cat;
        card.classList.toggle("kuma-is-hidden", hide);
      });
    }

    const spDrink = document.getElementById("menu-sp-drink");
    const pcDrink = document.getElementById("menu-pc-drink");
    if (spDrink) spDrink.classList.toggle("kuma-is-hidden", !showAll && cat !== "drink");
    if (pcDrink) pcDrink.classList.toggle("kuma-is-hidden", !showAll && cat !== "drink");

    if (!showAll && cat === "drink") {
      for (const sel of [".menu-page-sp__cards", ".menu-page-pc__cards"]) {
        const container = document.querySelector(sel);
        if (!container) continue;
        const cards = container.querySelectorAll(":scope > article");
        cards.forEach((card) => card.classList.add("kuma-is-hidden"));
      }
    }

    setActiveMenuNav(cat);
  }

  function initMenuFilterIfPresent() {
    if (!document.body.classList.contains("page-menu")) return;

    markCardCategories(document.querySelector(".menu-page-sp__cards"));
    markCardCategories(document.querySelector(".menu-page-pc__cards"));

    const btns = document.querySelectorAll(".menu-page-sp__nav-btn, .menu-page-pc__nav-btn");
    btns.forEach((a) => {
      a.addEventListener("click", (ev) => {
        const href = a.getAttribute("href") || "";
        const cat = ANCHOR_TO_CAT[href] || null;
        if (!cat) return;
        ev.preventDefault();
        const already = a.classList.contains("kuma-is-active");
        applyMenuFilter(already ? null : cat);
      });
    });

    const cat = ANCHOR_TO_CAT[location.hash] || null;
    if (cat) applyMenuFilter(cat);
  }

  function init() {
    normalizeDrawerNav();
    initMenuFilterIfPresent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

