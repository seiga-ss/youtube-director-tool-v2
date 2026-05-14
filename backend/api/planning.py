from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import ResearchSession
from models.user import User
from services import claude_service
from middleware.auth_dep import get_current_user

router = APIRouter(prefix="/api/planning", tags=["planning"])


class PlanningRequest(BaseModel):
    session_id: int
    past_analysis: Optional[str] = ""


@router.post("")
def generate_planning(req: PlanningRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(ResearchSession).filter(ResearchSession.id == req.session_id)
    if current_user.role != "super_admin":
        query = query.filter(ResearchSession.company_id == current_user.company_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")
    if session.status != "done":
        raise HTTPException(status_code=400, detail="Research not completed yet")

    videos_data = [
        {
            "title": v.title,
            "channel_name": v.channel_name,
            "view_count": v.view_count,
            "subscriber_count": v.subscriber_count,
            "viral_rate": v.viral_rate,
            "summary": v.summary or "",
            "top_comments": v.top_comments or [],
        }
        for v in sorted(session.videos, key=lambda x: x.view_count, reverse=True)
    ]

    result = claude_service.generate_planning(
        keyword=session.keyword,
        videos=videos_data,
        past_analysis=req.past_analysis or "",
    )
    return result


class ChannelAnalysisRequest(BaseModel):
    session_id: int


@router.post("/channel-analysis")
def analyze_channel(req: ChannelAnalysisRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(ResearchSession).filter(ResearchSession.id == req.session_id)
    if current_user.role != "super_admin":
        query = query.filter(ResearchSession.company_id == current_user.company_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")

    videos_data = [
        {
            "title": v.title,
            "view_count": v.view_count,
            "published_at": str(v.published_at) if v.published_at else "",
        }
        for v in session.videos
    ]
    analysis = claude_service.analyze_channel_performance(videos_data)
    return {"analysis": analysis}
