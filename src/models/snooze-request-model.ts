interface SnoozeRequest {
  readonly workspaceId: number;
  readonly adminId: number;
  readonly conversationId: number;
  readonly messages: Array<Message>;
  readonly snoozeDetails: SnoozeDetails;
}
