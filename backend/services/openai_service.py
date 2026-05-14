from openai import OpenAI
from config import settings
import httpx
import os
import uuid

_MOCK = not bool(settings.OPENAI_API_KEY)
client = OpenAI(api_key=settings.OPENAI_API_KEY) if not _MOCK else None


async def generate_thumbnail_image(
    prompt: str,
    save_dir: str = "generated_thumbnails",
) -> dict:
    if _MOCK:
        seed = abs(hash(prompt)) % 1000
        return {
            "image_url": f"https://picsum.photos/seed/{seed}/1280/720",
            "local_path": None,
            "revised_prompt": f"[モック] {prompt}",
        }
    os.makedirs(save_dir, exist_ok=True)

    enhanced_prompt = f"""YouTube thumbnail image. {prompt}
Style: High contrast, bold colors, eye-catching, professional quality.
Aspect ratio: 16:9. No text overlays."""

    response = client.images.generate(
        model="dall-e-3",
        prompt=enhanced_prompt,
        size="1792x1024",
        quality="hd",
        n=1,
    )
    image_url = response.data[0].url
    revised_prompt = response.data[0].revised_prompt

    filename = f"{uuid.uuid4().hex}.png"
    local_path = os.path.join(save_dir, filename)

    async with httpx.AsyncClient() as http_client:
        img_resp = await http_client.get(image_url, timeout=30)
        if img_resp.status_code == 200:
            with open(local_path, "wb") as f:
                f.write(img_resp.content)

    return {
        "image_url": image_url,
        "local_path": local_path,
        "revised_prompt": revised_prompt,
    }
