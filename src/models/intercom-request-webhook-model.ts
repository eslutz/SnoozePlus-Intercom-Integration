/**
 * Type definitions for Intercom webhook request objects.
 * These types provide interfaces for handling Intercom webhook notifications.
 *
 * @see {@link https://developers.intercom.com/docs/references/webhooks/webhook-models#webhook-notification-object | Webhook Documentation}
 */

/**
 * Represents the Intercom webhook notification.
 * Contains the application ID, event topic, and conversation data.
 *
 * @interface IntercomWebhookRequest
 * @property {string} app_id The unique identifier of the Intercom application
 * @property {Item} data The payload data containing the conversation item details
 * @property {string} topic The event topic indicating the type of webhook notification
 */
export interface IntercomWebhookRequest {
  readonly app_id: string;
  readonly data: Item;
  readonly topic: string;
}

/**
 * Represents the data wrapper containing a conversation item in the webhook notification.
 *
 * @interface Item
 * @property {Id} item The conversation item containing the ID
 */
interface Item {
  readonly item: Id;
}

/**
 * Represents a conversation identifier within an Intercom webhook notification.
 *
 * @interface Id
 * @property {number} id The unique numerical identifier of the conversation
 */
interface Id {
  readonly id: number;
}
