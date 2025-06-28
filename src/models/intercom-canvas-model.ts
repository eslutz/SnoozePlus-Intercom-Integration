/**
 * Type definitions for Intercom Canvas components.
 * These types provide interfaces for the Intercom Canvas Kit API components.
 *
 * @see {@link https://developers.intercom.com/docs/references/canvas-kit/responseobjects/canvas/ | Canvas Documentation}
 * @see {@link https://developers.intercom.com/docs/references/canvas-kit/interactivecomponents/button | Components Documentation}
 */

/**
 * Represents an option in dropdown or single select components.
 *
 * @interface CanvasOption
 * @property {string} type - Always 'option'
 * @property {string} id - Unique identifier for this option
 * @property {string} text - Display text for this option
 */
export interface CanvasOption {
  type: 'option';
  id: string;
  text: string;
}

/**
 * Represents a text component in an Intercom canvas.
 *
 * @interface CanvasTextComponent
 * @property {string} type - Always 'text'
 * @property {string} [id] - Optional unique identifier
 * @property {string} text - The text content to display
 * @property {'header' | 'paragraph' | 'muted'} style - Display style
 */
export interface CanvasTextComponent {
  type: 'text';
  id?: string;
  text: string;
  style: 'header' | 'paragraph' | 'muted';
}

/**
 * Represents a spacer (vertical spacing) component in an Intercom canvas.
 *
 * @interface CanvasSpacerComponent
 * @property {string} type - Always 'spacer'
 * @property {'s' | 'm' | 'l' | 'xl'} size - Space size (small, medium, large, extra large)
 */
export interface CanvasSpacerComponent {
  type: 'spacer';
  size: 's' | 'm' | 'l' | 'xl';
}

/**
 * Represents a horizontal divider line in an Intercom canvas.
 *
 * @interface CanvasDividerComponent
 * @property {string} type - Always 'divider'
 */
export interface CanvasDividerComponent {
  type: 'divider';
}

/**
 * Represents a dropdown selection component in an Intercom canvas.
 *
 * @interface CanvasDropdownComponent
 * @property {string} type - Always 'dropdown'
 * @property {string} id - Unique identifier for this dropdown
 * @property {string} label - Label text displayed above the dropdown
 * @property {CanvasOption[]} options - Array of available options
 */
export interface CanvasDropdownComponent {
  type: 'dropdown';
  id: string;
  label: string;
  options: CanvasOption[];
}

/**
 * Represents a single select component in an Intercom canvas.
 *
 * @interface CanvasSingleSelectComponent
 * @property {string} type - Always 'single-select'
 * @property {string} id - Unique identifier for this component
 * @property {string} label - Label text displayed above the selection
 * @property {CanvasOption[]} options - Array of available options
 */
export interface CanvasSingleSelectComponent {
  type: 'single-select';
  id: string;
  label: string;
  options: CanvasOption[];
}

/**
 * Represents a text area input component in an Intercom canvas.
 *
 * @interface CanvasTextareaComponent
 * @property {string} type - Always 'textarea'
 * @property {string} id - Unique identifier for this textarea
 * @property {string} label - Label text displayed above the textarea
 * @property {string} [placeholder] - Optional placeholder text
 */
export interface CanvasTextareaComponent {
  type: 'textarea';
  id: string;
  label: string;
  placeholder?: string;
}

/**
 * Represents a button component in an Intercom canvas.
 *
 * @interface CanvasButtonComponent
 * @property {string} type - Always 'button'
 * @property {string} id - Unique identifier for this button
 * @property {string} label - Text displayed on the button
 * @property {'primary' | 'secondary'} style - Button style
 * @property {object} action - Button action configuration
 * @property {'submit'} action.type - Action type (currently only 'submit' is supported)
 */
export interface CanvasButtonComponent {
  type: 'button';
  id: string;
  label: string;
  style: 'primary' | 'secondary';
  action: {
    type: 'submit';
  };
}

/**
 * Union type representing any valid Intercom Canvas component.
 */
export type CanvasComponent =
  | CanvasTextComponent
  | CanvasSpacerComponent
  | CanvasDividerComponent
  | CanvasDropdownComponent
  | CanvasSingleSelectComponent
  | CanvasTextareaComponent
  | CanvasButtonComponent;

/**
 * Represents a complete Intercom Canvas response object.
 *
 * @interface CanvasResponse
 * @property {object} canvas - The top-level canvas object
 * @property {object} canvas.content - Canvas content container
 * @property {CanvasComponent[]} canvas.content.components - Array of components to display
 */
export interface CanvasResponse {
  canvas: {
    content: {
      components: CanvasComponent[];
    };
  };
}
