document.addEventListener("DOMContentLoaded", () => {
  if (typeof Swiper === "undefined") {
    return;
  }

  const mainvisualElement = document.querySelector(
    ".mainvisual__background-swiper",
  );

  if (!mainvisualElement) {
    return;
  }

  // メインビジュアル背景スライダー
  new Swiper(mainvisualElement, {
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
    speed: 1000,
    pagination: {
      el: ".mainvisual__pagination",
      type: "bullets",
      clickable: true,
    },
  });
});
