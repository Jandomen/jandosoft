import { Server } from "socket.io";
import { createServer } from "http";
import { parse } from "url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socketio",
  });

  globalThis.__io = io;

  io.on("connection", (socket) => {
    console.log("[WS] Connected:", socket.id);

    socket.on("join-admin", () => {
      socket.join("admin");
      console.log("[WS] Admin joined:", socket.id);
    });

    socket.on("join-store", (storeId: string) => {
      const room = `store:${storeId}`;
      socket.join(room);
      console.log(`[WS] Joined room ${room}:`, socket.id);
    });

    socket.on("join-user", (identifier: string) => {
      const room = `user:${identifier}`;
      socket.join(room);
      console.log(`[WS] Joined room ${room}:`, socket.id);
    });

    socket.on("leave-room", (room: string) => {
      socket.leave(room);
    });

    socket.on("disconnect", () => {
      console.log("[WS] Disconnected:", socket.id);
    });
  });

  console.log(`[WS] Socket.io server ready on port ${port}`);
  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
