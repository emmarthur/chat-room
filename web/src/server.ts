import express from "express";
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";

import { MessageStore } from "./chatCore";

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

  socket.on("joinRoom", async (room: string) => {
    if (lastRoom !== "") {
      socket.leave(lastRoom);
    }
    if (room !== "") {
      socket.join(room);
    }
    const msgs = await store.getAll(room);
    socket.emit("allMessages", msgs);
    lastRoom = room;
  });

  socket.on("message", async (msg: string) => {
    await writeMessage(io, msg, lastRoom);
  });

  socket.on("loggedOn", (user: string) => {
    if (lastRoom !== "") {
      socket.to(lastRoom).emit("userLogOn", { user, time: new Date() });
    }
  });
});

async function writeMessage(io: Server, message: string, room: string) {
  await store.add({
    messageText: message,
    received: new Date(),
    room,
  });
  if (room !== "") {
    io.sockets.in(room).emit("message", message);
    return;
  }
  io.emit("message", message);
}

httpServer.listen(PORT, () => {
  console.log(`Chat server listening on http://localhost:${PORT}`);
});
