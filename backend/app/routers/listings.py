from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import (
    Listing, ListingImage, Category, User, ListingStatus, UserRole, MaterialType,
    ListingCondition, Favorite, Conversation, Transaction
)
from app.schemas.listing import (
    ListingCreate, ListingUpdate, ListingResponse, CategoryResponse, CategoryCreate,
    ListingImageResponse, ListingImageCreate, SellerSummaryResponse
)
from app.core.dependencies import get_current_user, require_roles
from app.core.security import decode_access_token

router = APIRouter(tags=["Listings & Favorites"])

def get_optional_current_user(request: Request, db: Session) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()

def sanitize_listing_response(listing: Listing, viewer: Optional[User], db: Session) -> ListingResponse:
    listing_resp = ListingResponse.model_validate(listing)

    # Determine if viewer is authorized to see full contact details
    can_see_contact = False
    if viewer:
        if viewer.id == listing.seller_id or viewer.role == UserRole.ADMIN:
            can_see_contact = True
        else:
            # Check for existing conversation or transaction
            has_conv = db.query(Conversation).filter(
                Conversation.listing_id == listing.id,
                (Conversation.buyer_id == viewer.id) | (Conversation.seller_id == viewer.id)
            ).first()
            has_tx = db.query(Transaction).filter(
                Transaction.listing_id == listing.id,
                (Transaction.buyer_id == viewer.id) | (Transaction.seller_id == viewer.id)
            ).first()
            if has_conv or has_tx:
                can_see_contact = True

    if not can_see_contact:
        listing_resp.seller.email = None
        listing_resp.seller.phone = None

    return listing_resp

# Category Endpoints
@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(material_type: Optional[MaterialType] = None, db: Session = Depends(get_db)):
    query = db.query(Category).filter(Category.is_active == True)
    if material_type:
        query = query.filter(Category.material_type == material_type)
    return query.all()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    category = Category(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

# Listing Endpoints
@router.post("/listings", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    request: Request,
    listing_in: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.CONTRACTOR_BUILDER, UserRole.SELLER, UserRole.ADMIN]))
):
    category = db.query(Category).filter(Category.id == listing_in.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category_id")

    listing_dict = listing_in.model_dump(exclude={"images", "material_type", "currency"})
    listing = Listing(
        **listing_dict,
        seller_id=current_user.id,
        material_type=category.material_type,
        status=ListingStatus.ACTIVE,
        is_visible=True
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    if listing_in.images:
        for idx, img_url in enumerate(listing_in.images):
            img = ListingImage(listing_id=listing.id, image_url=img_url, sort_order=idx)
            db.add(img)
        db.commit()
        db.refresh(listing)

    return sanitize_listing_response(listing, current_user, db)

@router.get("/listings", response_model=List[ListingResponse])
def get_listings(
    request: Request,
    category_id: Optional[int] = None,
    material_type: Optional[MaterialType] = None,
    condition: Optional[ListingCondition] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    status_filter: Optional[ListingStatus] = Query(ListingStatus.ACTIVE, alias="status"),
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    viewer = get_optional_current_user(request, db)
    query = db.query(Listing).filter(Listing.is_visible == True)
    if status_filter:
        query = query.filter(Listing.status == status_filter)
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

    listings = query.order_by(Listing.created_at.desc()).offset(offset).limit(limit).all()
    return [sanitize_listing_response(lst, viewer, db) for lst in listings]

@router.get("/listings/me", response_model=List[ListingResponse])
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listings = db.query(Listing).filter(Listing.seller_id == current_user.id).order_by(Listing.created_at.desc()).all()
    return [sanitize_listing_response(lst, current_user, db) for lst in listings]

@router.get("/listings/{listing_id}", response_model=ListingResponse)
def get_listing_by_id(request: Request, listing_id: int, db: Session = Depends(get_db)):
    viewer = get_optional_current_user(request, db)
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if not listing.is_visible:
        if not viewer or (viewer.id != listing.seller_id and viewer.role != UserRole.ADMIN):
            raise HTTPException(status_code=404, detail="Listing not found")

    return sanitize_listing_response(listing, viewer, db)

@router.put("/listings/{listing_id}", response_model=ListingResponse)
def update_listing(
    request: Request,
    listing_id: int,
    listing_update: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")

    update_data = listing_update.model_dump(exclude_unset=True)

    if "category_id" in update_data and update_data["category_id"] is not None:
        category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not category:
            raise HTTPException(status_code=400, detail="Invalid category_id")
        listing.material_type = category.material_type

    for key, value in update_data.items():
        setattr(listing, key, value)

    listing.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(listing)
    return sanitize_listing_response(listing, current_user, db)

@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")

    db.delete(listing)
    db.commit()
    return None

@router.post("/listings/{listing_id}/reserve", response_model=ListingResponse)
def reserve_listing(
    request: Request,
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only seller or admin can reserve this listing")
    if listing.status != ListingStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Listing is not active")

    listing.status = ListingStatus.RESERVED
    db.commit()
    db.refresh(listing)
    return sanitize_listing_response(listing, current_user, db)

@router.post("/listings/{listing_id}/release", response_model=ListingResponse)
def release_listing(
    request: Request,
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only seller or admin can release this listing")
    if listing.status == ListingStatus.SOLD:
        raise HTTPException(status_code=400, detail="Cannot release a listing that has already been sold")

    listing.status = ListingStatus.ACTIVE
    db.commit()
    db.refresh(listing)
    return sanitize_listing_response(listing, current_user, db)

@router.post("/listings/{listing_id}/sold", response_model=ListingResponse)
def mark_listing_sold(
    request: Request,
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only seller or admin can mark listing as sold")

    listing.status = ListingStatus.SOLD
    listing.sold_at = datetime.now(timezone.utc)
    listing.is_visible = False
    db.commit()
    db.refresh(listing)
    return sanitize_listing_response(listing, current_user, db)

# Favorites Endpoints
@router.post("/listings/{listing_id}/favorite")
def add_favorite(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    fav = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.listing_id == listing_id).first()
    if not fav:
        fav = Favorite(user_id=current_user.id, listing_id=listing_id)
        db.add(fav)
        db.commit()
    return {"message": "Listing added to favorites"}

@router.delete("/listings/{listing_id}/favorite")
def remove_favorite(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fav = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.listing_id == listing_id).first()
    if fav:
        db.delete(fav)
        db.commit()
    return {"message": "Listing removed from favorites"}

@router.get("/users/me/favorites", response_model=List[ListingResponse])
def get_user_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    return [sanitize_listing_response(fav.listing, current_user, db) for fav in favs if fav.listing]

# Image APIs
@router.post("/listings/{listing_id}/images", response_model=ListingImageResponse)
def add_listing_image(
    listing_id: int,
    image_in: ListingImageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    img = ListingImage(listing_id=listing_id, **image_in.model_dump())
    db.add(img)
    db.commit()
    db.refresh(img)
    return img

@router.delete("/listings/{listing_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing_image(
    listing_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    img = db.query(ListingImage).filter(ListingImage.id == image_id, ListingImage.listing_id == listing_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    if img.listing.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(img)
    db.commit()
    return None
