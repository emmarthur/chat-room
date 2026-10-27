/**
 * In-memory chat persistence — same events as the book's Mongo layer,
 * without an external database (local-only demo).
 */

export interface ChatMessage {
  messageText: string;
  author: string;
  received: Date;
  room: string;
}

export interface ChatMessagePayload {
  author: string;
  text: string;
}

export class MessageStore {
  private messages: ChatMessage[] = [];

  async add(message: ChatMessage): Promise<void> {
    this.messages.push({
      messageText: message.messageText,
      author: message.author,
      received: message.received,
      room: message.room,
    });
  }

  async getAll(room: string): Promise<ChatMessagePayload[]> {
    return this.messages
      .filter((m) => m.room === room)
      .map((m) => ({ author: m.author, text: m.messageText }));
  }
}
