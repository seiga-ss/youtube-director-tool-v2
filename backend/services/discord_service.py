import httpx
from config import settings


DISCORD_WEBHOOK_URL = f"https://discord.com/api/v10/channels/{settings.DISCORD_CHANNEL_ID}/messages"

HEADERS = {
    "Authorization": f"Bot {settings.DISCORD_BOT_TOKEN}",
    "Content-Type": "application/json",
}


async def send_notification(message: str, embed: dict | None = None) -> bool:
    if not settings.DISCORD_BOT_TOKEN or not settings.DISCORD_CHANNEL_ID:
        return False

    payload: dict = {"content": message}
    if embed:
        payload["embeds"] = [embed]

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(DISCORD_WEBHOOK_URL, json=payload, headers=HEADERS, timeout=10)
            return resp.status_code in (200, 201)
    except Exception:
        return False


async def notify_task_update(project_title: str, task_title: str, new_status: str, assignee: str = "") -> bool:
    status_emoji = {
        "todo": "📋",
        "in_progress": "🔄",
        "review": "👀",
        "done": "✅",
    }.get(new_status, "📌")

    embed = {
        "title": f"{status_emoji} タスク更新",
        "description": f"**プロジェクト:** {project_title}\n**タスク:** {task_title}\n**ステータス:** {new_status}",
        "color": 0x5865F2,
        "footer": {"text": f"担当: {assignee}" if assignee else "YouTube Director Tool"},
    }
    return await send_notification("", embed=embed)


async def notify_project_created(project_title: str, concept: str) -> bool:
    embed = {
        "title": "🎬 新規プロジェクト作成",
        "description": f"**タイトル:** {project_title}\n**企画:** {concept[:200]}",
        "color": 0x57F287,
    }
    return await send_notification("", embed=embed)
