/**
 * Type definitions for Intercom conversation response objects.
 * These types provide interfaces for handling Intercom API conversation responses.
 *
 * @see {@link https://developers.intercom.com/docs/references/rest-api/api.intercom.io/conversations/conversation | Conversation API Documentation}
 */

/**
 * Represents the structure of an Intercom API conversation response.
 *
 * @interface IntercomResponse
 * @property {string} type The type of the Intercom conversation
 * @property {string} id Unique identifier for the conversation
 * @property {number} created_at Timestamp when the conversation was created
 * @property {number} updated_at Timestamp when the conversation was last updated
 * @property {number} waiting_since Timestamp indicating how long the conversation has been waiting
 * @property {number | null} snoozed_until Timestamp until when the conversation is snoozed (if applicable)
 * @property {Source} source The source information of the conversation
 * @property {Contacts} contacts Information about the contacts involved in the conversation
 * @property {Firstcontactreply} first_contact_reply Information about the first reply in the conversation
 * @property {string | null} admin_assignee_id ID of the admin assigned to the conversation
 * @property {string | null} team_assignee_id ID of the team assigned to the conversation
 * @property {boolean} open Indicates if the conversation is open
 * @property {string} state Current state of the conversation
 * @property {boolean} read Indicates if the conversation has been read
 * @property {Tags} tags Tags associated with the conversation
 * @property {string} priority Priority level of the conversation
 * @property {unknown} sla_applied SLA information applied to the conversation
 * @property {unknown} statistics Statistical data about the conversation
 * @property {unknown} conversation_rating Rating information for the conversation
 * @property {unknown} teammates Information about teammates involved
 * @property {string | null} title Title of the conversation
 * @property {Customattributes} custom_attributes Custom attributes associated with the conversation
 * @property {Customattributes} topics Topics associated with the conversation
 * @property {unknown} ticket Ticket information if applicable
 * @property {Linkedobjects} linked_objects Objects linked to the conversation
 * @property {unknown} ai_agent Information about AI agent if involved
 * @property {boolean} ai_agent_participated Indicates if an AI agent participated in the conversation
 * @property {Conversationparts} conversation_parts Parts/messages of the conversation
 */
export interface IntercomResponse {
  readonly type: string;
  readonly id: string;
  readonly created_at: number;
  readonly updated_at: number;
  readonly waiting_since: number;
  readonly snoozed_until: number | null;
  readonly source: Source;
  readonly contacts: Contacts;
  readonly first_contact_reply: Firstcontactreply;
  readonly admin_assignee_id: string | null;
  readonly team_assignee_id: string | null;
  readonly open: boolean;
  readonly state: string;
  readonly read: boolean;
  readonly tags: Tags;
  readonly priority: string;
  readonly sla_applied: unknown;
  readonly statistics: unknown;
  readonly conversation_rating: unknown;
  readonly teammates: unknown;
  readonly title: string | null;
  readonly custom_attributes: Customattributes;
  readonly topics: Customattributes;
  readonly ticket: unknown;
  readonly linked_objects: Linkedobjects;
  readonly ai_agent: unknown;
  readonly ai_agent_participated: boolean;
  readonly conversation_parts: Conversationparts;
}

/**
 * Represents a collection of conversation parts from an Intercom API response.
 *
 * @interface Conversationparts
 * @property {string} type The type of the conversation parts collection
 * @property {Conversationpart[]} conversation_parts An array of individual conversation parts
 * @property {number} total_count The total number of conversation parts in the collection
 */
interface Conversationparts {
  readonly type: string;
  readonly conversation_parts: Conversationpart[];
  readonly total_count: number;
}

