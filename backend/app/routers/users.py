from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import LocationUpdate, PublicUserResponse, UserResponse, UserUpdate
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.address is not None:
        current_user.address = user_update.address

    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/location", response_model=UserResponse)
def update_my_location(
    location: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save or remove the current user's opted-in location.

    This endpoint never makes a purchaser's live location public. It exists so
    authenticated users can keep their own nearby-search location in the cloud.
    """
    if location.location_sharing_enabled:
        current_user.latitude = location.latitude
        current_user.longitude = location.longitude
        current_user.location_sharing_enabled = True
        current_user.location_updated_at = datetime.now(timezone.utc)
    else:
        # Opting out removes the private saved location rather than retaining it.
        current_user.latitude = None
        current_user.longitude = None
        current_user.location_sharing_enabled = False
        current_user.location_updated_at = None
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=PublicUserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
