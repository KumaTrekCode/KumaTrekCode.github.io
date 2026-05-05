// ============================================
// js/drawer.js
// Drawer menu functionality
// ============================================

(function () {
  const hamburger = document.getElementById("hamburgerBtn");
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawerOverlay");
  const body = document.body;

  if (!hamburger || !drawer || !overlay) {
    return;
  }

  const closeButtons = drawer.querySelectorAll("[data-drawer-close]");
  const hamburgerIcon = hamburger.querySelector("img");

  /* Figma 19716:3297 系・茶丸 FAB 上は白アイコン、通常ヘッダーは cr-main 色 */
  const drawerIconsOnDarkFab =
    hamburger.classList.contains("open-cafe-drawer-fab") ||
    hamburger.classList.contains("news-figma-hero__menu-btn") ||
    hamburger.classList.contains("menu-page-hero__menu-fab") ||
    hamburger.classList.contains("header__hamburger--fab");
  const iconMenuFile = drawerIconsOnDarkFab
    ? "icon-drawer-menu-white.svg"
    : "icon-drawer-menu-main.svg";
  const iconCloseFile = drawerIconsOnDarkFab
    ? "icon-drawer-close-white.svg"
    : "icon-drawer-close-main.svg";

  function resolveIconUrl(fileName) {
    if (!hamburgerIcon || !hamburgerIcon.src) {
      return `img/common/${fileName}`;
    }
    try {
      return new URL(fileName, hamburgerIcon.src).toString();
    } catch (_) {
      return `img/common/${fileName}`;
    }
  }

  const iconMenuSrc = resolveIconUrl(iconMenuFile);
  const iconCloseSrc = resolveIconUrl(iconCloseFile);

  // ドロワーを開く
  function openDrawer() {
    drawer.classList.add("active");
    overlay.classList.add("active");
    hamburger.classList.add("active");
    body.classList.add("drawer-open");
    hamburger.setAttribute("aria-expanded", "true");
    if (hamburgerIcon) {
      hamburgerIcon.src = iconCloseSrc;
    }
  }

  // ドロワーを閉じる
  function closeDrawer() {
    drawer.classList.remove("active");
    overlay.classList.remove("active");
    hamburger.classList.remove("active");
    body.classList.remove("drawer-open");
    hamburger.setAttribute("aria-expanded", "false");
    if (hamburgerIcon) {
      hamburgerIcon.src = iconMenuSrc;
    }
  }

  // ハンバーガーボタンクリック
  hamburger.addEventListener("click", function () {
    if (drawer.classList.contains("active")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  // 閉じるボタンクリック
  closeButtons.forEach(function (button) {
    button.addEventListener("click", closeDrawer);
  });

  // オーバーレイクリック
  overlay.addEventListener("click", closeDrawer);

  // ESCキーで閉じる
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("active")) {
      closeDrawer();
    }
  });

  // ドロワー内のリンクをクリックしたら閉じる
  const drawerLinks = drawer.querySelectorAll(".drawer__link");
  drawerLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      closeDrawer();
    });
  });
})();
