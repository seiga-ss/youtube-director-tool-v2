from notion_client import AsyncClient
from config import settings
from typing import Optional

notion = AsyncClient(auth=settings.NOTION_API_KEY)


async def create_project_page(
    title: str,
    concept: str,
    status: str = "planning",
) -> Optional[str]:
    if not settings.NOTION_API_KEY or not settings.NOTION_DATABASE_ID:
        return None
    try:
        response = await notion.pages.create(
            parent={"database_id": settings.NOTION_DATABASE_ID},
            properties={
                "Name": {"title": [{"text": {"content": title}}]},
                "Status": {"select": {"name": status}},
            },
            children=[
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": concept}}]
                    },
                }
            ],
        )
        return response["id"]
    except Exception:
        return None


async def update_project_status(page_id: str, status: str) -> bool:
    if not settings.NOTION_API_KEY or not page_id:
        return False
    try:
        await notion.pages.update(
            page_id=page_id,
            properties={"Status": {"select": {"name": status}}},
        )
        return True
    except Exception:
        return False


async def add_script_to_page(page_id: str, script_content: str) -> bool:
    if not settings.NOTION_API_KEY or not page_id:
        return False
    try:
        chunks = [script_content[i:i+2000] for i in range(0, len(script_content), 2000)]
        children = []
        for chunk in chunks:
            children.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": chunk}}]
                },
            })
        await notion.blocks.children.append(block_id=page_id, children=children)
        return True
    except Exception:
        return False
