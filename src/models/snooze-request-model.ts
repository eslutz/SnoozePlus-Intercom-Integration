import { Message } from './message-model.js';

export interface SnoozeRequest {
  readonly messages: Message[];
  readonly note: string;
  readonly snoozeUntilUnixTimestamp: number;
}
