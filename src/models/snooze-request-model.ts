interface SnoozeRequest {
  readonly adminId: number;
  readonly conversationId: number;
  readonly messages: Array<Message>;
  readonly note: string;
  readonly snoozeUntilUnixTimestamp: number;
}
