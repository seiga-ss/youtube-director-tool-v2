import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.user import User, Company
from auth import hash_password
from middleware.auth_dep import require_admin, require_super_admin, get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


class CompanyCreate(BaseModel):
    name: str


class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "employee"
    company_id: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    company_id: Optional[str] = None


# ─── Companies (super_admin only) ─────────────────────────────

@router.get("/companies")
def list_companies(db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    companies = db.query(Company).all()
    return [{"id": c.id, "name": c.name, "created_at": c.created_at} for c in companies]


@router.post("/companies")
def create_company(req: CompanyCreate, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    company = Company(id=str(uuid.uuid4()), name=req.name)
    db.add(company)
    db.commit()
    db.refresh(company)
    return {"id": company.id, "name": company.name, "created_at": company.created_at}


@router.delete("/companies/{company_id}")
def delete_company(company_id: str, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(company)
    db.commit()
    return {"ok": True}


# ─── Users ────────────────────────────────────────────────────

@router.get("/users")
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(User)
    if current_user.role == "admin":
        query = query.filter(User.company_id == current_user.company_id)
    users = query.all()
    return [_user_dict(u) for u in users]


@router.post("/users")
def create_user(req: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if current_user.role == "admin":
        req.company_id = current_user.company_id
        if req.role not in ("employee", "admin"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="権限がありません")

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="このメールアドレスは既に使用されています")

    user = User(
        id=str(uuid.uuid4()),
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        role=req.role,
        company_id=req.company_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_dict(user)


@router.put("/users/{user_id}")
def update_user(user_id: str, req: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == "admin" and user.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="権限がありません")

    if req.name is not None:
        user.name = req.name
    if req.role is not None:
        if current_user.role == "admin" and req.role == "super_admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="権限がありません")
        user.role = req.role
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.company_id is not None and current_user.role == "super_admin":
        user.company_id = req.company_id

    db.commit()
    db.refresh(user)
    return _user_dict(user)


@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == "admin" and user.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="権限がありません")

    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="自分自身は削除できません")

    db.delete(user)
    db.commit()
    return {"ok": True}


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "company_id": user.company_id,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }
