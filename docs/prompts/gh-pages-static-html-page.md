# プロンプト: 静的 HTML ページの整形・2ページ目以降の生成

以下を AI チャットに貼り、必要なら `[ ]` や「添付:」を埋めて使います。  
**添付:** ブラウザ「別名で保存」で得た HTML、および HTML が参照する小さなアセット（パス直しに必要な分）があると精度が上がります。

---

あなたは **GitHub Pages 用の静的スナップショット** を整えるエンジニアです。  
配置先はリポジトリ **`KumaTrekCode.github.io`** のフォルダー **`projects/open-cafe-wp-export/`** です（`index.html` と同階層に各 `*.html`、共通アセットは **`./assets/`**）。

## ゴール

- WordPress（または Local のテーマ）から取り込んだ **2ページ目以降の HTML** を、**トップ（`index.html`）と同じ運用ルール**で保存できる形にする。
- **GitHub Pages のサブパス**（`…/projects/open-cafe-wp-export/ページ名.html`）でも壊れない **相対パス**に統一する。
- 閲覧者向けの **注意帯**と、ポートフォリオへ戻る **フッター付近のリンク**を、**全ページで同じ文言・同じ構造**にする。

## 入力

- 今回整えるファイル名: **`[PAGE].html`**（例: `concept.html`）
- WP／ブラウザ書き出しの **生 HTML**（別名で保存されたファイルでも可。実ページがコンセプト専用か、トップの複製でないか確認すること）

## 必須ルール

1. **アセット・CSS・JS・画像**
   - 同一フォルダー内参照は **`./assets/...`** のように **相対パス**に揃える。
   - **`/wp-content/...` のようなサイトルート相対**や、ローカルだけ通る絶対 URL は使わない。

2. **ページ同士のリンク**
   - ナビ・本文の **他ページへのリンク**は、実在する **`./別ページ.html`** 形式に直す。

3. **`canonical` / `og:url`**
   - そのページ自身を指すようにする（例: `./concept.html`）。トップの `./index.html` のままにしない。

4. **KumaTrekCode 用ブロック（全ページ共通・必須）**  
   既存の **`projects/open-cafe-wp-export/index.html`** を手本に、次の **3か所**を **このページにも同じ内容で**入れる（WP から差し替えた場合は毎回再挿入する前提）。

### (A) `</head>` の直前

```html
<style id="kuma-demo-disclaimer-style">
  .kuma-demo-disclaimer {
    margin: 0;
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
    line-height: 1.55;
    text-align: center;
    background: #1e293b;
    color: #e2e8f0;
    font-family: system-ui, sans-serif;
  }
  .kuma-demo-disclaimer a {
    color: #93c5fd;
    text-decoration: underline;
  }
</style>
```

### (B) `<body …>` の直後（テーマのヘッダーより上）

```html
<p class="kuma-demo-disclaimer" role="note">
  このページは<a
    href="https://daily-trial.com/"
    target="_blank"
    rel="noopener noreferrer"
    >デイトラ</a
  >の教材に沿った<strong>課題用デモ</strong>です。実在する店舗の公式サイトではありません。
</p>
```

### (C) `</body>` の直前（既存の `script` 群の後）

```html
<!-- KumaTrekCode: WP 再書き出し時は head 内の kuma-demo-disclaimer-style、body 直後の .kuma-demo-disclaimer、およびページ末尾のこのブロックを残すか再貼り付けしてください -->
<style id="kuma-portfolio-return-style">
  .portfolio-return-kuma {
    max-width: 40rem;
    margin: 0 auto;
    padding: 2rem 1rem 2.75rem;
    text-align: center;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
    font-size: 0.9rem;
    font-family: system-ui, sans-serif;
  }
  .portfolio-return-kuma a {
    color: #1a1a1a;
    text-decoration: underline;
  }
</style>
<div class="portfolio-return-kuma">
  <a href="../open-cafe/index.html"
    >KumaTrekCode の Open cafe 紹介ページへ戻る</a
  >
</div>
```

**`../open-cafe/index.html`** は `open-cafe-wp-export` と `open-cafe` が兄弟ディレクトリである前提。**変えない。**

5. **`<body>` の `class` / `id`**
   - WP 書き出しのまま（デザイン用クラスは削除しない）。

6. **読み込む `script`**
   - そのページの書き出しに含まれるスクリプトだけ残す。

## リポジトリ側の作業（人間または別タスク）

- 新規 `*.html` を追加したら **登録プロンプト**（`docs/prompts/page-register.md`）に沿って、
  **`tools/sync-html-allowlist.json`** と **`tools/lint-a11y.mjs`** にパスを追加する。
- **全ページのリンクが揃ったあと**、`tools/lint-links.mjs` の `entryPoints` に **`projects/open-cafe-wp-export/index.html`** を足して一括リンクチェックできる（未揃いの間は 404 が出る）。
- WP 書き出し HTML は **`package.json` の `html-validate` 対象に含めない**運用と相性がよい。

## 出力してほしいもの

- 完成形の **`[PAGE].html` 全文**、または **差分が分かる説明**。
- 変更内容の箇条書き: 直したパス一覧、`canonical`/`og:url` の値、挿入した Kuma ブロックの有無。

## 自己チェック（生成後）

- [ ] `projects/open-cafe-wp-export/[PAGE].html` を開き、**CSS・画像・JS が 404 にならない**
- [ ] 注意帯が **ヘッダーより上**に出ている
- [ ] ページ最下部に **「KumaTrekCode の Open cafe 紹介ページへ戻る」** がある
- [ ] ナビの主要リンクが **同フォルダー内の存在する HTML** を指している

---

## 改訂メモ（人手で追記用）

- YYYY-MM-DD: （変更内容）
