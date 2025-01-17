export interface MessageDTO {
  readonly id: string;
  readonly workspaceId: string;
  readonly adminId: number;
  readonly adminAccessToken: string;
  readonly conversationId: number;
  readonly message: string;
  readonly sendDate: Date;
  readonly closeConversation: boolean;
  readonly archived: boolean;
}
