# Book directions — Chat room (Socket.IO)

**Catalog #1132** · Peter O'Hanlon, *Advanced TypeScript Programming Projects* (Packt, 2019), **Chapter 6** — real-time chat with Socket.IO

- Packt repo: [Chapter06/Server](https://github.com/PacktPublishing/Advanced-TypeScript-3-Programming-Projects/tree/master/Chapter06/Server) (server) + [Chapter06/Client](https://github.com/PacktPublishing/Advanced-TypeScript-3-Programming-Projects/tree/master/Chapter06/Client) (Angular UI)
- Local reference: [`reference/SocketServer_chapter06.ts`](./reference/SocketServer_chapter06.ts) (upstream Mongo + `secret` room)
- Shared logic: [`web/src/chatCore.ts`](./web/src/chatCore.ts) (in-memory store instead of MongoDB)
- Server entry: [`web/src/server.ts`](./web/src/server.ts)

## What the book asks you to build

A **Socket.IO** server that:

1. Listens for **`joinRoom`** — leave previous room, join new room, emit **`allMessages`** history for that room.
2. Listens for **`message`** — persist and broadcast to the room (or everyone if no room).
3. Listens for **`loggedOn`** — notify other clients (book uses a `secret` room; this demo notifies others in the same room).

The book persists messages in **MongoDB** and ships an **Angular** client.

## Web version (`web/` — Node + Express + Socket.IO, port **3029**)

| Book piece | Web equivalent |
|------------|----------------|
| Mongo `MessageDataAccess` | `MessageStore` in `chatCore.ts` (in-memory, same fields) |
| `SocketServer` events | `web/src/server.ts` |
| Angular client | Static HTML/JS client in `web/public/` |
| No cloud DB | Required for local-only portfolio demos |

## Run

```powershell
Set-Location "c:\Users\emmak\Desktop\Content\CodingProjects\PortProjects\demos\chat-room\web"
npm install
npm run dev
```

Open http://localhost:3029 (use two browser tabs to test).
