interface MessageOutbound {
  readonly guid: string;
  readonly adminId: number;
  readonly conversationId: number;
  readonly message: string;
  readonly sendDate: Date;
  readonly closeConversation: boolean;
}
