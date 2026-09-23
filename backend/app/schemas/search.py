from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.listing import ListingResponse

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    listing_id: Optional[int] = None
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MatchPreferences(BaseModel):
    categories: Optional[List[int]] = []
    radius_km: Optional[float] = 20.0
    max_price: Optional[float] = None

class NearbySearchResponse(BaseModel):
    listings: List[ListingResponse]
    total: int
