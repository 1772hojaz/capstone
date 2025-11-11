from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Store connections by user_id for targeted broadcasts
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Store user_id by websocket for cleanup
        self.websocket_to_user: Dict[WebSocket, int] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.websocket_to_user[websocket] = user_id

    def disconnect(self, websocket: WebSocket):
        user_id = self.websocket_to_user.get(websocket)
        if user_id and websocket in self.active_connections.get(user_id, []):
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        if websocket in self.websocket_to_user:
            del self.websocket_to_user[websocket]

    async def broadcast_to_user(self, user_id: int, message: dict):
        """Send message to all connections for a specific user"""
        if user_id in self.active_connections:
            message_json = json.dumps(message)
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message_json)
                except Exception:
                    # Remove dead connections
                    self.active_connections[user_id].remove(connection)

    async def broadcast(self, message: str):
        """Broadcast to all connected users"""
        for user_connections in self.active_connections.values():
            for connection in user_connections:
                try:
                    await connection.send_text(message)
                except Exception:
                    # Remove dead connections - this is simplified, should be improved
                    pass

# Global instance
manager = ConnectionManager()