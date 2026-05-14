# YouTube Director Tool

YouTubeディレクター業務の90%を削減するAIワークフローツール。

## 機能

| 機能 | 内容 |
|------|------|
| リサーチ | キーワード検索・再生数/拡散率分析・文字起こし・コメント抽出 |
| 企画生成 | リサーチ結果からAIがバズ企画・タイトル案を立案 |
| 台本生成 | 10〜25分のフル台本自動生成・ブラッシュアップ |
| サムネ生成 | テキスト案生成 + DALL-E画像自動生成 |
| ディレクション | カンバンタスク管理・Discord通知・Notion連携 |

## 必要なAPIキー

| サービス | 用途 | 取得先 |
|----------|------|--------|
| YouTube Data API v3 | 動画検索・統計取得 | Google Cloud Console |
| Anthropic API | 企画・台本生成 | console.anthropic.com |
| OpenAI API | サムネイル画像生成 | platform.openai.com |
| Discord Bot Token | 進捗通知（任意） | discord.com/developers |
| Notion API | タスク同期（任意） | notion.so/my-integrations |

## セットアップ

```bash
# 1. リポジトリをクローン
git clone <your-repo>
cd youtube-director-tool

# 2. バックエンドの環境変数設定
cp backend/.env.example backend/.env
# .env をエディタで開き、各APIキーを入力

# 3. バックエンド起動（Python）
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# 4. フロントエンド起動（別ターミナル）
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## Docker で起動

```bash
cp backend/.env.example backend/.env
# .env にAPIキーを入力してから
docker-compose up --build
```

## 推奨ワークフロー

1. **リサーチ** → キーワードを入力してバズ動画を収集（5〜10分）
2. **企画生成** → リサーチ結果を選択してAIが企画立案（30秒）
3. **台本生成** → 企画を選んでフル台本を生成（1〜2分）
4. **サムネ生成** → 企画・タイトルを入力してサムネ画像を生成（1〜2分）
5. **ディレクション** → プロジェクトを作成してタスク管理・Discord通知

## 技術スタック

- **Backend**: Python FastAPI + SQLite + SQLAlchemy
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **AI**: Claude claude-sonnet-4-6 (企画・台本) + DALL-E 3 (サムネイル)
- **YouTube**: YouTube Data API v3 + youtube-transcript-api
- **連携**: Discord Bot API + Notion API
