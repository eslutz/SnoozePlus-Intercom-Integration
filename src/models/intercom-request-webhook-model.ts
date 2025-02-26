/**
 * Represents the structure of an incoming Intercom webhook notification.
 *
 * @interface
 * @property {string} app_id The unique identifier of the Intercom application.
 * @property {Item} data The payload data containing the item details from Intercom.
 * @property {string} topic The event topic or type of the webhook notification.
 */
export interface IntercomWebhookRequest {
  readonly app_id: string;
  readonly data: Item;
  readonly topic: string;
}

/**
 * Represents an conversation with an ID in the Intercom webhook notification.
 *
 * @interface Item
 * @property {Id} item The unique identifier of the item.
 */
interface Item {
  readonly item: Id;
}

/**
 * Represents a conversation id within an Intercom webhook notification.
 *
 * @interface
 * @property {number} id The unique numerical identifier.
 * @readonly
 */
interface Id {
  readonly id: number;
}
