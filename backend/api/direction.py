from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
from models import VideoProject, ProjectTask, ProjectComment, TaskStatus, ProjectStatus
from models.user import User
from services import discord_service, notion_service
from middleware.auth_dep import get_current_user

router = APIRouter(prefix="/api/projects", tags=["direction"])


class ProjectCreate(BaseModel):
    title: str
    concept: str = ""
    research_session_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    concept: Optional[str] = None
    status: Optional[str] = None
    video_url: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    assignee: str = ""
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None


class CommentCreate(BaseModel):
    content: str


@router.post("")
async def create_project(req: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = VideoProject(
        title=req.title,
        concept=req.concept,
        research_session_id=req.research_session_id,
        status=ProjectStatus.planning,
        company_id=current_user.company_id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    notion_id = await notion_service.create_project_page(req.title, req.concept)
    if notion_id:
        project.notion_page_id = notion_id
        db.commit()

    await discord_service.notify_project_created(req.title, req.concept)

    return _project_to_dict(project)


@router.get("")
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(VideoProject)
    if current_user.role != "super_admin":
        query = query.filter(VideoProject.company_id == current_user.company_id)
    projects = query.order_by(VideoProject.updated_at.desc()).all()
    return [_project_to_dict(p) for p in projects]


@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(VideoProject).filter(VideoProject.id == project_id)
    if current_user.role != "super_admin":
        query = query.filter(VideoProject.company_id == current_user.company_id)
    project = query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_to_dict(project, include_details=True)


@router.put("/{project_id}")
async def update_project(project_id: int, req: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(VideoProject).filter(VideoProject.id == project_id)
    if current_user.role != "super_admin":
        query = query.filter(VideoProject.company_id == current_user.company_id)
    project = query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if req.title is not None:
        project.title = req.title
    if req.concept is not None:
        project.concept = req.concept
    if req.status is not None:
        project.status = req.status
        if project.notion_page_id:
            await notion_service.update_project_status(project.notion_page_id, req.status)
    if req.video_url is not None:
        project.video_url = req.video_url

    db.commit()
    db.refresh(project)
    return _project_to_dict(project)


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(VideoProject).filter(VideoProject.id == project_id)
    if current_user.role != "super_admin":
        query = query.filter(VideoProject.company_id == current_user.company_id)
    project = query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True}


@router.post("/{project_id}/tasks")
def create_task(project_id: int, req: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(VideoProject).filter(VideoProject.id == project_id)
    if current_user.role != "super_admin":
        query = query.filter(VideoProject.company_id == current_user.company_id)
    project = query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task = ProjectTask(
        project_id=project_id,
        title=req.title,
        description=req.description,
        assignee=req.assignee or current_user.name,
        status=TaskStatus.todo,
        due_date=req.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_to_dict(task)


@router.put("/{project_id}/tasks/{task_id}")
async def update_task(project_id: int, task_id: int, req: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(ProjectTask).filter(
        ProjectTask.id == task_id,
        ProjectTask.project_id == project_id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    query = db.query(VideoProject).filter(VideoProject.id == project_id)
    if current_user.role != "super_admin":
        query = query.filter(VideoProject.company_id == current_user.company_id)
    project = query.first()
    if not project:
        raise HTTPException(status_code=403, detail="権限がありません")

    if req.title is not None:
        task.title = req.title
    if req.description is not None:
        task.description = req.description
    if req.assignee is not None:
        task.assignee = req.assignee
    if req.due_date is not None:
        task.due_date = req.due_date
    if req.status is not None:
        task.status = req.status
        await discord_service.notify_task_update(
            project.title,
            task.title,
            req.status,
            task.assignee or "",
        )

    db.commit()
    db.refresh(task)
    return _task_to_dict(task)


@router.delete("/{project_id}/tasks/{task_id}")
def delete_task(project_id: int, task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(ProjectTask).filter(
        ProjectTask.id == task_id,
        ProjectTask.project_id == project_id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    query = db.query(VideoProject).filter(VideoProject.id == project_id)
    if current_user.role != "super_admin":
        query = query.filter(VideoProject.company_id == current_user.company_id)
    if not query.first():
        raise HTTPException(status_code=403, detail="権限がありません")

    db.delete(task)
    db.commit()
    return {"ok": True}


@router.post("/{project_id}/comments")
def add_comment(project_id: int, req: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(VideoProject).filter(VideoProject.id == project_id)
    if current_user.role != "super_admin":
        query = query.filter(VideoProject.company_id == current_user.company_id)
    project = query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    comment = ProjectComment(
        project_id=project_id,
        author=current_user.name,
        content=req.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {"id": comment.id, "author": comment.author, "content": comment.content, "created_at": comment.created_at}


def _project_to_dict(project: VideoProject, include_details: bool = False) -> dict:
    data = {
        "id": project.id,
        "title": project.title,
        "concept": project.concept,
        "status": project.status,
        "research_session_id": project.research_session_id,
        "notion_page_id": project.notion_page_id,
        "video_url": project.video_url,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "task_count": len(project.tasks),
        "done_task_count": sum(1 for t in project.tasks if t.status == TaskStatus.done),
    }
    if include_details:
        data["tasks"] = [_task_to_dict(t) for t in project.tasks]
        data["comments"] = [
            {"id": c.id, "author": c.author, "content": c.content, "created_at": c.created_at}
            for c in sorted(project.comments, key=lambda c: c.created_at)
        ]
    return data


def _task_to_dict(task: ProjectTask) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "assignee": task.assignee,
        "status": task.status,
        "due_date": task.due_date,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }
