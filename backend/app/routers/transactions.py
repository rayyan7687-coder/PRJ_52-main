from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Transaction, Listing, User, TransactionStatus, Report, ListingStatus, UserRole, Conversation
from app.schemas.chat import TransactionCreate, TransactionUpdate, TransactionResponse, ReportCreate, ReportResponse
from app.schemas.schemas import UserResponse
from app.schemas.listing import ListingResponse
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(tags=["Transactions, Reports & Admin"])

@router.post("/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == tx_in.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not listing.is_visible or listing.status != ListingStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Listing is not active or available for transaction")
    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Seller cannot create a transaction for their own listing")
    if tx_in.agreed_price <= 0:
        raise HTTPException(status_code=400, detail="Agreed price must be greater than zero")

    tx = Transaction(
        listing_id=listing.id,
        seller_id=listing.seller_id,
        buyer_id=current_user.id,
        agreed_price=tx_in.agreed_price,
        status=TransactionStatus.PENDING
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@router.get("/transactions", response_model=List[TransactionResponse])
def get_user_transactions(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Transaction).filter(
        (Transaction.buyer_id == current_user.id) | (Transaction.seller_id == current_user.id)
    ).order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()

@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    tx_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    is_seller = (tx.seller_id == current_user.id)
    is_buyer = (tx.buyer_id == current_user.id)
    is_admin = (current_user.role == UserRole.ADMIN)

    if not (is_seller or is_buyer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")

    new_status = tx_update.status
    current_status = tx.status

    if current_status == TransactionStatus.COMPLETED and new_status != TransactionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Completed transactions cannot be altered")

    if is_buyer and not is_admin:
        if new_status != TransactionStatus.CANCELLED:
            raise HTTPException(status_code=403, detail="Buyers can only cancel their pending transaction requests")
        if current_status not in [TransactionStatus.PENDING, TransactionStatus.RESERVED]:
            raise HTTPException(status_code=400, detail="Cannot cancel transaction in its current state")

    if is_seller and not is_admin:
        if current_status == TransactionStatus.PENDING and new_status not in [TransactionStatus.RESERVED, TransactionStatus.COMPLETED, TransactionStatus.CANCELLED]:
            raise HTTPException(status_code=400, detail="Invalid status transition from PENDING")
        if current_status == TransactionStatus.RESERVED and new_status not in [TransactionStatus.COMPLETED, TransactionStatus.CANCELLED]:
            raise HTTPException(status_code=400, detail="Invalid status transition from RESERVED")

    tx.status = new_status
    if new_status == TransactionStatus.RESERVED:
        tx.listing.status = ListingStatus.RESERVED
    elif new_status == TransactionStatus.COMPLETED:
        tx.completed_at = datetime.now(timezone.utc)
        tx.listing.status = ListingStatus.SOLD
        tx.listing.sold_at = datetime.now(timezone.utc)
        tx.listing.is_visible = False
    elif new_status == TransactionStatus.CANCELLED:
        if tx.listing.status == ListingStatus.RESERVED:
            tx.listing.status = ListingStatus.ACTIVE

    db.commit()
    db.refresh(tx)
    return tx

@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not report_in.listing_id and not report_in.reported_user_id:
        raise HTTPException(status_code=400, detail="Either listing_id or reported_user_id must be provided")

    if report_in.listing_id:
        listing = db.query(Listing).filter(Listing.id == report_in.listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

    if report_in.reported_user_id:
        user = db.query(User).filter(User.id == report_in.reported_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Reported user not found")

    report = Report(
        reporter_id=current_user.id,
        listing_id=report_in.listing_id,
        reported_user_id=report_in.reported_user_id,
        reason=report_in.reason,
        description=report_in.description,
        status="PENDING"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

@router.get("/admin/users", response_model=List[UserResponse])
def admin_get_users(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    return db.query(User).offset(offset).limit(limit).all()

@router.put("/admin/users/{user_id}/block", response_model=UserResponse)
def admin_block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user

@router.put("/admin/users/{user_id}/unblock", response_model=UserResponse)
def admin_unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user

@router.get("/admin/reports", response_model=List[ReportResponse])
def admin_get_reports(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    return db.query(Report).order_by(Report.created_at.desc()).offset(offset).limit(limit).all()

@router.put("/admin/reports/{report_id}")
def admin_update_report(
    report_id: int,
    status_text: Optional[str] = "RESOLVED",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if status_text:
        report.status = status_text
    db.commit()
    return {"message": "Report status updated", "status": report.status}

@router.put("/admin/listings/{listing_id}/hide", response_model=ListingResponse)
def admin_hide_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing.is_visible = False
    db.commit()
    db.refresh(listing)
    return listing

@router.get("/admin/stats")
def admin_get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    completed_txs = db.query(Transaction).filter(Transaction.status == TransactionStatus.COMPLETED).all()
    total_sales_count = len(completed_txs)
    total_sales_volume = sum(tx.agreed_price for tx in completed_txs)

    active_listings_count = db.query(Listing).filter(Listing.status == ListingStatus.ACTIVE, Listing.is_visible == True).count()
    sold_listings_count = db.query(Listing).filter(Listing.status == ListingStatus.SOLD).count()
    reserved_listings_count = db.query(Listing).filter(Listing.status == ListingStatus.RESERVED).count()
    total_listings_count = db.query(Listing).count()

    total_users_count = db.query(User).count()
    buyers_count = db.query(User).filter(User.role.in_([UserRole.BUYER, UserRole.CONTRACTOR_BUILDER])).count()
    sellers_count = db.query(User).filter(User.role.in_([UserRole.SELLER, UserRole.CONTRACTOR_BUILDER])).count()

    conversations_count = db.query(Conversation).count()
    conversion_rate = round((total_sales_count / conversations_count * 100), 1) if conversations_count > 0 else 0.0

    return {
        "total_sales_count": total_sales_count,
        "total_sales_volume_inr": total_sales_volume,
        "active_listings_count": active_listings_count,
        "sold_listings_count": sold_listings_count,
        "reserved_listings_count": reserved_listings_count,
        "total_listings_count": total_listings_count,
        "total_users_count": total_users_count,
        "buyers_count": buyers_count,
        "sellers_count": sellers_count,
        "conversations_count": conversations_count,
        "conversion_rate_percent": conversion_rate
    }
