/**
 * Data Transfer Object representing a saved message.
 *
 * @interface MessageDTO
 * @property {string} id Unique identifier for the message
 * @property {string} workspace_id Identifier for the workspace the message belongs to
 * @property {number} conversation_id Identifier for the conversation the message is part of
 * @property {string} message The content of the message
 * @property {Date} send_date The date and time when the message was sent
 * @property {boolean} close_conversation Flag indicating if the conversation should be closed
 * @property {boolean} archived Flag indicating if the message has been archived
 */
export interface MessageDTO {
  readonly id: string;
  readonly workspace_id: string;
  readonly conversation_id: number;
  readonly message: string;
  readonly send_date: Date;
  readonly close_conversation: boolean;
  readonly archived: boolean;
}
