/**
 * Type definitions for Intercom Canvas request objects.
 * These types provide interfaces for handling Intercom Canvas Kit request data.
 *
 * @see {@link https://developers.intercom.com/docs/references/canvas-kit/requestobjects/admin | Canvas Request Objects Documentation}
 */

/**
 * Represents a request structure for Intercom Canvas request.
 *
 * @interface IntercomCanvasRequest
 * @property {string} workspace_id The unique identifier for the workspace
 * @property {number} conversation The unique identifier for the conversation
 * @property {string} component_id The unique identifier for the component
 * @property {IntercomCanvasInput} input_values The input values from the Intercom Canvas
 */
export interface IntercomCanvasRequest {
  readonly workspace_id: string;
  readonly conversation: Id;
  readonly component_id: string;
  readonly input_values: IntercomCanvasInput;
}

/**
 * Represents the id of a conversation.
 *
 * @interface Id
 * @property {number} id The unique numerical identifier.
 * @readonly
 */
interface Id {
  readonly id: number;
}

/**
 * Representing input values for a Canvas request.
 *
 * @interface IntercomCanvasInput
 * @property {string} then The action to perform after processing the input values.
 * @property {number} numOfSnoozes The number of snoozes to create.
 * @property {string} [message${number}] Dynamic message properties with numeric suffixes (e.g., message1, message2)
 * @property {string} [snoozeDuration${number}] Dynamic snooze duration properties with numeric suffixes (e.g., snoozeDuration1, snoozeDuration2)
 */
export interface IntercomCanvasInput {
  readonly then: string;
  readonly numOfSnoozes: number;
  readonly [key: `message${number}`]: string;
  readonly [key: `snoozeDuration${number}`]: string;
}
