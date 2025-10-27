import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type?: string;
  stage?: string;
  progress?: number;
  message?: string;
  [key: string]: any;
}

export const useWebSocket = (url: string, enabled: boolean = true) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        setMessages((prev) => [...prev, data]);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url, enabled]);

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setLastMessage(null);
  };

  return { messages, lastMessage, isConnected, sendMessage, clearMessages };
};

export default useWebSocket;
