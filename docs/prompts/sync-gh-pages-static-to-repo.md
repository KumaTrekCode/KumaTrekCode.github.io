# プロンプト: gh-pages-static → open-cafe-wp-export 統合（方針 A）

以下を AI チャットに貼って、ターミナル作業を依頼します。  
**方針 A** = `gh-pages-static` を正とし、**同名ファイルは DEST を SRC で上書き**する `rsync -av`。

---

あなたは macOS 上でターミナル操作を行います。次の作業を**安全な順**で実行し、結果を簡潔に報告してください。

## 目的

ローカル WordPress テーマ内の静的書き出しフォルダー

`SRC` =  
`/Users/yasuakiinaguma/Local Sites/deitora-day36-open-cafe/app/public/wp-content/themes/KUMA_DYA36_Open-Cafe/gh-pages-static`

の内容を、GitHub Pages 用のポートフォリオリポジトリ内の

`DEST` =  
`/Users/yasuakiinaguma/.cursor/projects/var-folders-08-g68pfg7d4zg1hbmp74qwhmv80000gn-T-3098da88-97f5-42ef-ac68-c446ad1a568b/KumaTrekCode.github.io/projects/open-cafe-wp-export`

に**フォルダー統合（マージ）**する。Finder での手コピーは使わない。

## 同期方針（本プロンプトの前提）

- **方針 A（採用）**  
  `gh-pages-static` の内容を**正**とし、`open-cafe-wp-export` に取り込む。  
  **同名ファイルは必ず `SRC` で `DEST` を上書き**する。  
- 方針 B（`--ignore-existing`）や C（`--update`）は、**別途明示がない限り使わない。**

## 技術的ルール

- `rsync` を使う。  
- パスに**スペース**があるため、`SRC` / `DEST` は**常に二重引用符**で囲む。  
- `"$SRC/"` の**末尾スラッシュ**により、`SRC` 直下の**中身**を `DEST` へ合流させる。

## 手順

1. `SRC` と `DEST` が**ディレクトリとして存在する**ことを確認する（`test -d` 等）。  
2. **まず dry-run**（実コピーなし）:  

   `rsync -avn "$SRC/" "$DEST/"`

3. 問題なければ **方針 A** で本番同期:  

   `rsync -av "$SRC/" "$DEST/"`

4. 同期後、次を**短く案内**する:

   - `DEST` 直下に**新しい `*.html`** がある場合、`tools/sync-html-allowlist.json` に各パスを追記。  
   - `index.html` 等の**手入れ済みブロック**（注意帯・戻るリンク）は上書きで**消える**可能性がある。消えたら `gh-pages-static` 側にブロックを入れてから再同期するか、`DEST` で再挿入。  
   - リポジトリルートで `npm run sync` を実行できる旨。

## 出力

- 実行したコマンド列  
- `rsync` の結果の要約  
- エラーがあればできるだけそのまま表示  

---

## 例外（別途チャットで明示するとき）

- 今回だけ同名は上書きせず足りないファイルのみ追加する:  

  `rsync -av --ignore-existing "$SRC/" "$DEST/"`

---

## 改訂メモ（人手で追記用）

- YYYY-MM-DD: （変更内容）
