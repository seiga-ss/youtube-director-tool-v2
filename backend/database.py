from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

_db_url = settings.DATABASE_URL or "sqlite:///./youtube_director.db"
_is_sqlite = "sqlite" in _db_url

try:
    engine = create_engine(
        _db_url,
        connect_args={"check_same_thread": False} if _is_sqlite else {},
        pool_pre_ping=not _is_sqlite,
        pool_recycle=300 if not _is_sqlite else -1,
    )
except Exception as e:
    print(f"[WARNING] Failed to create engine for {_db_url!r}: {e} — using SQLite")
    engine = create_engine(
        "sqlite:///./youtube_director.db",
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
