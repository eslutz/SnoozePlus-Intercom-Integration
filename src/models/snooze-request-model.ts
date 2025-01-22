import { Message } from './message-model.js';

/**
 * Represents details needed to snooze a conversation in Intercom and messages to send at a later date.
 *
 * @interface SnoozeRequest
 * @property {Message[]} messages An array of messages to be snoozed.
 * @property {string} note Additional note or comment associated with the snooze request.
 * @property {number} snoozeUntilUnixTimestamp Unix timestamp indicating when the snooze period should end.
 */
export interface SnoozeRequest {
  readonly messages: Message[];
  readonly note: string;
  readonly snoozeUntilUnixTimestamp: number;
}
