import express from "express";
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";

import { ChatMessagePayload, MessageStore } from "./chatCore";

const PORT = Number(process.env.PORT) || 3029;
const store = new MessageStore();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true },
});

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
app.get("/help", (_req, res) => {
  res.sendFile(path.join(publicDir, "help.html"));
});

io.on("connection", (socket) => {
  let lastRoom = "";
  let displayName = "Guest";

  socket.on(
    "joinRoom",
    async (data: { room: string; nickname: string } | string) => {
      const room = typeof data === "string" ? data : data.room;
      if (typeof data === "object" && data.nickname?.trim()) {
        displayName = data.nickname.trim();
      }
      if (lastRoom !== "") {
        socket.leave(lastRoom);
      }
      if (room !== "") {
        socket.join(room);
      }
      const msgs = await store.getAll(room);
      socket.emit("allMessages", msgs);
      lastRoom = room;
    },
  );

  socket.on("message", async (text: string) => {
    await writeMessage(io, text, lastRoom, displayName);
  });

  socket.on("loggedOn", (user: string) => {
    if (user?.trim()) {
      displayName = user.trim();
    }
    if (lastRoom !== "") {
      socket.to(lastRoom).emit("userLogOn", { user: displayName, time: new Date() });
    }
  });
});

async function writeMessage(
  io: Server,
  message: string,
  room: string,
  author: string,
) {
  const payload: ChatMessagePayload = { author, text: message };
  await store.add({
    messageText: message,
    author,
    received: new Date(),
    room,
  });
  if (room !== "") {
    io.sockets.in(room).emit("message", payload);
    return;
  }
  io.emit("message", payload);
}

httpServer.listen(PORT, () => {
  console.log(`Chat server listening on http://localhost:${PORT}`);
});
