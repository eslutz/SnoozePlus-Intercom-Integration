import { Message } from '../models/message-model.js';
import { Workspace } from '../models/workspace-model.js';

/**
 * Interface for message database operations
 */
export interface IMessageService {
  saveMessages(
    workspaceId: string,
    conversationId: number,
    messages: Message[]
  ): Promise<string[]>;
  getMessages(workspaceId: string, conversationId: number): Promise<Message[]>;
  archiveMessages(workspaceId: string, conversationId: number): Promise<number>;
  archiveMessage(messageId: string): Promise<number>;
  getTodaysMessages(): Promise<Message[]>;
  getRemainingMessageCount(message: Message): Promise<number>;
}

/**
 * Interface for workspace database operations
 */
export interface IWorkspaceService {
  getWorkspace(workspaceId: string): Promise<Workspace | null>;
  saveWorkspace(workspace: Workspace): Promise<string>;
}

/**
 * Interface for Intercom API operations
 */
export interface IIntercomService {
  sendMessage(params: SendMessageParams): Promise<void>;
  addNote(params: AddNoteParams): Promise<void>;
  cancelSnooze(params: CancelSnoozeParams): Promise<void>;
  setSnooze(params: SetSnoozeParams): Promise<void>;
  closeConversation(params: CloseConversationParams): Promise<void>;
  getCircuitBreakerState(): any;
}

/**
 * Interface for cryptographic operations
 */
export interface ICryptoService {
  encrypt(text: string): Promise<string>;
  decrypt(encryptedText: string): Promise<string>;
}

/**
 * Parameters for sending a message via Intercom
 */
export interface SendMessageParams {
  accessToken: string;
  conversationId: number;
  adminId: number;
  message: string;
  closeConversation: boolean;
}

/**
 * Parameters for adding a note to a conversation
 */
export interface AddNoteParams {
  accessToken: string;
  conversationId: number;
  adminId: number;
  message: string;
}

/**
 * Parameters for cancelling snooze on a conversation
 */
export interface CancelSnoozeParams {
  accessToken: string;
  conversationId: number;
  adminId: number;
}

/**
 * Parameters for setting snooze on a conversation
 */
export interface SetSnoozeParams {
  accessToken: string;
  conversationId: number;
  adminId: number;
  unixTimestamp: number;
}

/**
 * Parameters for closing a conversation
 */
export interface CloseConversationParams {
  accessToken: string;
  conversationId: number;
  adminId: number;
}
