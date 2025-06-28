import pool from '../config/db-config.js';
import logger from '../config/logger-config.js';
import { retryAsyncOperation } from '../utilities/retry-utility.js';
import { WorkspaceDTO } from '../models/workspace-dto-model.js';
import {
  Workspace,
  mapWorkspaceDTOToWorkspace,
} from '../models/workspace-model.js';
import { AppError } from '../middleware/error-middleware.js';

const workspaceDbLogger = logger.child({ module: 'workspace-db-service' });

/**
 * Retrieves a workspace from the database based on the workspace ID.
 *
 * @function getWorkspace
 * @param {string} workspaceId - The unique identifier of the workspace to search for
 * @returns {Promise<Workspace | null>} A Promise that resolves to either a Workspace object containing the workspace's data or null if no workspace is found
 * @throws {AppError|Error} If the database operation fails after all retry attempts or if workspace data is undefined
 */
const getWorkspace = async (workspaceId: string): Promise<Workspace | null> => {
  const getWorkspaceQuery = `
    SELECT workspace_id, admin_id, access_token
    FROM users
    WHERE workspace_id = $1;
  `;
  const getParameters = [workspaceId];

  return retryAsyncOperation<Workspace | null>(async () => {
    const res = await pool.query<WorkspaceDTO>(
      getWorkspaceQuery,
      getParameters
    );
    if (res.rows.length > 0) {
      const workspaceDto = res.rows[0];
      if (!workspaceDto) {
        throw new AppError('Workspace data is undefined', 500);
      }
      return mapWorkspaceDTOToWorkspace(workspaceDto);
    }
    return null;
  }, 'getWorkspace');
};

/**
 * Saves or updates a workspace in the database.
 * If a workspace with the given ID exists, it updates the access token and authorization code.
 * If it doesn't exist, it creates a new workspace entry.
 *
 * @function saveWorkspace
 * @param {Workspace} user - The workspace object containing user details
 * @param {string} user.workspaceId - Unique identifier for the workspace
 * @param {number} user.adminId - ID of the workspace administrator
 * @param {string} user.accessToken - Access token for authentication
 * @param {string} user.authorizationCode - Authorization code for the workspace
 * @returns {Promise<string>} Returns a promise that resolves to the workspace ID
 * @throws {AppError|Error} Will throw an error if database operations fail after all retry attempts or if workspace ID is undefined
 */
const saveWorkspace = async (user: Workspace): Promise<string> => {
  const saveWorkspaceQuery = `
    INSERT INTO users (workspace_id, admin_id, access_token, authorization_code)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (workspace_id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      authorization_code = EXCLUDED.authorization_code
    RETURNING workspace_id;
  `;
  const saveParameters = [
    user.workspaceId,
    user.adminId,
    user.accessToken,
    user.authorizationCode,
  ];

  return retryAsyncOperation<string>(async () => {
    const res = await pool.query<WorkspaceDTO>(saveWorkspaceQuery, saveParameters);
    const workspaceId = res.rows[0]?.workspace_id;
    if (workspaceId === undefined) {
      throw new AppError(
        'Save workspace query returned undefined workspace_id',
        500
      );
    }
    workspaceDbLogger.debug(
      `User saved with Workspace ID: ${workspaceId}`
    );
    return workspaceId;
  }, 'saveWorkspace');
};

export { getWorkspace, saveWorkspace };
