// メニュー一覧: カテゴリナビでカード／ドリンク枠を表示切替（同一ページ内）
(function () {
  "use strict";

  var ACTIVE = "is-active";
  var HIDDEN = "is-menu-filter-hidden";

  /**
   * @param {HTMLElement} root
   * @param {string} fallbackSlug
   */
  function assignDrinkCategory(root, fallbackSlug) {
    var cat = fallbackSlug || "drink";
    root.querySelectorAll(".menu-page-sp__drinks, .menu-page-pc__drink").forEach(function (el) {
      if (!el.hasAttribute("data-menu-cat")) {
        el.setAttribute("data-menu-cat", cat);
      }
    });
  }

  /** @param {HTMLElement} root */
  function assignGrandCardCategories(root) {
    var blocks = [
      ".menu-page-sp__inner .menu-page-sp__card",
      ".menu-page-pc__inner .menu-page-pc__card",
    ];
    for (var b = 0; b < blocks.length; b++) {
      var sel = blocks[b];
      var cat = "pasta";
      root.querySelectorAll(sel).forEach(function (card) {
        if (card.id && card.id.indexOf("menu-sp-") === 0) {
          var slug = card.id.slice("menu-sp-".length);
          if (slug) {
            cat = slug;
          }
        }
        if (!card.hasAttribute("data-menu-cat")) {
          card.setAttribute("data-menu-cat", cat);
        }
      });
    }
  }

  /**
   * カスタムマークアップ: .menu-page-sp__block--pasta 等の BEM modifier から data-menu-cat を付与
   * @param {HTMLElement} root
   */
  function assignCategoryBlocksFromClass(root) {
    var re = /menu-page-sp__block--([\w-]+)/;
    root.querySelectorAll(".menu-page-sp__block").forEach(function (el) {
      var m = el.className && el.className.match(re);
      if (!m || m[1] === "grand") {
        return;
      }
      if (!el.hasAttribute("data-menu-cat")) {
        el.setAttribute("data-menu-cat", m[1]);
      }
    });
    var rePc = /menu-page-pc__block--([\w-]+)/;
    root.querySelectorAll("[class*='menu-page-pc__block--']").forEach(function (el) {
      var m = el.className && el.className.match(rePc);
      if (!m) {
        return;
      }
      if (!el.hasAttribute("data-menu-cat")) {
        el.setAttribute("data-menu-cat", m[1]);
      }
    });
  }

  function init() {
    var root = document.getElementById("menu-content");
    if (!root) {
      return;
    }

    var navBtns = root.querySelectorAll(
      ".menu-page-sp__nav-btn[data-menu-filter], .menu-page-pc__nav-btn[data-menu-filter]",
    );
    if (!navBtns.length) {
      return;
    }

    assignGrandCardCategories(root);
    assignCategoryBlocksFromClass(root);
    assignDrinkCategory(root, "drink");

    var panels = root.querySelectorAll("[data-menu-cat]");
    /** @type {string|null} */
    var activeFilter = null;

    function applyFilter() {
      panels.forEach(function (el) {
        var c = el.getAttribute("data-menu-cat");
        if (!c) {
          return;
        }
        if (activeFilter === null || c === activeFilter) {
          el.classList.remove(HIDDEN);
          el.removeAttribute("hidden");
        } else {
          el.classList.add(HIDDEN);
          el.setAttribute("hidden", "");
        }
      });

      navBtns.forEach(function (btn) {
        var slug = btn.getAttribute("data-menu-filter");
        var isOn = activeFilter !== null && slug === activeFilter;
        btn.classList.toggle(ACTIVE, isOn);
        btn.setAttribute("aria-pressed", isOn ? "true" : "false");
      });
    }

    navBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var slug = btn.getAttribute("data-menu-filter");
        if (!slug) {
          return;
        }
        if (activeFilter === slug) {
          activeFilter = null;
        } else {
          activeFilter = slug;
        }
        applyFilter();
      });
    });

    applyFilter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
