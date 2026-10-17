const { Server } = require('socket.io');
const { verifyToken } = require('../utils/token');
const Doctor = require('../models/Doctor');

let io = null;

function initSocket(httpServer) {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      },
      credentials: true,
    },
  });

  // Enforce JWT on the connection handshake — unauthenticated sockets never connect.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    // Join role-scoped + user-scoped rooms so server code can target precisely.
    socket.join(`user:${socket.userId}`);

    if (socket.userRole === 'doctor') {
      const doctor = await Doctor.findOne({ user: socket.userId }).select('_id');
      if (doctor) socket.join(`doctor:${doctor._id}`);
    }

    if (socket.userRole === 'admin') {
      socket.join('admin');
    }

    socket.on('disconnect', () => {
      // no-op; rooms are cleaned up automatically by socket.io
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  return io;
}

module.exports = { initSocket, getIO };
