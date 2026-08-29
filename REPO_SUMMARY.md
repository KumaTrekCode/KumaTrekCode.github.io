# REPO_SUMMARY — KumaTrekCode.github.io

> 棚卸し日: 2026-08-02  
> 対象: `KumaTrekCode.github.io/`（GitHub: `KumaTrekCode/KumaTrekCode.github.io`）  
> 公開: https://kumatrekcode.github.io/  
> 目的: 統廃合の判断材料（本ファイルは断定せず材料提示のみ）

---

## 目的・現在の役割

GitHub Pages 向けの **静的ポートフォリオ／個人サイト** の正本。  
ルート＝公開ドキュメントルート。動的アプリ本体は別リポに置き、**静的成果物だけ**を `projects/` に載せる方針。

---

## 主要な機能・モジュール構成（partials / ビルド含む）

```
KumaTrekCode.github.io/
├── index.html / about.html / 404.html   … 公開トップ層
├── assets/   … CSS（tokens.css 共通）・JS（scroll-top）
├── img/      … 配信用画像（source/ はマスター）
├── projects/ … 制作物の静的配置
│   ├── open-cafe/ (+ site/)
│   ├── open-cafe-wp-export/   … WP書き出し大量 HTML
│   └── youtube-dashboard/     … ランキングダッシュボード
├── tools/    … npm 専用保守（Pages では配信されない想定）
│   ├── partials/              … nav / footer / about 長文
│   ├── projects.json          … トップ #works カード元データ
│   ├── render-works.mjs       … JSON → index.html の works ブロック
│   ├── sync-site.mjs          … partials 注入・meta/OG・相対パス・sitemap
│   ├── sync-html-allowlist.json
│   └── lint / verify / optimize / next-task など
├── docs/     … WORKFLOW・prompts・learning・harness 説明
├── AGENTS.md / ROADMAP.md    … エージェント契約・実装キュー
└── .github/workflows/        … CI check / a11y月次 / youtube更新
```

### ビルド／同期の核

| コマンド | 役割 |
|----------|------|
| `npm run sync` | `render-works` → `sync-site`（partials・pageMeta・OG・robots/sitemap・相対パス化） |
| `npm run check` | sync + minify + icons + html-validate + verify + smoke + eslint + links + a11y + audit |
| pre-push | `simple-git-hooks` で `npm run check` |

**運用ルール:** ナビ／フッタ／About 長文は HTML を直編集せず `tools/partials/*.html` を編集 → `npm run sync`。手修正は次回 sync で消える。

**公開制作物（`projects.json`）:** Open cafe、クレカ動画ランキング（youtube-dashboard）。django-* は掲載なし。

---

## 直近の活動状況

| 指標 | 実態（2026-08-02） |
|------|-------------------|
| 最新コミット | 2026-08-01（CI Node 22、エージェント用ハーネス足場、学習メモ） |
| 6月以降コミット | 約 **52** → リポ全体は **活発** |
| 内訳の偏り | `projects/youtube-dashboard` が多数（日次ランキング更新）。`tools/`・サイト本体は少なめ。`open-cafe` 本体はほぼ静止 |
| Agent queue | ROADMAP 上は空き。Backlog に WP a11y・youtube 導線・learning→queue 切り出し |

**総評:** **活発**だが、コミットの大半は youtube-dashboard の定期更新。サイト骨格・partials 系はメンテ可能だが変更頻度は低い。

---

## 依存関係・技術スタック

| 層 | 内容 |
|----|------|
| 配信 | 静的 HTML/CSS/JS（フレームワークなし）。GitHub Pages |
| Node | `type: module`。ビルド／検証のみ（本番ランタイムではない） |
| 主要 devDeps | html-validate、eslint、esbuild、sharp、linkinator、axe-core、jsdom、simple-git-hooks |
| CI | `npm ci` → `npm run check`。Dependabot（npm 週次） |
| 外部 | YouTube Data API（youtube-dashboard 用 Actions）。Open Cafe はデイトラ課題の静的成果 |

Python／Django ランタイム依存は **このリポには無い**。

---

## 他プロジェクト（daytra-python の django-* 等）との重複候補

| 候補 | 見え方 |
|------|--------|
| **django-auth-api / django-blog** | daytra-python 側に DRF+Next 実装あり。本リポの `projects.json`・公開 HTML には **未掲載**。コード重複というより **PF 成果の置き場が分かれている**（実装 Git ≠ 公開静的サイト） |
| **「ダッシュボード」** | 本リポ `youtube-dashboard` と、daytra-python の AI News／個人 `docs/pages/dashboard.md`。名前は近いが用途は別（YouTube 集計 vs 知識／オペ） |
| **学習メモ** | 本リポ `docs/learning/` と Obsidian `knowledge/`、daytra-python `ROADMAP.md`。テーマが重なりうる（キャリア・AI）。意図的に「サイト用キュー」と「人生方針／日報」を分ける記述あり |
| **エージェント足場** | 本リポ AGENTS.md / `task:next` と、daytra-python の Cursor／AI News 運用。契約の二重化候補 |
| **Open Cafe** | `Web制作/` 側の制作物と本リポ `projects/open-cafe*` が対応しうる（静的コピー／エクスポートの関係） |

---

## 「残す / 畳む / 他と統合する」材料（判断はしない）

### 残す方向の材料

- 公開 URL・GitHub Pages の **正式な配信元**
- partials + `npm run check` の保守パイプラインが既に太い（品質・a11y・OG）
- ポートフォリオ Ver2 として ROADMAP／本業側でも参照される成果物置き場
- youtube-dashboard が実際に定期更新されている（死んでいない）

### 畳む・縮小方向の材料

- `open-cafe-wp-export` の HTML 量が大きく、allowlist／a11y 負債が Backlog に残る
- コミットの大半が youtube 自動更新で、サイト「本体」の進化は鈍い可能性
- django-* を公開しない方針なら、PF としての説明がサイトと Git 実装で分断したまま

### 他と統合する方向の材料

- daytra-python の django-* を **静的ビルド or デモ導線**として本リポ `projects/` に載せる（README が推奨する「静的出力だけ置く」パターン）
- `docs/learning/` を Obsidian `knowledge/` に寄せ、本リポは WORKFLOW／prompts／実装キューだけにする
- youtube-dashboard を別リポ化し、本リポは成果 HTML の受け皿だけにする
- 逆に daytra-python を学習・運用、本リポを公開専用と明示し、リンク表だけ一本化する（コード統合ではなく役割統合）

### リポごと廃止する場合に失うもの（参考）

- 公開サイト・OG／sitemap／共通ナビの単一正本
- pre-push / CI の静的品質ゲート
- youtube-dashboard の Pages 上の見せ場

---

## 補足

隣接の `daytra-python`（学習・AI News）・`knowledge/`（日報 Vault）・`Web制作/`（制作原盤）とは **役割分担済みの別リポ／別領域**。統廃合は「コードマージ」より **公開に何を載せるか／学習メモをどこに残すか** の線引きが主戦場になりやすい。
