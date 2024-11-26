interface SnoozeRequest {
  readonly messages: Message[];
  readonly note: string;
  readonly snoozeUntilUnixTimestamp: number;
}
