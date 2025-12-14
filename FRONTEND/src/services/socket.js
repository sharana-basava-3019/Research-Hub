/**
 * Socket helper
 */
import { io as ClientIO } from 'socket.io-client';

let socket = null;

export function initSocket(token) {
  if (!token) return null;
  if (socket) return socket;

  socket = ClientIO(process.env.REACT_APP_SOCKET_URL || (process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000'), {
    auth: { token }
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect error', err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
