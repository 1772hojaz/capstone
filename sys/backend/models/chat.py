from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime
from db.database import get_db
from models.models import ChatMessage, GroupBuy, User
from authentication.auth import verify_token
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic Models
class ChatMessageCreate(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    user_email: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: int):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, websocket: WebSocket, group_id: int):
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)

    async def broadcast(self, message: str, group_id: int):
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error parsing message: {e}")

manager = ConnectionManager()

# Routes
@router.get("/{group_id}/messages", response_model=List[ChatMessageResponse])
async def get_messages(
    group_id: int,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all messages for a group-buy"""
    group = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group-buy not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.group_buy_id == group_id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    result = []
    for msg in messages:
        result.append(ChatMessageResponse(
            id=msg.id,
            user_id=msg.user_id,
            user_email=msg.user.email,
            message=msg.message,
            created_at=msg.created_at
        ))
    
    return result

@router.post("/{group_id}/messages", response_model=ChatMessageResponse)
async def post_message(
    group_id: int,
    message_data: ChatMessageCreate,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Post a message to a group-buy chat"""
    group = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group-buy not found")
    
    new_message = ChatMessage(
        group_buy_id=group_id,
        user_id=user.id,
        message=message_data.message
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Broadcast to WebSocket connections
    await manager.broadcast(
        json.dumps({
            "id": new_message.id,
            "user_id": user.id,
            "user_email": user.email,
            "message": message_data.message,
            "created_at": new_message.created_at.isoformat()
        }),
        group_id
    )
    
    return ChatMessageResponse(
        id=new_message.id,
        user_id=user.id,
        user_email=user.email,
        message=new_message.message,
        created_at=new_message.created_at
    )

@router.websocket("/{group_id}/ws")
async def websocket_endpoint(websocket: WebSocket, group_id: int):
    """WebSocket endpoint for real-time chat"""
    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data, group_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)