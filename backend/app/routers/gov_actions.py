from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.requests import GovAction
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/gov-actions", tags=["Acciones de Gobierno"])

class GovActionCreate(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime
    dependency_id: str
    related_topic: str = None

@router.post("", status_code=201)
def create_gov_action(
    action_in: GovActionCreate,
    db: Session = Depends(get_db)
) -> Any:
    db_action = GovAction(
        name=action_in.name,
        start_date=action_in.start_date,
        end_date=action_in.end_date,
        dependency_id=action_in.dependency_id
    )
    db.add(db_action)
    db.commit()
    db.refresh(db_action)
    return {"id": str(db_action.id), "name": db_action.name}