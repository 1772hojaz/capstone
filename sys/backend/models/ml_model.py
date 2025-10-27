from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Text
from datetime import datetime
from db.database import Base

class MLModel(Base):
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String, nullable=False)  # e.g., 'recommendation', 'pricing', etc.
    model_path = Column(String, nullable=False)  # Path to the model file
    metrics = Column(JSON)  # Store evaluation metrics
    trained_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Model versioning
    version = Column(String, nullable=False, default="1.0.0")
    description = Column(Text, nullable=True)
    
    # Training parameters
    parameters = Column(JSON)  # Store hyperparameters used for training
    training_data_range = Column(JSON)  # Date range of training data
