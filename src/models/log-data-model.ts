/**
 * Represents the structure of HTTP request log data.
 *
 * @interface LogData
 * @property {string | undefined} method The HTTP method used for the request
 * @property {string | undefined} url The URL path of the request
 * @property {number} status The HTTP status code of the response
 * @property {string | undefined} content_length The content length of the response
 * @property {number} response_time The time taken to process the request in milliseconds
 */
export interface LogData {
  method: string | undefined;
  url: string | undefined;
  status: number;
  content_length: string | undefined;
  response_time: number;
}
