# bookmarks/entriesテーブル統合マイグレーション手順書

このドキュメントでは、entriesテーブルのデータをbookmarksテーブルに統合するマイグレーション手順を説明します。

## 概要

現在、bookmarksとentriesは1対1の関係になっているため、データを統合してパフォーマンスとコードの簡潔性を向上させます。

## 前提条件

- PostgreSQLデータベースが稼働していること
- Node.js環境がセットアップされていること
- 環境変数が設定されていること：
  - 開発環境: `LOCAL_DATABASE_URL`
  - 本番環境: `DATABASE_URL`

## マイグレーション手順

### 1. 現在の状態を確認

まず、既存のデータベースの状態を確認します：

```bash
# データベースの状態を確認
LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm tsx src/scripts/check-db-state.ts

# エントリの使用状況を分析（オプション）
LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm tsx src/scripts/analyze-entry-usage.ts
```

### 2. スキーマファイルの更新

`src/db/schema.ts`は既に更新済みです。以下のカラムがbookmarksテーブルに追加されています：

- `title`: text
- `canonicalUrl`: text  
- `rootUrl`: text
- `summary`: text
- `normalizedDomain`: text

対応するインデックスも追加されています。

### 3. Drizzleマイグレーションファイルの生成

```bash
# マイグレーションファイルを生成
pnpm db:generate
```

これにより、`drizzle/0006_adorable_human_robot.sql`（番号は変わる可能性があります）が生成されます。

### 4. マイグレーションの実行

```bash
# 開発環境
LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm db:migrate

# 本番環境
NODE_ENV=production pnpm db:migrate
```

### 5. データの移行

マイグレーションでカラムが追加されたら、既存のデータを移行します：

```bash
# 開発環境（.envファイルを使用）
pnpm tsx src/scripts/migrate-entry-data.ts

# 開発環境（環境変数を直接指定）
LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm tsx src/scripts/migrate-entry-data.ts

# 本番環境（.envファイルを使用）
NODE_ENV=production pnpm tsx src/scripts/migrate-entry-data.ts

# 本番環境（環境変数を直接指定）
DATABASE_URL=postgresql://user:pass@host/db NODE_ENV=production pnpm tsx src/scripts/migrate-entry-data.ts
```

このスクリプトは以下を実行します：
- 全bookmarksをチェックしてtitleがnullのものを検出
- 対応するentryデータを取得してbookmarkに設定
- バッチ処理で効率的に更新
- 移行結果を検証

### 6. 移行結果の確認

```bash
# 移行されたデータを確認
LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm tsx src/scripts/check-migration-data.ts

# マイグレーション状態を確認
LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm tsx src/scripts/check-migrations.ts
```

## トラブルシューティング

### マイグレーションエラーが発生した場合

1. **カラムが既に存在するエラー**
   ```
   error: column "xxx" of relation "bookmarks" already exists
   ```
   
   既にマイグレーションが部分的に適用されている可能性があります。手動で適用済みとしてマークできます：
   ```bash
   pnpm tsx src/scripts/mark-migration-applied.ts
   ```

2. **データ移行で一部のbookmarkが更新されない**
   
   entryIdがnullまたは対応するentryが存在しない可能性があります。ログを確認してください。

### ロールバック手順

マイグレーションを元に戻す必要がある場合：

```bash
# ロールバックスクリプトを実行
LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm tsx src/scripts/rollback-entries-migration.ts
```

このスクリプトは：
- 追加されたインデックスを削除
- 追加されたカラムを削除
- データは保持されるため、entriesテーブルは影響を受けません

## 次のステップ

マイグレーションが成功したら：

1. **アプリケーションコードの更新**
   - `src/app/actions/bookmark-actions.ts`からentries関連のJOINを削除
   - `src/lib/hatena/importer.ts`からentries作成ロジックを削除
   - その他のentries参照を更新

2. **テスト**
   - 全ての機能が正常に動作することを確認
   - パフォーマンスの改善を計測

3. **最終的なクリーンアップ**（十分なテスト後）
   - entryIdカラムを削除するマイグレーションを作成
   - entriesテーブルを削除するマイグレーションを作成
   - スキーマからentries関連の定義を削除

## 注意事項

- 本番環境でマイグレーションを実行する前に、必ずバックアップを取得してください
- データ移行は既存のデータ量によって時間がかかる場合があります
- マイグレーション中はアプリケーションの書き込み処理を停止することを推奨します