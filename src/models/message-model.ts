import { MessageDTO } from './message-dto-model.js';

/**
 * Represents a message object for communication with auth details.
 *
 * @interface Message
 * @property {string} workspaceId The unique identifier of the workspace where the message belongs
 * @property {number} conversationId The unique identifier of the conversation this message is part of
 * @property {string} message The content of the message
 * @property {Date} sendDate The date and time when the message was sent
 * @property {boolean} closeConversation Flag indicating if this message should close the conversation
 * @property {boolean} archived Flag indicating if the message has been archived
 * @property {number} adminId The unique identifier of the admin user
 * @property {string} accessToken The access token for authentication
 */
export interface Message {
  readonly id: string;
  readonly workspaceId: string;
  readonly conversationId: number;
  readonly message: string;
  readonly sendDate: Date;
  readonly closeConversation: boolean;
  readonly archived: boolean;
  readonly adminId: number;
  readonly accessToken: string;
}

/**
 * Maps a MessageDTO object to a Message object with additional admin authentication details.
 *
 * @param dto The MessageDTO object containing message data
 * @param adminId The ID of the admin user
 * @param accessToken The access token for authentication
 * @returns {Message} A Message object with merged DTO and admin authentication properties
 */
export const mapMessageDTOToMessage = (
  dto: MessageDTO,
  adminId: number,
  accessToken: string
): Message => ({
  id: dto.id,
  workspaceId: dto.workspace_id,
  conversationId: dto.conversation_id,
  message: dto.message,
  sendDate: dto.send_date,
  closeConversation: dto.close_conversation,
  archived: dto.archived,
  adminId: adminId,
  accessToken: accessToken,
});

/**
 * Maps a MessageDTO object to a Message object without authentication details.
 *
 * @param dto - The MessageDTO object to be mapped
 * @returns A Message object with empty authentication fields (adminId and accessToken)
 *
 * @remarks This function creates a new Message object from a MessageDTO, setting default
 * values for authentication-related fields (adminId = 0, accessToken = '')
 */
export const mapMessageDTOToMessageWithoutAuth = (
  dto: MessageDTO
): Message => ({
  id: dto.id,
  workspaceId: dto.workspace_id,
  conversationId: dto.conversation_id,
  message: dto.message,
  sendDate: dto.send_date,
  closeConversation: dto.close_conversation,
  archived: dto.archived,
  adminId: 0,
  accessToken: '',
});
