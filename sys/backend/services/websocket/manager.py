from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Remove dead connections
                self.active_connections.remove(connection)

class WebSocketManager(ConnectionManager):
    """Backward-compatible alias used across the codebase.

    Historically the project expected a `WebSocketManager` class. The
    implementation here is identical to `ConnectionManager` and we keep
    this alias to avoid import errors.
    """
    pass

# Global instance (use the WebSocketManager alias)
manager = WebSocketManager()