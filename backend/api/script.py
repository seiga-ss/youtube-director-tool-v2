from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Script, VideoProject
from models.user import User
from services import claude_service, notion_service
from middleware.auth_dep import get_current_user

router = APIRouter(prefix="/api/script", tags=["script"])


class ScriptRequest(BaseModel):
    concept: str
    titles: list[str]
    research_summary: str = ""
    target_minutes: int = 15
    project_id: Optional[int] = None


class RefineRequest(BaseModel):
    feedback: str


@router.post("")
def generate_script(req: ScriptRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = claude_service.generate_script(
        concept=req.concept,
        titles=req.titles,
        research_summary=req.research_summary,
        target_minutes=req.target_minutes,
    )

    script = Script(
        project_id=req.project_id,
        concept=req.concept,
        target_duration_minutes=req.target_minutes,
        content=content,
        version=1,
        company_id=current_user.company_id,
    )
    db.add(script)
    db.commit()
    db.refresh(script)
    return {"id": script.id, "content": content, "version": 1}


@router.get("/{script_id}")
def get_script(script_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Script).filter(Script.id == script_id)
    if current_user.role != "super_admin":
        query = query.filter(Script.company_id == current_user.company_id)
    script = query.first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return {
        "id": script.id,
        "concept": script.concept,
        "content": script.content,
        "version": script.version,
        "target_duration_minutes": script.target_duration_minutes,
        "created_at": script.created_at,
        "updated_at": script.updated_at,
    }


@router.put("/{script_id}/refine")
def refine_script(script_id: int, req: RefineRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Script).filter(Script.id == script_id)
    if current_user.role != "super_admin":
        query = query.filter(Script.company_id == current_user.company_id)
    script = query.first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    new_content = claude_service.refine_script(script.content, req.feedback)
    script.content = new_content
    script.version += 1
    db.commit()
    db.refresh(script)
    return {"id": script.id, "content": new_content, "version": script.version}


class NotionSaveRequest(BaseModel):
    notion_page_id: Optional[str] = None


@router.post("/{script_id}/notion")
async def save_to_notion(script_id: int, req: NotionSaveRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Script).filter(Script.id == script_id)
    if current_user.role != "super_admin":
        query = query.filter(Script.company_id == current_user.company_id)
    script = query.first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    page_id = req.notion_page_id
    if not page_id and script.project_id:
        project = db.query(VideoProject).filter(VideoProject.id == script.project_id).first()
        if project:
            page_id = project.notion_page_id

    if not page_id:
        raise HTTPException(status_code=400, detail="Notion page ID が見つかりません")

    success = await notion_service.add_script_to_page(page_id, script.content)
    return {"ok": success}


@router.get("")
def list_scripts(project_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Script)
    if current_user.role != "super_admin":
        query = query.filter(Script.company_id == current_user.company_id)
    if project_id:
        query = query.filter(Script.project_id == project_id)
    scripts = query.order_by(Script.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "concept": s.concept[:100] if s.concept else "",
            "version": s.version,
            "target_duration_minutes": s.target_duration_minutes,
            "created_at": s.created_at,
        }
        for s in scripts
    ]
