export interface Message {
  readonly message: string;
  readonly sendDate: Date;
  readonly closeConversation: boolean;
}
