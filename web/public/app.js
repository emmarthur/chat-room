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
const selfBadgeEl = document.getElementById("self-badge");

const SESSION_KEY = "chat-room-v1";

const PARTICIPANT_SYMBOLS = ["◆", "●", "▲", "■", "★", "✦", "◇", "◎", "♣", "♠"];

let socket = null;
let currentRoom = "";
let myNickname = "";

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

function hashName(name) {
  let h = 0;
  const s = String(name || "Guest");
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Stable color + symbol for a display name (same name → same badge everywhere). */
function participantStyle(name) {
  const h = hashName(name);
  const symbol = PARTICIPANT_SYMBOLS[h % PARTICIPANT_SYMBOLS.length];
  const hue = h % 360;
  return {
    symbol,
    hue,
    bg: `hsla(${hue}, 65%, 42%, 0.35)`,
    border: `hsl(${hue}, 70%, 55%)`,
    text: `hsl(${hue}, 85%, 78%)`,
  };
}

function setError(message) {
  errorEl.hidden = !message;
  errorEl.textContent = message || "";
}

function normalizeMessage(msg) {
  if (msg && typeof msg === "object" && msg.text != null) {
    return { author: msg.author || "Guest", text: String(msg.text) };
  }
  return { author: "Guest", text: String(msg) };
}

function renderBadge(name, compact) {
  const style = participantStyle(name);
  const el = document.createElement("span");
  el.className = compact ? "msg-badge msg-badge-sm" : "msg-badge";
  el.style.background = style.bg;
  el.style.borderColor = style.border;
  el.style.color = style.text;
  el.textContent = style.symbol;
  el.title = name;
  el.setAttribute("aria-hidden", "true");
  return el;
}

function appendMessage(msg) {
  const { author, text } = normalizeMessage(msg);
  const li = document.createElement("li");
  li.className = "msg-item";

  const row = document.createElement("div");
  row.className = "msg-row";

  row.appendChild(renderBadge(author));
  const meta = document.createElement("span");
  meta.className = "msg-author";
  meta.style.color = participantStyle(author).text;
  meta.textContent = author;
  row.appendChild(meta);

  const body = document.createElement("p");
  body.className = "msg-text";
  body.textContent = text;

  li.appendChild(row);
  li.appendChild(body);
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendLog(entry) {
  const li = document.createElement("li");
  li.className = "log-item";
  li.appendChild(renderBadge(entry.user, true));
  const span = document.createElement("span");
  span.textContent = `${entry.user} joined at ${new Date(entry.time).toLocaleTimeString()}`;
  li.appendChild(span);
  logEvents.appendChild(li);
}

function updateSelfBadge(name) {
  if (!selfBadgeEl) return;
  selfBadgeEl.innerHTML = "";
  selfBadgeEl.appendChild(renderBadge(name));
  const label = document.createElement("span");
  label.className = "self-badge-label";
  label.textContent = `Your marker: ${name}`;
  selfBadgeEl.appendChild(label);
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
  myNickname = nick;
  s.emit("joinRoom", { room, nickname: nick });
  s.emit("loggedOn", nick);

  updateSelfBadge(nick);
  selfBadgeEl.hidden = false;
  roomStatus.textContent = `Connected to room “${room}”`;
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
