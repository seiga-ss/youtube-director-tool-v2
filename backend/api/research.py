from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import ResearchSession, ResearchVideo
from models.user import User
from services import youtube_service, claude_service
from config import settings
from middleware.auth_dep import get_current_user

_MOCK = not bool(settings.YOUTUBE_API_KEY)

router = APIRouter(prefix="/api/research", tags=["research"])


class ResearchRequest(BaseModel):
    keyword: str
    date_range: str = "1y"  # 1m | 3m | 6m | 1y | 2y
    video_type: str = "both"  # long | short | both
    max_results: int = 20


@router.post("")
async def start_research(
    req: ResearchRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = ResearchSession(
        keyword=req.keyword,
        date_range=req.date_range,
        video_type=req.video_type,
        status="running",
        company_id=current_user.company_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    background_tasks.add_task(
        _run_research, session.id, req.keyword, req.date_range, req.video_type, req.max_results
    )
    return {"session_id": session.id, "status": "running", "mock_mode": _MOCK}


async def _run_research(session_id: int, keyword: str, date_range: str, video_type: str, max_results: int):
    from database import SessionLocal
    db = SessionLocal()
    try:
        session = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()

        videos = await youtube_service.search_videos(keyword, date_range, video_type, max_results)

        for v in videos:
            transcript = await youtube_service.get_transcript(v["video_id"])
            comments = await youtube_service.get_top_comments(v["video_id"])
            thumbnail_path = None
            if v["thumbnail_url"]:
                thumbnail_path = await youtube_service.download_thumbnail(
                    v["thumbnail_url"], v["video_id"]
                )
            summary = claude_service.summarize_video(
                v["title"], transcript or "", comments
            ) if transcript or comments else ""

            video = ResearchVideo(
                session_id=session_id,
                video_id=v["video_id"],
                title=v["title"],
                channel_name=v["channel_name"],
                channel_id=v["channel_id"],
                subscriber_count=v["subscriber_count"],
                view_count=v["view_count"],
                like_count=v["like_count"],
                comment_count=v["comment_count"],
                viral_rate=v["viral_rate"],
                duration_seconds=v["duration_seconds"],
                video_type=v["video_type"],
                published_at=v["published_at"],
                thumbnail_url=v["thumbnail_url"],
                thumbnail_local_path=thumbnail_path,
                transcript=transcript,
                top_comments=comments,
                summary=summary,
            )
            db.add(video)

        session.status = "done"
        db.commit()
    except Exception:
        session = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
        if session:
            session.status = "error"
            db.commit()
    finally:
        db.close()


@router.get("")
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(ResearchSession)
    if current_user.role != "super_admin":
        query = query.filter(ResearchSession.company_id == current_user.company_id)
    sessions = query.order_by(ResearchSession.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "keyword": s.keyword,
            "date_range": s.date_range,
            "video_type": s.video_type,
            "status": s.status,
            "video_count": len(s.videos),
            "created_at": s.created_at,
        }
        for s in sessions
    ]


@router.get("/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(ResearchSession).filter(ResearchSession.id == session_id)
    if current_user.role != "super_admin":
        query = query.filter(ResearchSession.company_id == current_user.company_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    long_count = sum(1 for v in session.videos if v.video_type == "long")
    short_count = sum(1 for v in session.videos if v.video_type == "short")
    long_views = sum(v.view_count for v in session.videos if v.video_type == "long")
    short_views = sum(v.view_count for v in session.videos if v.video_type == "short")

    videos = sorted(session.videos, key=lambda v: v.view_count, reverse=True)

    return {
        "id": session.id,
        "keyword": session.keyword,
        "date_range": session.date_range,
        "video_type": session.video_type,
        "status": session.status,
        "created_at": session.created_at,
        "channel_ratio": {
            "long": {"count": long_count, "total_views": long_views},
            "short": {"count": short_count, "total_views": short_views},
        },
        "videos": [
            {
                "id": v.id,
                "video_id": v.video_id,
                "title": v.title,
                "channel_name": v.channel_name,
                "subscriber_count": v.subscriber_count,
                "view_count": v.view_count,
                "like_count": v.like_count,
                "comment_count": v.comment_count,
                "viral_rate": v.viral_rate,
                "duration_seconds": v.duration_seconds,
                "video_type": v.video_type,
                "published_at": v.published_at,
                "thumbnail_url": v.thumbnail_url,
                "top_comments": v.top_comments,
                "transcript": v.transcript,
                "summary": v.summary,
            }
            for v in videos
        ],
    }


@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(ResearchSession).filter(ResearchSession.id == session_id)
    if current_user.role != "super_admin":
        query = query.filter(ResearchSession.company_id == current_user.company_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}
