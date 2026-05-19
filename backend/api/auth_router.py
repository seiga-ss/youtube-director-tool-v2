from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from database import get_db
from models.user import User
from auth import hash_password, verify_password, create_access_token, MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES
from middleware.auth_dep import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


class LoginRequest(BaseModel):
    email: str
    password: str


class SetupRequest(BaseModel):
    email: str
    password: str
    name: str


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="メールアドレスまたはパスワードが正しくありません")

    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="アカウントがロックされています。しばらく後に再試行してください")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="メールアドレスまたはパスワードが正しくありません")

    if not verify_password(req.password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="メールアドレスまたはパスワードが正しくありません")

    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": user.id, "company_id": user.company_id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "company_id": user.company_id,
        },
    }


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "company_id": current_user.company_id,
    }


@router.post("/setup")
@limiter.limit("3/hour")
async def initial_setup(request: Request, req: SetupRequest, db: Session = Depends(get_db)):
    """初回セットアップ専用。ユーザーが0人のときのみ有効。"""
    try:
        count = db.query(User).count()
        if count > 0:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="初期設定は完了しています")

        import uuid
        user = User(
            id=str(uuid.uuid4()),
            email=req.email,
            password_hash=hash_password(req.password),
            name=req.name,
            role="super_admin",
            company_id=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token({"sub": user.id, "company_id": None, "role": "super_admin"})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"セットアップエラー: {type(e).__name__}: {str(e)}")
