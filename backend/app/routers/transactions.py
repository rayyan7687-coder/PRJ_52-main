from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Transaction, Listing, User, TransactionStatus, Report, ListingStatus, UserRole
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Transaction).filter(
        (Transaction.buyer_id == current_user.id) | (Transaction.seller_id == current_user.id)
    ).order_by(Transaction.created_at.desc()).all()

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
    if tx.seller_id != current_user.id and tx.buyer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    tx.status = tx_update.status
    if tx_update.status == TransactionStatus.COMPLETED:
        tx.completed_at = datetime.now(timezone.utc)
        tx.listing.status = ListingStatus.SOLD
        tx.listing.sold_at = datetime.now(timezone.utc)
        tx.listing.is_visible = False

    db.commit()
    db.refresh(tx)
    return tx

@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == report_in.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    report = Report(
        reporter_id=current_user.id,
        listing_id=report_in.listing_id,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    return db.query(User).all()

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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    return db.query(Report).order_by(Report.created_at.desc()).all()

@router.put("/admin/reports/{report_id}")
def admin_update_report(
    report_id: int,
    status_text: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = status_text
    db.commit()
    return {"message": "Report status updated"}

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
