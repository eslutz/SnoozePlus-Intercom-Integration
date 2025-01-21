import { WorkspaceDTO } from './workspace-dto-model.js';

/**
 * Represents a workspace configuration for integration purposes.
 *
 * @interface Workspace
 * @property {string} workspaceId - The unique identifier for the workspace
 * @property {number} adminId - The administrator's unique identifier
 * @property {string} accessToken - The authentication token for accessing workspace resources
 * @property {string} authorizationCode - The authorization code used for initial authentication
 */
export interface Workspace {
  readonly workspaceId: string;
  readonly adminId: number;
  readonly accessToken: string;
  readonly authorizationCode: string;
}

/**
 * Maps a WorkspaceDTO object to a Workspace object.
 *
 * @param dto - The WorkspaceDTO object containing workspace data from external source
 * @returns A Workspace object with mapped properties
 */
export const mapWorkspaceDTOToWorkspace = (dto: WorkspaceDTO): Workspace => ({
  workspaceId: dto.workspace_id,
  adminId: dto.admin_id,
  accessToken: dto.access_token,
  authorizationCode: dto.authorization_code,
});
