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
 * @interface
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
 * @property {string} [key: `message${number}`] Dynamic message properties with numeric suffixes.
 * @property {string} [key: `snoozeDuration${number}`] Dynamic snooze length properties with numeric suffixes.
 * @property {string} then The action to perform after processing the input values.
 */
export interface IntercomCanvasInput {
  readonly [key: `message${number}`]: string;
  readonly [key: `snoozeDuration${number}`]: string;
  readonly then: string;
  readonly numOfSnoozes: number;
}
