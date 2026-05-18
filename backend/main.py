from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import os
from config import settings
from database import engine, Base
import models  # ensure models are registered

Base.metadata.create_all(bind=engine)

# PostgreSQL (Supabase) のみマイグレーション実行
if "postgresql" in settings.DATABASE_URL:
    _migration_sql = """
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
    CREATE INDEX IF NOT EXISTS idx_research_sessions_company ON research_sessions(company_id);
    CREATE INDEX IF NOT EXISTS idx_video_projects_company ON video_projects(company_id);
    CREATE INDEX IF NOT EXISTS idx_scripts_company ON scripts(company_id);
    CREATE INDEX IF NOT EXISTS idx_thumbnails_company ON thumbnails(company_id);
    CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    """
    with engine.connect() as _conn:
        for _stmt in [s.strip() for s in _migration_sql.split(";") if s.strip()]:
            try:
                _conn.execute(__import__("sqlalchemy").text(_stmt))
            except Exception as _e:
                print(f"[migration] skip: {_e}")
        _conn.commit()

from api import research, planning, script, thumbnail, direction
from api.auth_router import router as auth_router
from api.admin_router import router as admin_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="YouTube Director Tool API",
    description="YouTubeディレクター業務90%削減ツール",
    version="2.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(research.router)
app.include_router(planning.router)
app.include_router(script.router)
app.include_router(thumbnail.router)
app.include_router(direction.router)

for dir_name in ["thumbnails", "generated_thumbnails"]:
    os.makedirs(dir_name, exist_ok=True)

if os.path.exists("thumbnails"):
    app.mount("/thumbnails", StaticFiles(directory="thumbnails"), name="thumbnails")
if os.path.exists("generated_thumbnails"):
    app.mount("/generated_thumbnails", StaticFiles(directory="generated_thumbnails"), name="generated_thumbnails")


@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "mock_mode": {
            "youtube": not bool(settings.YOUTUBE_API_KEY),
            "anthropic": not bool(settings.ANTHROPIC_API_KEY),
            "openai": not bool(settings.OPENAI_API_KEY),
            "discord": not bool(settings.DISCORD_BOT_TOKEN),
            "notion": not bool(settings.NOTION_API_KEY),
        },
    }
