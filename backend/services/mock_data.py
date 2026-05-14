from datetime import datetime, timedelta
import random

_BASE_DATE = datetime(2025, 3, 1)


def mock_videos(keyword: str, video_type: str = "both", count: int = 10) -> list[dict]:
    templates = [
        {"title": f"【{keyword}】完全攻略！初心者でも月30万稼げる方法", "channel": "稼ぐ研究所", "subs": 180000, "views": 2400000, "type": "long"},
        {"title": f"{keyword}を3ヶ月やってみた結果→衝撃の事実が判明", "channel": "検証チャンネル", "subs": 95000, "views": 1800000, "type": "long"},
        {"title": f"【保存版】{keyword}で失敗しないための10のコツ", "channel": "プロ解説", "subs": 230000, "views": 3100000, "type": "long"},
        {"title": f"{keyword}始めて1年で変わったこと全部話す", "channel": "体験談ch", "subs": 42000, "views": 890000, "type": "long"},
        {"title": f"プロが教える{keyword}の極意【永久保存版】", "channel": "マスター講座", "subs": 310000, "views": 4200000, "type": "long"},
        {"title": f"{keyword}やってみた #shorts", "channel": "ショートまとめ", "subs": 560000, "views": 8900000, "type": "short"},
        {"title": f"1分で分かる{keyword} #shorts", "channel": "クイック解説", "subs": 220000, "views": 5600000, "type": "short"},
        {"title": f"{keyword}の衝撃事実 #shorts", "channel": "バズ動画", "subs": 780000, "views": 12000000, "type": "short"},
        {"title": f"【{keyword}】月収100万達成者が語る真実", "channel": "成功者インタビュー", "subs": 68000, "views": 1200000, "type": "long"},
        {"title": f"なぜ{keyword}で9割が失敗するのか？原因と対策", "channel": "失敗学研究", "subs": 115000, "views": 1950000, "type": "long"},
        {"title": f"【比較検証】{keyword}おすすめランキングTOP5", "channel": "比較王", "subs": 145000, "views": 2200000, "type": "long"},
        {"title": f"{keyword}を試してみたら人生変わった件 #shorts", "channel": "ライフハックch", "subs": 340000, "views": 7800000, "type": "short"},
    ]

    filtered = [t for t in templates if video_type == "both" or t["type"] == video_type]
    random.shuffle(filtered)
    results = []
    for i, t in enumerate(filtered[:count]):
        noise = random.uniform(0.8, 1.2)
        views = int(t["views"] * noise)
        subs = int(t["subs"] * noise)
        results.append({
            "video_id": f"mock_{keyword[:4]}_{i:03d}",
            "title": t["title"],
            "channel_name": t["channel"],
            "channel_id": f"UC_mock_{i:04d}",
            "subscriber_count": subs,
            "view_count": views,
            "like_count": int(views * 0.04),
            "comment_count": int(views * 0.005),
            "viral_rate": round(views / subs, 1),
            "duration_seconds": 45 if t["type"] == "short" else random.randint(600, 1500),
            "video_type": t["type"],
            "published_at": _BASE_DATE - timedelta(days=random.randint(10, 300)),
            "thumbnail_url": f"https://picsum.photos/seed/{keyword[:4]}{i}/480/270",
        })
    results.sort(key=lambda x: x["view_count"], reverse=True)
    return results


def mock_transcript(video_id: str) -> str:
    return (
        "えー、今日はですね、本当に皆さんに知ってほしい情報をお届けしたいと思います。"
        "実は私、この方法を試してみたら、本当に人生が変わったんですよね。"
        "まず最初に大事なポイントをお伝えすると、継続することが一番重要です。"
        "多くの人が3日で諦めてしまいますが、それが一番もったいない。"
        "今日お伝えする3つのステップを守れば、確実に結果が出ます。"
        "ステップ1は基礎を固めること。ステップ2は実践を繰り返すこと。"
        "そしてステップ3が、PDCAを回して改善し続けることです。"
        "この動画を最後まで見てくれた方には、特別な情報もお伝えしますね。"
    )


def mock_comments(video_id: str) -> list[dict]:
    return [
        {"text": "この動画で人生変わりました！本当にありがとうございます", "likes": 2341},
        {"text": "もっと早く知りたかった…半年前に見てたら今頃違う人生だったかも", "likes": 1876},
        {"text": "3ヶ月実践して月15万になりました！報告です！", "likes": 1543},
        {"text": "わかりやすすぎる解説。他のチャンネルと全然レベルが違う", "likes": 987},
        {"text": "最初は半信半疑でしたが、やってみたら本当に効果ありました", "likes": 756},
        {"text": "字幕もあって助かります。何度も見返しています", "likes": 432},
        {"text": "具体的な数字があってとても参考になりました", "likes": 321},
    ]


def mock_summary(title: str) -> str:
    return (
        f"【{title[:30]}...】"
        "実体験に基づいた具体的な手順を丁寧に解説している動画。"
        "視聴者が「すぐ試せる」内容にまとめられており、"
        "コメント欄では実際に成果を出した報告が多数。"
        "構成はステップ形式で分かりやすく、冒頭30秒の掴みが強い。"
    )


