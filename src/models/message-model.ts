/**
 * Represents a message object for communication.
 *
 * @interface Message
 * @property {string} message - The content of the message
 * @property {Date} sendDate - The date when the message was sent
 * @property {boolean} closeConversation - Flag indicating whether this message should close the conversation
 */
export interface Message {
  readonly message: string;
  readonly sendDate: Date;
  readonly closeConversation: boolean;
}
