interface SnoozeRequest {
  readonly workspaceId: string;
  readonly adminId: number;
  readonly conversationId: number;
  readonly messages: Array<Message>;
  readonly snoozeDetails: SnoozeDetails;
}
