# Import key services to make them available at the package level
from .ml.service import *
from .ml.enhanced import *
from .websocket.manager import *

# This makes it possible to import services like:
# from services import MLService, WebSocketManager

__all__ = [
    'MLService',  # From ml/service.py
    'EnhancedMLService',  # From ml/enhanced.py
    'WebSocketManager',  # From websocket/manager.py
]
