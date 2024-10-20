class SnoozeDetails {
  readonly snoozeCount: number;
  readonly snoozeDuration: number;
  readonly snoozeUntil: Date;
  readonly snoozeUntilUnixTimestamp: number;
  readonly snoozeNote: string;

  constructor(snoozeCount: number, snoozeDuration: number, snoozeUntil: Date) {
    this.snoozeCount = snoozeCount;
    this.snoozeDuration = snoozeDuration;
    this.snoozeUntil = snoozeUntil;
    this.snoozeUntilUnixTimestamp = this.setUnixTimestamp();
    this.snoozeNote = this.setSnoozeNote();
  }

  private setUnixTimestamp(): number {
    return Math.floor(this.snoozeUntil.getTime() / 1000);
  }

  private setSnoozeNote(): string {
    const time = this.snoozeCount > 1 ? 'times' : 'time';
    const day = this.snoozeDuration > 1 ? 'days' : 'day';

    return `<p><strong>Snooze+ has been set.</strong></p><br /><p>The conversation will be snoozed ${this.snoozeCount} ${time} for a total of ${this.snoozeDuration} ${day}.  The snooze will end on ${this.snoozeUntil.toLocaleDateString()}.</p>`;
  }
}
