import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (socket && socket.connected) return socket;
  const url = (import.meta.env as any).VITE_API_URL;
  if (!url) return null;
  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
