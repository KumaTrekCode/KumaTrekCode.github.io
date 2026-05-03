# 画像・アイコン対応表（About / build:icons）

`tools/build-skill-icons.mjs` の **`GEMINI_TO_KEY`** と出力ファイルの対応です。Gemini の PNG を `img/` に置いたあと **`npm run build:icons`** で `img/source/icon-skill-{key}.png` に取り込み、`img/icon-skill-{key}-{sm|md|lg}.{png,webp}` が生成されます。

| Gemini ファイル名（`img/` 投入時） | key | 出力ベース名 | About での用途 |
|-----------------------------------|-----|----------------|-----------------|
| `Gemini_Generated_Image_309sbi309sbi309s.png` | `large-vehicle` | `icon-skill-large-vehicle-*` | 保有スキル・大型運転 |
| `Gemini_Generated_Image_1r0j191r0j191r0j.png` | `auto-mechanic` | `icon-skill-auto-mechanic-*` | 保有スキル・自動車整備士 |
| `Gemini_Generated_Image_4n4zgr4n4zgr4n4z.png` | `electrician` | `icon-skill-electrician-*` | 保有スキル・電気工事士 |
| `Gemini_Generated_Image_xwypu5xwypu5xwyp.png` | `hazmat` | `icon-skill-hazmat-*` | 保有スキル・危険物取扱 |
| `Gemini_Generated_Image_gwa5zxgwa5zxgwa5.png` | `webdev` | `icon-skill-webdev-*` | 今後取得・Web 開発 |
| `Gemini_Generated_Image_lvfa8lvfa8lvfa8l.png` | `ecu` | `icon-skill-ecu-*` | 保有スキル・ECU 計測 |
| `Gemini_Generated_Image_l0mtfkl0mtfkl0mt.png` | `future-linux` | `icon-skill-future-linux-*` | 今後取得・Linux 環境 |
| `Gemini_Generated_Image_9km4nj9km4nj9km4.png` | `future-python` | `icon-skill-future-python-*` | 今後取得・データ処理・自動化 |

## 差し替え手順

1. 新しい Gemini を **`img/`** に上記のファイル名で保存（または `GEMINI_TO_KEY` に行を追加してファイル名を変更）。
2. **`npm run build:icons`**（`npm run check` に含まれる）。
3. **`about.html`** の `<img width height>` が変わった場合は、コンソール末尾の **lg dimensions** ログに合わせて更新。

トップのプロフィール・About 用イラストの JPG/WebP は **`npm run optimize-images`**（`tools/optimize-images.mjs`）です。本表とは別パイプラインです。
