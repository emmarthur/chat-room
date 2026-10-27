/**
 * In-memory chat persistence — same events as the book's Mongo layer,
 * without an external database (local-only demo).
 */

export interface ChatMessage {
  messageText: string;
  received: Date;
  room: string;
}

export class MessageStore {
  private messages: ChatMessage[] = [];

  async add(message: ChatMessage): Promise<void> {
    this.messages.push({
      messageText: message.messageText,
      received: message.received,
      room: message.room,
    });
  }

  async getAll(room: string): Promise<string[]> {
    return this.messages
      .filter((m) => m.room === room)
      .map((m) => m.messageText);
  }
}