/**
 * Represents a part or segment of a conversation form an Intercom API response.
 *
 * @interface Conversationpart
 * @property {string} type The type of the conversation part
 * @property {string} id Unique identifier for the conversation part
 * @property {string} part_type Specific type of the conversation part
 * @property {string} body The main content/message of the conversation part
 * @property {number} created_at Timestamp when the conversation part was created
 * @property {number} updated_at Timestamp when the conversation part was last updated
 * @property {number} notified_at Timestamp when notification was sent for this part
 * @property {null} assigned_to Information about assignment (null if unassigned)
 * @property {Author} author The author who created this conversation part
 * @property {unknown[]} attachments Array of attachments associated with this part
 * @property {null} external_id External identifier (null if not set)
 * @property {boolean} redacted Indicates if the conversation part has been redacted
 */
interface Conversationpart {
  readonly type: string;
  readonly id: string;
  readonly part_type: string;
  readonly body: string;
  readonly created_at: number;
  readonly updated_at: number;
  readonly notified_at: number;
  readonly assigned_to: null;
  readonly author: Author;
  readonly attachments: unknown[];
  readonly external_id: null;
  readonly redacted: boolean;
}

/**
 * Represents a collection of linked objects from an Intercom API response.
 *
 * @interface Linkedobjects
 * @property {string} type The type identifier for the linked objects collection
 * @property {unknown[]} data Array containing the linked objects data
 * @property {number} total_count The total number of items in the collection
 * @property {boolean} has_more Indicates whether there are more items available for pagination
 */
interface Linkedobjects {
  readonly type: string;
  readonly data: unknown[];
  readonly total_count: number;
  readonly has_more: boolean;
}

/**
 * Represents a generic object type for custom attributes in Intercom API response.
 * This type can hold any key-value pairs that are used as custom attributes
 * in the Intercom platform's data structure.
 *
 * @type {object}
 */
type Customattributes = object;

/**
 * Represents a collection of tags from an Intercom API response.
 *
 * @interface Tags
 * @property {string} type The type identifier for the tags collection
 * @property {unknown[]} tags An array of tags with unknown structure
 */
interface Tags {
  readonly type: string;
  readonly tags: unknown[];
}

/**
 * Represents the first contact reply in conversation from an Intercom API response.
 *
 * @interface Firstcontactreply
 * @property {number} created_at Unix timestamp of when the first contact reply was created
 * @property {string} type The type of the first contact reply
 * @property {null} url The URL associated with the first contact reply, always null
 */
interface Firstcontactreply {
  readonly created_at: number;
  readonly type: string;
  readonly url: null;
}

/**
 * Represents the structure for a collection of contacts from  an Intercom API response.
 *
 * @interface Contacts
 * @property {string} type The type identifier for the contacts collection
 * @property {Contact[]} contacts An array of Contact objects containing contact information
 */
interface Contacts {
  readonly type: string;
  readonly contacts: Contact[];
}

/**
 * Represents a contact from Intercom's API response.
 *
 * @interface Contact
 * @property {string} type The type of the contact
 * @property {string} id The unique identifier of the contact in Intercom
 * @property {string} external_id The external identifier of the contact
 */
interface Contact {
  readonly type: string;
  readonly id: string;
  readonly external_id: string;
}

/**
 * Represents the source of an Intercom message or conversation.
 *
 * @interface Source
 * @property {string} type The type of source
 * @property {string} id Unique identifier for the source
 * @property {string} delivered_as Delivery method of the source
 * @property {string} subject Subject line or title of the source
 * @property {string} body Main content or body text
 * @property {Author} author Author information of the source
 * @property {unknown[]} attachments Array of attachments associated with the source
 * @property {null} url URL associated with the source (null value)
 * @property {boolean} redacted Indicates if the source content has been redacted
 */
interface Source {
  readonly type: string;
  readonly id: string;
  readonly delivered_as: string;
  readonly subject: string;
  readonly body: string;
  readonly author: Author;
  readonly attachments: unknown[];
  readonly url: null;
  readonly redacted: boolean;
}

/**
 * Represents an author of an Intercom message or conversation.
 *
 * @interface Author
 * @property {string} type The type of the author
 * @property {string} id The unique identifier of the author
 * @property {string} name The full name of the author
 * @property {string} email The email address of the author
 */
interface Author {
  readonly type: string;
  readonly id: string;
  readonly name: string;
  readonly email: string;
}
