/**
 * トップへ戻るボタン：
 * - クリックでふわっと最上部へスクロール
 * - 画面右下に常に固定表示
 * - 最上部では非表示、少しスクロールすると表示
 */
(function () {
  var toTop = document.getElementById('to-top');
  if (!toTop) return;

  var scrollThreshold = 80; // このピクセル以上スクロールしたらボタン表示

  function updateVisibility() {
    if (window.scrollY <= scrollThreshold) {
      toTop.classList.add('is-at-top');
    } else {
      toTop.classList.remove('is-at-top');
    }
  }

  // 初回表示時
  updateVisibility();

  // スクロールで表示/非表示を切り替え
  window.addEventListener('scroll', function () {
    updateVisibility();
  }, { passive: true });

  toTop.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
})();
