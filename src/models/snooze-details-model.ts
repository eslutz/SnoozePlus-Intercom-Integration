interface SnoozeDetails {
  readonly snoozeCount: number;
  readonly snoozeDuration: number;
  readonly snoozeUntil: Date;
  readonly snoozeUntilUnixTimestamp: number;
  readonly snoozeNote: string;
}
