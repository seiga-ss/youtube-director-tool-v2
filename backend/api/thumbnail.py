from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Thumbnail
from models.user import User
from services import claude_service, openai_service
from middleware.auth_dep import get_current_user

router = APIRouter(prefix="/api/thumbnail", tags=["thumbnail"])


class ThumbnailRequest(BaseModel):
    concept: str
    titles: list[str]
    reference_thumbnails: list[str] = []
    project_id: Optional[int] = None
    generate_images: bool = True


@router.post("")
async def generate_thumbnail(req: ThumbnailRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    strategy = claude_service.generate_thumbnail_strategy(
        concept=req.concept,
        titles=req.titles,
        reference_thumbnails=req.reference_thumbnails,
    )

    thumbnails = []
    design_concepts = strategy.get("design_concepts", [])

    if req.generate_images and design_concepts:
        for i, design in enumerate(design_concepts[:2]):
            prompt = design.get("image_generation_prompt", "")
            if not prompt:
                continue
            try:
                img_result = await openai_service.generate_thumbnail_image(prompt)
                thumbnail = Thumbnail(
                    project_id=req.project_id,
                    text_copies=strategy.get("text_copies", []),
                    design_prompt=prompt,
                    image_url=img_result["image_url"],
                    image_local_path=img_result["local_path"],
                    version=i + 1,
                    company_id=current_user.company_id,
                )
                db.add(thumbnail)
                db.commit()
                db.refresh(thumbnail)
                thumbnails.append({
                    "id": thumbnail.id,
                    "image_url": thumbnail.image_url,
                    "design": design,
                    "version": i + 1,
                })
            except Exception as e:
                thumbnails.append({"error": str(e), "design": design, "version": i + 1})
    else:
        thumbnail = Thumbnail(
            project_id=req.project_id,
            text_copies=strategy.get("text_copies", []),
            design_prompt=str(design_concepts),
            version=1,
            company_id=current_user.company_id,
        )
        db.add(thumbnail)
        db.commit()

    return {
        "strategy": strategy,
        "generated_thumbnails": thumbnails,
    }


@router.get("")
def list_thumbnails(project_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Thumbnail)
    if current_user.role != "super_admin":
        query = query.filter(Thumbnail.company_id == current_user.company_id)
    if project_id:
        query = query.filter(Thumbnail.project_id == project_id)
    thumbnails = query.order_by(Thumbnail.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "text_copies": t.text_copies,
            "image_url": t.image_url,
            "version": t.version,
            "created_at": t.created_at,
        }
        for t in thumbnails
    ]
