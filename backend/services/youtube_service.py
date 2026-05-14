from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled, CouldNotRetrieveTranscript
from datetime import datetime, timedelta
from typing import Optional
import httpx
import os
import re
from config import settings
from services import mock_data

_MOCK = not bool(settings.YOUTUBE_API_KEY)


DATE_RANGE_MAP = {
    "1m": 30,
    "3m": 90,
    "6m": 180,
    "1y": 365,
    "2y": 730,
}


def _get_youtube_client():
    return build("youtube", "v3", developerKey=settings.YOUTUBE_API_KEY)


def _published_after(date_range: str) -> str:
    days = DATE_RANGE_MAP.get(date_range, 365)
    dt = datetime.utcnow() - timedelta(days=days)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_duration(iso_duration: str) -> int:
    """ISO 8601 duration to seconds."""
    pattern = r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
    match = re.match(pattern, iso_duration)
    if not match:
        return 0
    h = int(match.group(1) or 0)
    m = int(match.group(2) or 0)
    s = int(match.group(3) or 0)
    return h * 3600 + m * 60 + s


def _is_short(duration_seconds: int, title: str, description: str = "") -> bool:
    return duration_seconds <= 60 or "#shorts" in title.lower() or "#shorts" in description.lower()


async def search_videos(
    keyword: str,
    date_range: str,
    video_type: str,  # long | short | both
    max_results: int = 30,
) -> list[dict]:
    if _MOCK:
        return mock_data.mock_videos(keyword, video_type, max_results)
    youtube = _get_youtube_client()
    published_after = _published_after(date_range)

    search_response = youtube.search().list(
        q=keyword,
        part="id,snippet",
        type="video",
        order="viewCount",
        publishedAfter=published_after,
        maxResults=min(max_results * 2, 50),
    ).execute()

    video_ids = [item["id"]["videoId"] for item in search_response.get("items", [])]
    if not video_ids:
        return []

    videos_response = youtube.videos().list(
        part="snippet,statistics,contentDetails",
        id=",".join(video_ids),
    ).execute()

    results = []
    for item in videos_response.get("items", []):
        snippet = item.get("snippet", {})
        stats = item.get("statistics", {})
        content = item.get("contentDetails", {})
        duration_seconds = _parse_duration(content.get("duration", "PT0S"))
        is_short = _is_short(duration_seconds, snippet.get("title", ""))

        if video_type == "long" and is_short:
            continue
        if video_type == "short" and not is_short:
            continue

        channel_id = snippet.get("channelId", "")
        view_count = int(stats.get("viewCount", 0))
        subscriber_count = _get_subscriber_count(youtube, channel_id)
        viral_rate = round(view_count / subscriber_count, 2) if subscriber_count > 0 else 0.0

        published_at_str = snippet.get("publishedAt", "")
        published_at = None
        if published_at_str:
            try:
                published_at = datetime.strptime(published_at_str, "%Y-%m-%dT%H:%M:%SZ")
            except ValueError:
                pass

        results.append({
            "video_id": item["id"],
            "title": snippet.get("title", ""),
            "channel_name": snippet.get("channelTitle", ""),
            "channel_id": channel_id,
            "subscriber_count": subscriber_count,
            "view_count": view_count,
            "like_count": int(stats.get("likeCount", 0)),
            "comment_count": int(stats.get("commentCount", 0)),
            "viral_rate": viral_rate,
            "duration_seconds": duration_seconds,
            "video_type": "short" if is_short else "long",
            "published_at": published_at,
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
        })

    results.sort(key=lambda x: x["view_count"], reverse=True)
    return results[:max_results]


def _get_subscriber_count(youtube, channel_id: str) -> int:
    if not channel_id:
        return 0
    try:
        resp = youtube.channels().list(part="statistics", id=channel_id).execute()
        items = resp.get("items", [])
        if items:
            return int(items[0].get("statistics", {}).get("subscriberCount", 0))
    except Exception:
        pass
    return 0


async def get_transcript(video_id: str, language: str = "ja") -> Optional[str]:
    if _MOCK:
        return mock_data.mock_transcript(video_id)
    try:
        # youtube_transcript_api >= 1.0 uses instance method fetch()
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id, languages=[language, "en"])
        return " ".join([t.text for t in transcript])
    except (NoTranscriptFound, TranscriptsDisabled, CouldNotRetrieveTranscript):
        return None
    except Exception:
        return None


async def get_top_comments(video_id: str, max_results: int = 20) -> list[dict]:
    if _MOCK:
        return mock_data.mock_comments(video_id)
    youtube = _get_youtube_client()
    try:
        response = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            order="relevance",
            maxResults=max_results,
        ).execute()
        comments = []
        for item in response.get("items", []):
            top = item["snippet"]["topLevelComment"]["snippet"]
            comments.append({
                "text": top.get("textDisplay", ""),
                "likes": top.get("likeCount", 0),
            })
        return comments
    except Exception:
        return []


async def download_thumbnail(url: str, video_id: str, save_dir: str = "thumbnails") -> Optional[str]:
    if _MOCK:
        return None  # フロントエンドはthumbnail_urlを直接参照するため不要
    os.makedirs(save_dir, exist_ok=True)
    path = os.path.join(save_dir, f"{video_id}.jpg")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10)
            if resp.status_code == 200:
                with open(path, "wb") as f:
                    f.write(resp.content)
                return path
    except Exception:
        pass
    return None
