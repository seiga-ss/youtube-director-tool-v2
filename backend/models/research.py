from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy import func
from database import Base


class ResearchSession(Base):
    __tablename__ = "research_sessions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String(36), nullable=True, index=True)
    keyword = Column(String(255), nullable=False)
    date_range = Column(String(20), nullable=False)  # 1m, 3m, 6m, 1y, 2y
    video_type = Column(String(20), nullable=False)   # long, short, both
    status = Column(String(20), default="pending")    # pending, running, done, error
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    videos = relationship("ResearchVideo", back_populates="session", cascade="all, delete-orphan")


class ResearchVideo(Base):
    __tablename__ = "research_videos"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("research_sessions.id"), nullable=False)
    video_id = Column(String(50), nullable=False)
    title = Column(String(500), nullable=False)
    channel_name = Column(String(255))
    channel_id = Column(String(100))
    subscriber_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    viral_rate = Column(Float, default=0.0)  # view_count / subscriber_count
    duration_seconds = Column(Integer, default=0)
    video_type = Column(String(10))  # long / short
    published_at = Column(DateTime)
    thumbnail_url = Column(String(500))
    thumbnail_local_path = Column(String(500))
    transcript = Column(Text)
    top_comments = Column(JSON)   # list of {text, likes}
    summary = Column(Text)
    created_at = Column(DateTime, default=func.now())

    session = relationship("ResearchSession", back_populates="videos")
