# Bookmark RAG Agent

MastraフレームワークとpgvectorでRAG（Retrieval-Augmented Generation）を実装したブックマーク管理エージェントです。

## 機能

- 📚 テキストコンテンツのembedding化とpgvectorへの保存
- 🔍 自然言語によるセマンティック検索
- 🌐 Web検索機能（シミュレート）
- 🤖 OpenAI GPT-4を使用したRAGベースの応答生成

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. PostgreSQL + pgvectorの起動

```bash
docker compose up -d
```

### 3. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集してOPENAI_API_KEYを設定
```

### 4. 開発サーバーの起動

```bash
pnpm dev
```

## 使用方法

### CLIから実行

```bash
# サンプルスクリプトの実行
pnpm tsx src/example-usage.ts
```

### Mastra Playgroundから使用

```bash
pnpm dev
```

ブラウザで http://localhost:3000 を開き、`bookmarkRagAgent`を選択して対話できます。

## プロジェクト構成

```
src/mastra/
├── agents/
│   ├── bookmark-rag-agent.ts  # RAGエージェント
│   └── weather-agent.ts       # サンプルエージェント
├── tools/
│   ├── embedding-tool.ts      # Embedding & 検索ツール
│   └── web-search-tool.ts     # Web検索ツール
└── index.ts                   # Mastra設定
```

## 必要な依存関係

```bash
pnpm add pg @types/pg ai
```

## Docker Compose設定

PostgreSQL 17 + pgvector拡張を使用：

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg17
    # ...
```

## 今後の改善点

- 実際のWeb検索API（Google Custom Search、Bing等）の統合
- Webページコンテンツの自動抽出（Playwright、Puppeteer等）
- より高度なRAG機能（チャンキング戦略、リランキング等）
- ユーザー認証とマルチテナント対応