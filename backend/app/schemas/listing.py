from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.models import UserRole, MaterialType, ListingCondition, ListingGrade, ListingStatus

class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    material_type: MaterialType
    description: Optional[str] = None
    is_active: bool

class CategoryCreate(BaseModel):
    name: str
    material_type: MaterialType
    description: Optional[str] = None

class ListingImageCreate(BaseModel):
    image_url: str
    thumbnail_url: Optional[str] = None
    sort_order: Optional[int] = 0

class ListingImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    image_url: str
    thumbnail_url: Optional[str] = None
    sort_order: int
    created_at: datetime

class ListingCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category_id: int
    description: Optional[str] = None
    material_type: Optional[MaterialType] = MaterialType.REUSABLE
    quantity: float = Field(..., gt=0)
    unit: str = Field(..., min_length=1, max_length=50)
    condition: ListingCondition = ListingCondition.GOOD
    grade: Optional[ListingGrade] = ListingGrade.B
    price: float = Field(..., ge=0)
    currency: str = "INR"
    is_negotiable: bool = True
    latitude: float
    longitude: float
    location_text: Optional[str] = None
    images: Optional[List[str]] = []

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    condition: Optional[ListingCondition] = None
    grade: Optional[ListingGrade] = None
    price: Optional[float] = None
    currency: Optional[str] = "INR"
    is_negotiable: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_text: Optional[str] = None

class SellerSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    is_verified: bool

class ListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    seller_id: int
    category_id: int
    title: str
    description: Optional[str] = None
    material_type: MaterialType
    quantity: float
    unit: str
    condition: ListingCondition
    grade: Optional[ListingGrade] = None
    price: float
    currency: str = "INR"
    is_negotiable: bool
    latitude: float
    longitude: float
    location_text: Optional[str] = None
    status: ListingStatus
    is_visible: bool
    created_at: datetime
    updated_at: datetime
    sold_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    category: CategoryResponse
    seller: SellerSummaryResponse
    images: List[ListingImageResponse] = []
    distance_km: Optional[float] = None
