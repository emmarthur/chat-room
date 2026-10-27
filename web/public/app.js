const nicknameEl = document.getElementById("nickname");
const roomEl = document.getElementById("room");
const joinBtn = document.getElementById("btn-join");
const roomStatus = document.getElementById("room-status");
const chatPanel = document.getElementById("chat-panel");
const logPanel = document.getElementById("log-panel");
const messagesEl = document.getElementById("messages");
const sendForm = document.getElementById("send-form");
const messageInput = document.getElementById("message-input");
const errorEl = document.getElementById("error-text");
const logEvents = document.getElementById("log-events");

const SESSION_KEY = "chat-room-v1";

let socket = null;
let currentRoom = "";

function persistState() {
  AppSession.save(SESSION_KEY, {
    nickname: nicknameEl.value,
    room: roomEl.value,
    currentRoom,
  });
}

function restoreState() {
  const saved = AppSession.load(SESSION_KEY);
  if (!saved) return;
  if (saved.nickname) nicknameEl.value = saved.nickname;
  if (saved.room) roomEl.value = saved.room;
}

AppSession.wireHelpSave(SESSION_KEY, () => ({
  nickname: nicknameEl.value,
  room: roomEl.value,
  currentRoom,
}));

function setError(message) {
  errorEl.hidden = !message;
  errorEl.textContent = message || "";
}

function appendMessage(text) {
  const li = document.createElement("li");
  li.textContent = text;
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendLog(entry) {
  const li = document.createElement("li");
  li.textContent = `${entry.user} joined at ${new Date(entry.time).toLocaleTimeString()}`;
  logEvents.appendChild(li);
}

function connectSocket() {
  if (socket) return socket;
  socket = io();
  socket.on("allMessages", (msgs) => {
    messagesEl.innerHTML = "";
    msgs.forEach(appendMessage);
  });
  socket.on("message", (msg) => appendMessage(msg));
  socket.on("userLogOn", (entry) => appendLog(entry));
  return socket;
}

function joinRoom() {
  setError(null);
  const nick = nicknameEl.value.trim();
  const room = roomEl.value.trim();
  if (!nick) {
    setError("Enter a display name.");
    nicknameEl.focus();
    return;
  }
  if (!room) {
    setError("Enter a room name.");
    roomEl.focus();
    return;
  }

  const s = connectSocket();
  currentRoom = room;
  s.emit("joinRoom", room);
  s.emit("loggedOn", nick);

  roomStatus.textContent = `Connected to room “${room}” as ${nick}`;
  chatPanel.hidden = false;
  logPanel.hidden = false;
  messageInput.focus();
  persistState();
}

joinBtn.addEventListener("click", () => joinRoom());

sendForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!socket || !currentRoom) return;
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit("message", text);
  messageInput.value = "";
});

nicknameEl.addEventListener("input", () => persistState());
roomEl.addEventListener("input", () => persistState());

restoreState();
