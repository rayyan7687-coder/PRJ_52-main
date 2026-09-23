from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.models import TransactionStatus
from app.schemas.listing import ListingResponse, SellerSummaryResponse

class MessageCreate(BaseModel):
    message: str

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    listing_id: int

class ConversationResponse(BaseModel):
    id: int
    listing_id: int
    buyer_id: int
    seller_id: int
    created_at: datetime
    listing: ListingResponse
    buyer: SellerSummaryResponse
    seller: SellerSummaryResponse
    last_message: Optional[MessageResponse] = None

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    listing_id: int
    agreed_price: float

class TransactionUpdate(BaseModel):
    status: TransactionStatus

class TransactionResponse(BaseModel):
    id: int
    listing_id: int
    seller_id: int
    buyer_id: int
    agreed_price: float
    status: TransactionStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    listing: ListingResponse

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    listing_id: int
    reason: str
    description: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    listing_id: int
    reason: str
    description: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
