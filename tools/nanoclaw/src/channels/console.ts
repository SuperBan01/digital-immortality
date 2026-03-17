import { Channel, OnInboundMessage, OnChatMetadata, RegisteredGroup } from '../types.js';
import { registerChannel } from './registry.js';
import * as fs from 'fs';
import * as path from 'path';

const CONSOLE_INPUT_FILE = '/tmp/nanoclaw-console-input';

class ConsoleChannel implements Channel {
  name = 'console';
  private connected = false;
  private onMessage: OnInboundMessage;
  private onChatMetadata: OnChatMetadata;
  private registeredGroups: () => Record<string, RegisteredGroup>;
  private lastReadPosition = 0;

  constructor(
    onMessage: OnInboundMessage,
    onChatMetadata: OnChatMetadata,
    registeredGroups: () => Record<string, RegisteredGroup>,
  ) {
    this.onMessage = onMessage;
    this.onChatMetadata = onChatMetadata;
    this.registeredGroups = registeredGroups;
  }

  async connect(): Promise<void> {
    this.connected = true;
    // Notify about the main chat
    this.onChatMetadata('console:main', new Date().toISOString(), 'Console', 'console', false);
    console.log('[console] Connected.');
    console.log('[console] To send a message, write to: echo "your message" > /tmp/nanoclaw-console-input');
    this.startFileWatching();
  }

  private startFileWatching(): void {
    // Check for new messages every second
    setInterval(() => {
      try {
        if (fs.existsSync(CONSOLE_INPUT_FILE)) {
          const content = fs.readFileSync(CONSOLE_INPUT_FILE, 'utf-8');
          const lines = content.split('\n').filter(line => line.trim());

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const message = {
              id: `console:${Date.now()}`,
              chat_jid: 'console:main',
              sender: 'user',
              sender_name: 'User',
              content: trimmed,
              timestamp: new Date().toISOString(),
            };
            console.log(`[console] Received: ${trimmed}`);
            this.onMessage('console:main', message);
          }

          // Clear the file after reading
          fs.writeFileSync(CONSOLE_INPUT_FILE, '');
        }
      } catch (err) {
        // Ignore errors
      }
    }, 1000);
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    console.log(`\n[Agent]: ${text}\n`);
  }

  isConnected(): boolean {
    return this.connected;
  }

  ownsJid(jid: string): boolean {
    return jid.startsWith('console:');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
}

export function init() {
  registerChannel('console', (opts) => {
    // Always available - console channel for testing
    return new ConsoleChannel(opts.onMessage, opts.onChatMetadata, opts.registeredGroups);
  });
}

init();
