import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

/**
 * Establishes a JWT-authenticated Socket.io connection while the user is
 * logged in. Pass a map of { eventName: handler } to subscribe.
 *
 * Usage:
 *   useSocket({
 *     'appointment:confirmed': (data) => queryClient.invalidateQueries(['appointments']),
 *   });
 */
export function useSocket(handlers = {}) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const token = localStorage.getItem('healthflow_token');
    const socketUrl = import.meta.env.VITE_API_URL || '/';
    const socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current = socket;

    Object.entries(handlersRef.current).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return socketRef;
}
