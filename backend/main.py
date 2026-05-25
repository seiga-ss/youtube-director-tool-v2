from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import os
import traceback
from config import settings
from database import engine, Base
import models  # ensure models are registered

Base.metadata.create_all(bind=engine)


from api import research, planning, script, thumbnail, direction
from api.auth_router import router as auth_router
from api.admin_router import router as admin_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="YouTube Director Tool API",
    description="YouTubeディレクター業務90%削減ツール",
    version="2.0.1",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {str(exc)}", "traceback": traceback.format_exc()[-2000:]},
    )

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
        "version": "2.0.1-debug",
        "mock_mode": {
            "youtube": not bool(settings.YOUTUBE_API_KEY),
            "anthropic": not bool(settings.ANTHROPIC_API_KEY),
            "openai": not bool(settings.OPENAI_API_KEY),
            "discord": not bool(settings.DISCORD_BOT_TOKEN),
            "notion": not bool(settings.NOTION_API_KEY),
        },
    }
