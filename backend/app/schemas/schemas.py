from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, model_validator
from app.models.models import UserRole

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.CONTRACTOR_BUILDER
    address: Optional[str] = None
    admin_key: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    location_sharing_enabled: bool = False
    location_updated_at: Optional[datetime] = None
    is_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class LocationUpdate(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    # The client must send true deliberately; this is not inferred from a map
    # visit or a nearby-search request.
    location_sharing_enabled: bool

    @model_validator(mode="after")
    def require_coordinates_when_sharing(self):
        if self.location_sharing_enabled and (self.latitude is None or self.longitude is None):
            raise ValueError("latitude and longitude are required when location sharing is enabled")
        return self

class PublicUserResponse(BaseModel):
    id: int
    name: str
    role: UserRole
    is_verified: bool

    class Config:
        from_attributes = True
