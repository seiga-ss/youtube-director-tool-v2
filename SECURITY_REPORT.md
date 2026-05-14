# セキュリティ脆弱性レポート & 本番稼働前チェックリスト

## 1. 実装済みセキュリティ対策

### 認証・セッション管理
- [x] **bcryptパスワードハッシュ化** — passlib[bcrypt] を使用、ソルト付きハッシュ
- [x] **JWTトークン** — HS256署名、24時間有効期限、iat（発行時刻）付き
- [x] **アカウントロック** — ログイン失敗5回で30分ロック
- [x] **ログイン失敗時の一般的エラー** — 「メールアドレスまたはパスワードが正しくありません」（どちらが間違いか不明にする）
- [x] **セッション有効期限** — 24時間

### アクセス制御（マルチテナント）
- [x] **会社単位のデータ分離** — 全DBクエリにcompany_idフィルタを適用
- [x] **ロールベースアクセス制御** — employee / admin / super_admin
- [x] **super_adminのみ全社データアクセス可能**
- [x] **JWT Bearer認証** — 全APIエンドポイントに適用（/api/auth/login と /api/health を除く）

### API セキュリティ
- [x] **レート制限** — login: 5回/分/IP、setup: 3回/時/IP（slowapi使用）
- [x] **CORS設定** — 許可オリジンをVercel *.vercel.app + 明示的リストに限定
- [x] **SQLインジェクション対策** — SQLAlchemyのORMパラメータバインディングを使用（直接SQL文字列結合なし）
- [x] **エラーメッセージの抽象化** — 内部情報（スタックトレース等）を含めない

### フロントエンドセキュリティ
- [x] **CSPヘッダー** — Content-Security-Policy、X-Frame-Options: DENY、X-Content-Type-Options: nosniff など
- [x] **401自動ログアウト** — APIからの401応答でlocalStorageトークンを削除しログインページへリダイレクト
- [x] **クライアントサイド認証ガード** — AuthContextでのルート保護

### インフラ
- [x] **環境変数で機密情報管理** — JWT_SECRET_KEY, SUPABASE_SERVICE_KEY, API keys
- [x] **HTTPS** — Render/Vercel 本番環境はHTTPS強制
- [x] **PostgreSQL接続** — psycopg2 + pool_pre_ping + pool_recycle で堅牢な接続管理

---

## 2. 既知のリスクと制限事項

### JWTトークンのlocalStorage保存（XSSリスク）
**リスクレベル: 中**

JWTをlocalStorageに保存しているため、XSS攻撃が成功した場合にトークンが窃取される可能性がある。

**軽減策（実装済み）:**
- CSPヘッダーによりインラインスクリプト実行を制限
- X-XSS-Protectionヘッダー

**推奨対策（未実装 - 本番前に検討）:**
- httpOnly Cookie + CSRF トークンに移行（Vercel/Renderのドメイン設定が必要）
- または短いJWT有効期限（1時間）+ リフレッシュトークン機能

### レート制限の範囲
**リスクレベル: 低**

ログイン・セットアップエンドポイントにレート制限を適用。全エンドポイントへの10req/min制限は
UIの正常動作を阻害する可能性があるため（ページ読み込み時に複数API呼び出しが発生）、
認証エンドポイントのみに絞った。

**推奨対策（未実装）:**
- VercelのWAF/DDoS保護を活用
- Renderの保護機能を確認

### Supabase RLS
**リスクレベル: 低**

SQLAlchemyはサービスロールのDB接続を使用するため、SupabaseのRow Level Securityは
自動適用されない。アプリケーション層（FastAPI）でのcompany_idフィルタリングが主な防御。

RLSポリシーは `supabase/migrations/001_init.sql` に記載されているが、
現在の実装ではSQLAlchemy接続に対して有効にならない。

**対策:**
- アプリケーション層の `company_id` フィルタリングが確実に全エンドポイントに適用されていることを確認（実装済み）

---

## 3. 本番稼働前チェックリスト

### 必須対応

#### 環境変数設定
- [ ] **Render: `JWT_SECRET_KEY`** — 最低32文字のランダム文字列を生成して設定
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- [ ] **Render: `DATABASE_URL`** — Supabase PostgreSQL接続文字列を設定
  ```
  postgresql://postgres:[PASSWORD]@db.egqzldhmrehfrwvdrfar.supabase.co:5432/postgres
  ```
- [ ] **Render: `SUPABASE_URL`** — `https://egqzldhmrehfrwvdrfar.supabase.co`
- [ ] **Render: `SUPABASE_SERVICE_KEY`** — Supabaseサービスロールキー
- [ ] **Render: `CORS_ORIGINS`** — Vercelの本番URLを設定
- [ ] **Vercel: `NEXT_PUBLIC_API_URL`** — RenderバックエンドのURLを設定

#### 初期アカウント作成
- [ ] バックエンドデプロイ後、以下のAPIを1回だけ呼び出してsuper_adminを作成:
  ```bash
  curl -X POST https://YOUR_RENDER_URL/api/auth/setup \
    -H "Content-Type: application/json" \
    -d '{"email": "seiga1215appo@gmail.com", "name": "せいが", "password": "YOUR_STRONG_PASSWORD"}'
  ```
- [ ] 初期設定完了後、`/api/auth/setup` エンドポイントは自動的に無効化される（ユーザー数 > 0 の場合403を返す）

#### データベース
- [ ] Supabase SQL Editorで `supabase/migrations/001_init.sql` を実行
- [ ] `Base.metadata.create_all()` が正常に全テーブルを作成することを確認

### 推奨対応（必須ではない）

- [ ] **パスワードポリシー**: 最小8文字、英数字記号混在のバリデーションをAPIに追加
- [ ] **ログ監査**: ログイン成功/失敗のログをデータベースまたは外部サービスに記録
- [ ] **メール通知**: アカウントロック時にメール通知を送信
- [ ] **2FA（二要素認証）**: 管理者アカウントに対してTOTPを追加
- [ ] **短期JWTとリフレッシュトークン**: 現在24時間 → 1時間+リフレッシュに変更

---

## 4. OWASP Top 10 対応状況

| # | リスク | 対応状況 |
|---|--------|----------|
| A01 | アクセス制御の不備 | ✅ JWT認証 + company_idフィルタ + RBAC |
| A02 | 暗号化の失敗 | ✅ bcrypt + JWT HS256 / ⚠️ JWT in localStorage |
| A03 | インジェクション | ✅ SQLAlchemy ORM（パラメータバインディング） |
| A04 | 安全でない設計 | ✅ マルチテナント設計、ロック機能 |
| A05 | セキュリティの設定ミス | ✅ CORS制限、CSPヘッダー |
| A06 | 脆弱なコンポーネント | ✅ 最新バージョンのパッケージを使用 |
| A07 | 認証・認可の失敗 | ✅ アカウントロック、一般的エラーメッセージ |
| A08 | ソフトウェア・データの整合性 | ✅ 環境変数で秘密情報管理 |
| A09 | セキュリティログの不足 | ⚠️ 基本的なエラーハンドリングのみ（監査ログ未実装） |
| A10 | SSRF | ✅ ユーザー入力URLへの直接アクセスなし |
