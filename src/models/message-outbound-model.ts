interface MessageOutbound {
  readonly workspaceId: string;
  readonly adminId: number;
  readonly conversationId: number;
  readonly message: string;
  readonly sendDate: Date;
}
