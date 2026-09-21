/**
 * Socket.io Client Helper Service
 * Manages WebSocket connection, authentication, room subscriptions, and real-time events
 */

import { io as ClientIO } from 'socket.io-client';

let socket = null;

export function initSocket(token) {
  if (!token) return null;
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
  }

  const socketUrl = process.env.REACT_APP_SOCKET_URL || (process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');

  socket = ClientIO(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected to server:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection warning:', err.message);
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

export function joinProjectRoom(projectId) {
  if (socket && projectId) {
    socket.emit('join_project', projectId);
  }
}

export function leaveProjectRoom(projectId) {
  if (socket && projectId) {
    socket.emit('leave_project', projectId);
  }
}
