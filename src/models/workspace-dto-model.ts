/**
 * Data Transfer Object representing workspace information.
 *
 * @interface WorkspaceDTO
 * @property {string} workspace_id The unique identifier for the user's workspace
 * @property {number} admin_id The numeric identifier for the admin user
 * @property {string} access_token The OAuth access token for authentication
 * @property {string} authorization_code The authorization code used in OAuth flow
 */
export interface WorkspaceDTO {
  readonly workspace_id: string;
  readonly admin_id: number;
  readonly access_token: string;
  readonly authorization_code: string;
}
