class SnoozeRequest {
  readonly workspaceId: number;
  readonly adminId: number;
  readonly conversationId: number;
  readonly messages: Array<Message>;
  readonly snoozeDetails: SnoozeDetails;

  constructor(
    workspaceId: number,
    adminId: number,
    conversationId: number,
    messages: Array<Message>,
    snoozeDetails: SnoozeDetails
  ) {
    this.workspaceId = workspaceId;
    this.adminId = adminId;
    this.conversationId = conversationId;
    this.messages = messages;
    this.snoozeDetails = snoozeDetails;
  }
}
