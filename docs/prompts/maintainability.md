## プロンプト: 静的サイトの保守性を上げる（Open Cafe WP 書き出し）

WP → 静的書き出しを続けると「崩れの修正が点在」「差し替えで消える」「同じ修正を繰り返す」になりやすいです。  
このプロンプトは、**保守しやすい形に寄せる**ための改善タスクを AI に依頼する用途です。

---

あなたは `KumaTrekCode.github.io` の保守担当です。`projects/open-cafe-wp-export/` 配下の静的ページについて、
**将来ページを増やしても破綻しにくい**ように保守性を上げてください。見た目を大きく変えず、修正は最小にしてください。

## 現状の前提

- 静的ページは `projects/open-cafe-wp-export/*.html`
- 共有アセットは `projects/open-cafe-wp-export/assets/`
- WP から再書き出しすると HTML は差し替わる（手直しが消えうる）

## 優先方針（重要）

1. **HTML を直すより、CSS/JS 側で吸収**（再書き出しで消えにくい）
2. どうしても HTML を直す場合は、`KumaTrekCode:` コメント付近のように「再挿入前提のブロック」へ寄せるか、
   `gh-pages-static` 側にも同じ修正が入る運用にする
3. 変更は「共通化できるもの」から。ページ個別の場当たり修正を減らす

## やってほしいこと（チェックリスト）

### A. 共通 “パッチ置き場” を用意（配線済み）
- `projects/open-cafe-wp-export/assets/kuma-patch.css` / `kuma-patch.js` を共通パッチとして維持する
- **本番相当の各 `*.html`（`ci-smoke.html` 除く）** で、`style(1).css` の後に `kuma-patch.css`、`drawer.js` の後に `kuma-patch.js` を読み込む（**配線済み**）
- 新規ページ追加時も同じ順で link/script を入れる（再書き出しで消えたら再挿入）
- `kuma-patch.js` の `normalizeDrawerNav()` は、既存ドロワーリンク集合が想定セットと一致する場合のみ差し替える（不一致ページは触らない）

### B. “共通ブロック” を 1か所に寄せる
- `kuma-demo-disclaimer-style` / `kuma-demo-disclaimer` / `kuma-portfolio-return-style` など、各ページに散っている “Kuma ブロック” を
  「同じ内容が全ページに入る」ように整える（内容は変えず、差分が出ないように）
- 可能なら `docs/prompts/gh-pages-static-html-page.md` へ「このブロックはテンプレ」として追記する

### C. “壊れやすい参照” を減らす
- `../img/common/*.png` のような「存在しない前提パス」を CSS で参照している箇所があれば、`kuma-patch.css` で代替（CSS/SVG）する
  （例: `drawer__close` の close.png を CSS の × に置換）

### D. ナビ・ドロワーの一貫性（`kuma-patch.js` で対応済み）
- `kuma-patch.js` がドロワー項目を正規化する（想定リンク集合一致時のみ）
- メニューカテゴリフィルタは `menu-category-filter.js`（`data-menu-filter`）が担当。`kuma-patch.js` 側のレガシフィルタは `data-menu-filter` がある場合はスキップする
- WP 再書き出し後は HTML への `kuma-patch.js` / `menu-category-filter.js` 参照が消えていないか確認する

### E. 登録・検査フローの整備
- 新しい `*.html` を追加したときにやること（allowlist / a11y / sync）を `docs/prompts/page-register.md` に追記して、迷わないようにする

## 進め方

- まず `git diff` で現状の “上書きCSS/HTML修正” を棚卸しし、共通化できるものを列挙
- 影響が大きい変更は避け、1〜2ファイルに集約する（`kuma-patch.css` など）
- `npm run lint:a11y` が通ることを確認

## 出力

- 変更したファイル一覧
- どう保守性が上がったか（箇条書き）
- 今後ページ追加時の手順（1画面に収まる短さ）

