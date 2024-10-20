class Message {
  readonly message: string;
  readonly sendDate: Date;

  constructor(message: string, sendDate: Date) {
    this.message = message;
    this.sendDate = sendDate;
  }
}
