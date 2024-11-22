interface SnoozeRequest {
  readonly messages: Array<Message>;
  readonly note: string;
  readonly snoozeUntilUnixTimestamp: number;
}
