import anthropic
from config import settings
from services import mock_data
import json

_MOCK = not bool(settings.ANTHROPIC_API_KEY)
client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY) if not _MOCK else None
MODEL = "claude-sonnet-4-6"


def _call(system: str, user: str, max_tokens: int = 4096) -> str:
    message = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text


def summarize_video(title: str, transcript: str, comments: list[dict]) -> str:
    if _MOCK:
        return mock_data.mock_summary(title)
    comments_text = "\n".join([f"・{c['text']}" for c in comments[:10]])
    return _call(
        system="あなたはYouTube動画コンテンツの分析専門家です。簡潔に日本語で回答してください。",
        user=f"""以下の動画を分析し、要点をまとめてください。

タイトル: {title}

文字起こし（冒頭）:
{transcript[:2000] if transcript else "取得不可"}

人気コメント:
{comments_text}

以下の形式でまとめてください：
## 動画の概要（2〜3文）
## 視聴者が反応したポイント（箇条書き3〜5点）
## チャンネルが伸びている理由の仮説（1〜2文）""",
        max_tokens=800,
    )


def generate_planning(
    keyword: str,
    videos: list[dict],
    past_analysis: str = "",
) -> dict:
    if _MOCK:
        return mock_data.mock_planning(keyword)
    video_summary = "\n".join([
        f"- 【{v['title']}】再生:{v['view_count']:,} 登録:{v['subscriber_count']:,} 拡散率:{v['viral_rate']:.1f}x チャンネル:{v['channel_name']}"
        for v in videos[:20]
    ])

    response = _call(
        system="""あなたはYouTubeチャンネルの戦略ディレクターです。
リサーチデータを元に、バズりやすく視聴者に深く刺さる企画を立案してください。
必ずJSON形式で返してください。""",
        user=f"""テーマ: {keyword}

## バズっている動画リスト
{video_summary}

## 過去チャンネル分析
{past_analysis or "データなし"}

以下のJSON形式で企画を出力してください：
{{
  "hit_concepts": [
    {{
      "concept": "企画の概要（1〜2文）",
      "titles": ["タイトル案1", "タイトル案2", "タイトル案3"],
      "reason": "なぜ伸びると考えるか（1〜2文）",
      "hook": "冒頭の掴み案（1文）"
    }}
  ],
  "avoid_concepts": [
    {{
      "concept": "避けるべき企画の概要",
      "reason": "なぜ伸びないと考えるか"
    }}
  ],
  "insights": "全体的な戦略インサイト（3〜5文）"
}}

hit_conceptsは5案、avoid_conceptsは3案出してください。""",
        max_tokens=2000,
    )

    try:
        json_start = response.find("{")
        json_end = response.rfind("}") + 1
        return json.loads(response[json_start:json_end])
    except Exception:
        return {"raw": response, "hit_concepts": [], "avoid_concepts": [], "insights": ""}


def generate_script(
    concept: str,
    titles: list[str],
    research_summary: str,
    target_minutes: int = 15,
) -> str:
    if _MOCK:
        return mock_data.mock_script(concept, target_minutes)
    title_str = "\n".join([f"・{t}" for t in titles])
    return _call(
        system="""あなたはYouTubeチャンネルのトップ台本ライターです。
視聴維持率が高く、視聴者が最後まで見たくなる台本を作成してください。
台本は自然な話し言葉で書き、演者が読むだけで収録できる形式にしてください。""",
        user=f"""以下の企画で台本を制作してください。

## 企画概要
{concept}

## タイトル候補
{title_str}

## リサーチで判明した視聴者ニーズ
{research_summary}

## 台本要件
- 目標尺: {target_minutes}分（文字数目安: {target_minutes * 350}〜{target_minutes * 400}文字）
- 構成: オープニング（掴み30秒）→ 本編 → CTA・エンディング
- 話し言葉で自然に
- 各セクションに [セクション名] のラベルを付ける
- 演者の感情・ト書きは（括弧）で記載

台本を出力してください：""",
        max_tokens=8000,
    )


def refine_script(script: str, feedback: str) -> str:
    if _MOCK:
        return script + f"\n\n---\n【モックブラッシュアップ】\nフィードバック「{feedback}」を反映して改善しました。\n（実際のAPIキー設定後は本物のClaudeが改善します）"
    return _call(
        system="あなたはYouTube台本の編集専門家です。フィードバックを元に台本を改善してください。",
        user=f"""以下の台本を改善してください。

## 現在の台本
{script}

## フィードバック・改善指示
{feedback}

改善した台本全文を出力してください：""",
        max_tokens=8000,
    )


def generate_thumbnail_strategy(
    concept: str,
    titles: list[str],
    reference_thumbnails: list[str],
) -> dict:
    if _MOCK:
        return mock_data.mock_thumbnail_strategy(concept)
    refs = "\n".join([f"・{t}" for t in reference_thumbnails])
    title_str = "\n".join([f"・{t}" for t in titles])
    response = _call(
        system="""あなたはYouTubeサムネイルの戦略家です。クリック率（CTR）が高いサムネイルの企画を立案してください。
必ずJSON形式で返してください。""",
        user=f"""以下の企画のサムネイル案を考えてください。

## 企画概要
{concept}

## タイトル候補
{title_str}

## バズっているサムネイルの特徴（参考）
{refs or "データなし"}

以下のJSON形式で出力してください：
{{
  "text_copies": [
    {{"main": "メインテキスト", "sub": "サブテキスト（任意）", "reason": "なぜこの文言か"}}
  ],
  "design_concepts": [
    {{
      "layout": "構図の説明",
      "person_pose": "人物の表情・ポーズ",
      "color_scheme": "カラーテーマ",
      "image_generation_prompt": "DALL-E用英語プロンプト"
    }}
  ]
}}

text_copiesは3案、design_conceptsは2案出してください。""",
        max_tokens=1500,
    )

    try:
        json_start = response.find("{")
        json_end = response.rfind("}") + 1
        return json.loads(response[json_start:json_end])
    except Exception:
        return {"raw": response, "text_copies": [], "design_concepts": []}


def analyze_channel_performance(videos_data: list[dict]) -> str:
    if _MOCK:
        return "【モックデータ分析】\n1. 伸びている動画の共通点: 体験談・失敗談・数字を含むタイトルが強い\n2. 伸びていない動画: 汎用的すぎるテーマ、サムネに文字が多すぎる\n3. 改善提案: ①冒頭30秒の掴みを強化 ②サムネの文字を2行以内に絞る ③週1本の投稿頻度を維持\n4. 強み: 視聴維持率が高い / 弱み: チャンネル認知度がまだ低い"
    summary = "\n".join([
        f"- {v['title'][:50]} | 再生:{v['view_count']:,} | 投稿:{v.get('published_at', 'unknown')}"
        for v in videos_data[:15]
    ])
    return _call(
        system="あなたはYouTubeチャンネルの分析専門家です。",
        user=f"""以下のチャンネル動画データを分析してください。

{summary}

以下を分析してください：
1. 伸びている動画の共通点
2. 伸びていない動画の共通点
3. 改善のための具体的な提案（3点）
4. チャンネルの強みと弱み""",
        max_tokens=1000,
    )