def mock_planning(keyword: str) -> dict:
    return {
        "hit_concepts": [
            {
                "concept": f"「{keyword}」で失敗した実体験を包み隠さず公開し、同じ過ちを繰り返さないための完全攻略ロードマップを提供",
                "titles": [
                    f"【実録】{keyword}で300万溶かした私が教える「絶対やってはいけない」5つのこと",
                    f"{keyword}初心者が知らないと損する落とし穴【経験者が全部話す】",
                    f"なぜ{keyword}で9割が失敗するのか？成功者だけが知っている真実",
                ],
                "reason": "失敗談は共感性が高く、視聴者が「自分ごと」として捉えやすい。コメント欄でも体験談が集まりやすくエンゲージメントが上がる。",
                "hook": "「実は私、この方法で300万円を失ったことがあります。今日はその話をしようと思います。」",
            },
            {
                "concept": f"「{keyword}」を完全初心者がゼロから始めて3ヶ月で成果を出すまでのリアルな記録",
                "titles": [
                    f"【0→1達成】{keyword}をゼロから始めて3ヶ月で月10万になるまでの全記録",
                    f"初心者が{keyword}を3ヶ月やってみた→まさかの結果に…",
                    f"{keyword}完全ロードマップ【3ヶ月で成果を出す全手順】",
                ],
                "reason": "ビフォーアフターの構造はYouTubeで最も再生数が伸びるフォーマットの一つ。進捗報告という継続企画にも発展できる。",
                "hook": "「3ヶ月前の私は{keyword}のことを何も知りませんでした。でも今日は…」",
            },
            {
                "concept": f"プロが実際に使っている「{keyword}」の裏技・最短ルートを、初心者向けに分かりやすく公開",
                "titles": [
                    f"プロだけが知っている{keyword}の裏技7選【これを知らずに始めると損】",
                    f"【保存版】{keyword}最速攻略マニュアル2025年版",
                    f"専門家に直接聞いた「{keyword}で一番大事なこと」",
                ],
                "reason": "「プロ・専門家・裏技」というキーワードは権威性とCTRを同時に高める。サムネに顔写真と数字を組み合わせると効果的。",
                "hook": "「今日は業界のプロだけが知っている、絶対に表に出ない情報をお話しします。」",
            },
            {
                "concept": f"「{keyword}」をやってみて分かった意外なデメリットと、それでも続ける理由を正直に語る",
                "titles": [
                    f"【正直レビュー】{keyword}を1年続けて分かったリアルなデメリット",
                    f"みんなが言わない{keyword}の闇の部分、全部話します",
                    f"{keyword}をやめた理由→やっぱり続けることにした話",
                ],
                "reason": "ネガティブな視点からの企画は差別化効果が高い。過度なポジティブ情報に疲れた視聴者に刺さりやすく、高い視聴維持率が期待できる。",
                "hook": "「この動画を見たら、{keyword}を始めたくなくなるかもしれません。それでも見ますか？」",
            },
            {
                "concept": f"「{keyword}」関連の都市伝説・よくある誤解をプロが1つずつ徹底検証",
                "titles": [
                    f"【全部嘘だった】{keyword}の「常識」を徹底検証したら衝撃の結果に",
                    f"{keyword}でよく聞く「あの噂」、本当か嘘か全部調べてみた",
                    f"信じてた人ごめんなさい…{keyword}の大きな誤解5選",
                ],
                "reason": "「検証・実験・暴露」フォーマットはサムネのインパクトを作りやすく、タイトルのクリック率も高い。コメントでの議論も生まれやすい。",
                "hook": "「{keyword}について、実は多くの人が信じている大きな嘘があります。今日はそれを全部暴きます。」",
            },
        ],
        "avoid_concepts": [
            {
                "concept": f"「{keyword}とは何か」を解説する入門動画",
                "reason": "競合が多く差別化が困難。視聴者は既にある程度の知識を持っており、基礎説明だけでは視聴維持率が低い傾向がある。",
            },
            {
                "concept": f"「{keyword}のメリット・デメリット」という定番構成",
                "reason": "検索ボリュームはあるが競合が飽和状態。よほど新しい切り口がないと埋没する。コメント欄でのエンゲージメントも低め。",
            },
            {
                "concept": f"「{keyword}おすすめツール・サービス紹介」の単純まとめ",
                "reason": "広告感が強くなりやすく離脱率が高い。実体験ベースでないと信頼性も低い。レビュー系専門チャンネルに勝ちにくい。",
            },
        ],
        "insights": (
            f"「{keyword}」カテゴリでは失敗談・実体験・ビフォーアフターの3フォーマットが圧倒的に強い。"
            "視聴者は「成功者の話」より「自分と同じ失敗をした人の話」に共感する傾向がある。"
            "タイトルには必ず具体的な数字（期間・金額・件数）を入れることでCTRが平均1.8倍向上する。"
            "サムネは顔写真＋テキスト2行以内のシンプルな構成が最も高いCTRを記録している。"
            "ショート動画は認知獲得に有効だが、チャンネル登録につながるのはロング動画。両方バランスよく出すことを推奨する。"
        ),
    }


