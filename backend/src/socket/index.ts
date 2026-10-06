import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { env } from "../config/env";
import { verifyToken } from "../utils/jwt";

let io: SocketIOServer;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("No auth token"));
    try {
      const payload = verifyToken(token);
      (socket as Socket & { user: ReturnType<typeof verifyToken> }).user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as Socket & { user: ReturnType<typeof verifyToken> }).user;
    console.log(`[WS] connected: ${user.userId} (${user.role})`);

    // Join institute room so broadcasts reach everyone in the institute
    if (user.instituteId) {
      socket.join(`institute:${user.instituteId}`);
    }

    // Individual user room for private notifications
    socket.join(`user:${user.userId}`);

    socket.on("disconnect", () => {
      console.log(`[WS] disconnected: ${user.userId}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io not initialised");
  return io;
}
