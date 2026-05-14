from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy import func
from database import Base
import enum


class ProjectStatus(str, enum.Enum):
    planning = "planning"
    scripting = "scripting"
    filming = "filming"
    editing = "editing"
    reviewing = "reviewing"
    done = "done"


class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    review = "review"
    done = "done"


class VideoProject(Base):
    __tablename__ = "video_projects"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String(36), nullable=True, index=True)
    title = Column(String(500), nullable=False)
    concept = Column(Text)
    status = Column(String(30), default=ProjectStatus.planning)
    research_session_id = Column(Integer, ForeignKey("research_sessions.id"), nullable=True)
    script_id = Column(Integer, nullable=True)
    notion_page_id = Column(String(100))
    video_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    tasks = relationship("ProjectTask", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("ProjectComment", back_populates="project", cascade="all, delete-orphan")


class ProjectTask(Base):
    __tablename__ = "project_tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("video_projects.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    assignee = Column(String(100))
    status = Column(String(20), default=TaskStatus.todo)
    due_date = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    project = relationship("VideoProject", back_populates="tasks")


class ProjectComment(Base):
    __tablename__ = "project_comments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("video_projects.id"), nullable=False)
    author = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

    project = relationship("VideoProject", back_populates="comments")


class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String(36), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("video_projects.id"), nullable=True)
    concept = Column(Text)
    target_duration_minutes = Column(Integer, default=15)
    content = Column(Text)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Thumbnail(Base):
    __tablename__ = "thumbnails"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String(36), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("video_projects.id"), nullable=True)
    text_copies = Column(JSON)       # list of text options
    design_prompt = Column(Text)
    image_url = Column(String(500))
    image_local_path = Column(String(500))
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())
