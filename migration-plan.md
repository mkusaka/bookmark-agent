# bookmarks/entriesテーブル統合マイグレーション計画

## 現状の分析

### テーブル構造
- **bookmarksテーブル**: ユーザーのブックマーク情報を保存
  - entryIdを通じてentriesテーブルを参照
  - URL、コメント、説明、Markdownコンテンツを含む
  
- **entriesテーブル**: Webページのメタ情報を正規化して保存
  - title、canonical_url（ユニーク）、summary、domainなど
  - 理論的には複数のbookmarkから参照される設計

### 設計意図と実態
- **設計意図**: 同一URLを複数ユーザーがブックマークした場合の重複を避ける
- **実態**: 「実質的に1対1」とのことから、この共有はほとんど発生していない

## マイグレーション方針

### 1. データ統合の方向性
entriesテーブルのカラムをbookmarksテーブルに統合する：

```sql
-- bookmarksテーブルに追加するカラム
ALTER TABLE bookmarks ADD COLUMN title TEXT;
ALTER TABLE bookmarks ADD COLUMN canonical_url TEXT;
ALTER TABLE bookmarks ADD COLUMN root_url TEXT;
ALTER TABLE bookmarks ADD COLUMN summary TEXT;
ALTER TABLE bookmarks ADD COLUMN normalized_domain TEXT;
```

### 2. マイグレーション手順

#### Phase 1: カラム追加とデータコピー
1. bookmarksテーブルに新しいカラムを追加
2. JOIN経由でentriesテーブルからデータをコピー
3. インデックスを新しいカラムに設定

#### Phase 2: コードの更新
1. スキーマ定義の更新
2. bookmark-actions.tsの更新（JOINを削除）
3. importer.tsの更新（entryの作成/検索ロジックを削除）
4. その他の関連コードの更新

#### Phase 3: 旧構造の削除
1. entryId外部キーの削除
2. entriesテーブルの削除
3. 不要なインデックスの削除

### 3. 考慮事項

#### データの整合性
- 複数のbookmarkが同じentryを参照している場合の対処
  - 各bookmarkに独立してentryデータをコピー
  - canonical_urlの重複を許可（ユーザーごとにユニーク）

#### パフォーマンスへの影響
- entriesテーブルの全文検索インデックスをbookmarksに移行
- JOINが不要になることで、クエリパフォーマンスが向上する可能性

#### 後方互換性
- マイグレーション中も既存のアプリケーションが動作するよう配慮
- 段階的なデプロイが可能な構造

### 4. ロールバック計画
- 各フェーズで独立したマイグレーションとして実装
- 問題が発生した場合は前のフェーズに戻せる構造

## 実装スケジュール
1. Phase 1のマイグレーションスクリプト作成
2. テスト環境での検証
3. 本番環境への適用
4. Phase 2のコード更新
5. Phase 3の旧構造削除（十分な検証後）