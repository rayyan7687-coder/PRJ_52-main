from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Listing, ListingStatus, MaterialType, ListingCondition, Notification, User
from app.schemas.listing import ListingResponse
from app.utils.distance import calculate_haversine_distance
from app.core.dependencies import get_current_user

router = APIRouter(tags=["Search & Location & Notifications"])

@router.get("/search", response_model=List[ListingResponse])
def search_listings(
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    material_type: Optional[MaterialType] = None,
    condition: Optional[ListingCondition] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Listing).filter(Listing.is_visible == True, Listing.status == ListingStatus.ACTIVE)
    if q:
        search_filter = f"%{q}%"
        query = query.filter(
            (Listing.title.ilike(search_filter)) |
            (Listing.description.ilike(search_filter)) |
            (Listing.location_text.ilike(search_filter))
        )
    if category_id:
        query = query.filter(Listing.category_id == category_id)
    if material_type:
        query = query.filter(Listing.material_type == material_type)
    if condition:
        query = query.filter(Listing.condition == condition)
    if min_price is not None:
        query = query.filter(Listing.price >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)

    return query.order_by(Listing.created_at.desc()).all()

@router.get("/search/nearby", response_model=List[ListingResponse])
def search_nearby(
    latitude: float,
    longitude: float,
    radius: float = Query(20.0, description="Radius in kilometers"),
    category_id: Optional[int] = None,
    material_type: Optional[MaterialType] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Listing).filter(Listing.is_visible == True, Listing.status == ListingStatus.ACTIVE)
    if category_id:
        query = query.filter(Listing.category_id == category_id)
    if material_type:
        query = query.filter(Listing.material_type == material_type)

    all_listings = query.all()
    nearby_results = []

    for listing in all_listings:
        dist = calculate_haversine_distance(latitude, longitude, listing.latitude, listing.longitude)
        if dist <= radius:
            listing.distance_km = dist
            nearby_results.append(listing)

    nearby_results.sort(key=lambda x: x.distance_km if x.distance_km is not None else 999999)
    return nearby_results

@router.get("/matches", response_model=List[ListingResponse])
def get_user_matches(
    radius: float = Query(20.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.latitude is None or current_user.longitude is None:
        return []

    listings = db.query(Listing).filter(
        Listing.is_visible == True,
        Listing.status == ListingStatus.ACTIVE,
        Listing.seller_id != current_user.id
    ).all()

    matches = []
    for listing in listings:
        dist = calculate_haversine_distance(current_user.latitude, current_user.longitude, listing.latitude, listing.longitude)
        if dist <= radius:
            listing.distance_km = dist
            matches.append(listing)

    matches.sort(key=lambda x: x.distance_km if x.distance_km is not None else 999999)
    return matches

@router.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.post("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
