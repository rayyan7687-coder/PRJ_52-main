from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.models.models import Conversation, Message, Listing, User
from app.schemas.chat import ConversationCreate, ConversationResponse, MessageCreate, MessageResponse
from app.core.dependencies import get_current_user
from app.core.security import decode_access_token
from app.websocket.chat import manager

router = APIRouter(tags=["Chat"])

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == conv_in.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot start a conversation on your own listing")

    existing = db.query(Conversation).filter(
        Conversation.listing_id == conv_in.listing_id,
        Conversation.buyer_id == current_user.id
    ).first()

    if existing:
        return existing

    conv = Conversation(
        listing_id=conv_in.listing_id,
        buyer_id=current_user.id,
        seller_id=listing.seller_id
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

@router.get("/conversations", response_model=List[ConversationResponse])
def get_user_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    convs = db.query(Conversation).filter(
        (Conversation.buyer_id == current_user.id) | (Conversation.seller_id == current_user.id)
    ).order_by(Conversation.created_at.desc()).all()

    for conv in convs:
        last_msg = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.desc()).first()
        conv.last_message = last_msg

    return convs

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.buyer_id != current_user.id and conv.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these messages")

    # Mark unread messages as read FIRST before querying return list
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    return messages

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: int,
    msg_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.buyer_id != current_user.id and conv.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        message=msg_in.message,
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@router.websocket("/ws/chat/{conversation_id}")
async def websocket_chat(websocket: WebSocket, conversation_id: int, token: str = Query(...)):
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    sub = payload.get("sub")
    if not sub:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = int(sub)

    db = SessionLocal()
    try:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv or (conv.buyer_id != user_id and conv.seller_id != user_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await manager.connect(conversation_id, websocket)

        try:
            while True:
                data = await websocket.receive_text()
                msg = Message(
                    conversation_id=conversation_id,
                    sender_id=user_id,
                    message=data,
                    is_read=False
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                msg_data = {
                    "id": msg.id,
                    "conversation_id": conversation_id,
                    "sender_id": user_id,
                    "message": data,
                    "created_at": msg.created_at.isoformat()
                }
                await manager.broadcast_to_conversation(conversation_id, msg_data)
        except WebSocketDisconnect:
            manager.disconnect(conversation_id, websocket)
    finally:
        db.close()
