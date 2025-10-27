from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group_buy = relationship("GroupBuy", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")