def mock_script(concept: str, target_minutes: int = 15) -> str:
    return f"""[オープニング]
（明るく、カメラ目線で）
「皆さん、こんにちは！{concept[:20]}について、今日は全部話していきます！」

（少し間を置いて、真剣な表情で）
「実はこれ、私自身が3ヶ月かけて検証した結果なんですよね。最初は本当に何も知らなくて…でも今日お話しする方法を実践したら、想像以上の結果が出たので、全部包み隠さずシェアします。」

「最後まで見てくれた方には、今すぐ使える特別な情報もお伝えしますので、ぜひ最後まで見ていってください！」

[本編 - ステップ1]
（落ち着いたトーンで）
「まず最初に、絶対に知っておいてほしい前提をお話しします。」

「多くの人が間違えているのが、最初から完璧を目指してしまうこと。」
「これ、本当にもったいないんですよ。」

「大事なのは、まず小さく始めて、少しずつ改善していくこと。」
「ここを間違えると、どんなにやる気があっても挫折します。」

（グラフ・図示しながら）
「実際にデータを見てみると…こんな感じで、継続した人とそうでない人では、3ヶ月後に歴然とした差が出ています。」

[本編 - ステップ2]
「次に、具体的な方法についてお話しします。」

「ポイントは大きく3つあります。」
「1つ目が、毎日15分の集中した練習。」
「2つ目が、成果を数値で記録すること。」
「3つ目が、週に1回振り返りをすること。」

（強調して）
「この3つを守るだけで、ほとんどの人は1ヶ月以内に変化を実感できます。」
「逆に言えば、この3つをやらないと、どんな方法を試してもうまくいかない。」

[本編 - ステップ3]
「そして最後に、上級者がやっている秘密の習慣をお教えします。」

「これを知っているかどうかで、同じ時間投資でも成果が3倍変わります。」

（少し声のトーンを下げて、秘密めかして）
「実はこれ、プロの世界では当たり前のことなんですが、一般的にはあまり知られていない。」

「それは…記録を人に見せること、なんですよ。」

「人間って、誰かに見られていると思うと、サボれなくなるんですよね。SNSで発信するでも、友人に話すでも何でもいい。」
「アウトプットすることで学習効率も上がる。一石二鳥なんです。」

[まとめ・CTA]
（明るいトーンに戻して）
「今日お伝えしたことをまとめると——」

「ポイント1：小さく始めて継続することが最重要」
「ポイント2：毎日15分・数値記録・週次振り返りの3セット」
「ポイント3：人に見せることで成果が3倍速く出る」

（カメラに近づいて）
「この動画が参考になったと思ったら、ぜひチャンネル登録と高評価をお願いします！」
「あなたの登録が、私が動画を作り続けるモチベーションになります。」

「次回は、さらに踏み込んだ内容をお届けする予定なので、お楽しみに！」
「それでは、また次の動画でお会いしましょう！ありがとうございました！」
（手を振ってエンド）
"""


def mock_thumbnail_strategy(concept: str) -> dict:
    return {
        "text_copies": [
            {
                "main": "やってみたら人生変わった",
                "sub": "3ヶ月で月収10万達成の全記録",
                "reason": "数字×体験談の組み合わせは最もCTRが高い。「人生変わった」は感情に訴える強い言葉。",
            },
            {
                "main": "なぜ9割が失敗するのか",
                "sub": "成功者だけが知っている真実",
                "reason": "「なぜ〇割が失敗」フォーマットは視聴者の不安を刺激し、自分が失敗側にいないか確認したくなる心理を利用。",
            },
            {
                "main": "300万損した私が教える",
                "sub": "絶対やってはいけないこと5選",
                "reason": "失敗談×具体的な金額は信頼性と共感性を同時に高める。「5選」という数字で内容が明確になりクリックしやすい。",
            },
        ],
        "design_concepts": [
            {
                "layout": "右側に驚き顔の人物、左側に大きなテキスト。背景は濃い赤〜オレンジのグラデーション。",
                "person_pose": "口を大きく開けて驚いている表情。目を見開いて、若干斜め上を向く。",
                "color_scheme": "背景: #C0392B→#E74C3C グラデーション。テキスト: 白・黄色。アクセント: 黄色い矢印。",
                "image_generation_prompt": "YouTube thumbnail style, shocked young Japanese person on right side, mouth open wide in surprise, looking up-left, on vivid red-orange gradient background, professional quality, 16:9 ratio, no text",
            },
            {
                "layout": "中央に大きな数字「300万」を配置し、人物が頭を抱えているシルエット。背景はダーク系。",
                "person_pose": "両手で頭を抱えて後悔している姿勢。落ち込んでいる表情。",
                "color_scheme": "背景: #1A1A2E ダーク。数字: 赤い太字。テキスト: 白。下部にオレンジのアクセント。",
                "image_generation_prompt": "YouTube thumbnail style, person holding head in hands with regret expression, dark dramatic background with deep blue, professional photography quality, 16:9 ratio, no text overlays",
            },
        ],
    }
