import pool from '../config/db-config.js';
import logger from '../config/logger-config.js';
import createRetryOperation from '../config/retry-config.js';
import { WorkspaceDTO } from '../models/workspace-dto-model.js';
import {
  Workspace,
  mapWorkspaceDTOToWorkspace,
} from '../models/workspace-model.js';

const workspaceDbLogger = logger.child({ module: 'workspace-db-service' });

/**
 * Retrieves a workspace from the database based on the workspace ID.
 *
 * @function getWorkspace
 * @param workspaceId The unique identifier of the workspace to search for
 * @returns {Promise<Workspace | null>} A Promise that resolves to either a Workspace object containing the workspace's data or null if no workspace is found
 * @throws {Error} If the database operation fails after all retry attempts
 */
const getWorkspace = async (workspaceId: string): Promise<Workspace | null> => {
  const getWorkspaceQuery = `
    SELECT workspace_id, admin_id, access_token
    FROM users
    WHERE workspace_id = $1;
  `;
  const getParameters = [workspaceId];

  const operation = createRetryOperation();

  return new Promise((resolve, reject) => {
    operation.attempt((currentAttempt) => {
      pool
        .query<WorkspaceDTO>(getWorkspaceQuery, getParameters)
        .then((res) => {
          if (res.rows.length > 0) {
            const workspace: Workspace = mapWorkspaceDTOToWorkspace(res.rows[0]);
            resolve(workspace);
          } else {
            resolve(null);
          }
        })
        .catch((err: Error) => {
          if (operation.retry(err)) {
            workspaceDbLogger.warn(`Attempt ${currentAttempt} failed. Retrying...`);
            return;
          }
          reject(operation.mainError()!);
        });
    });
  });
};

/**
 * Saves or updates a workspace in the database.
 * If a workspace with the given ID exists, it updates the access token and authorization code.
 * If it doesn't exist, it creates a new workspace entry.
 *
 * @function saveWorkspace
 * @param user The workspace object containing user details
 * @param user.workspaceId Unique identifier for the workspace
 * @param user.adminId ID of the workspace administrator
 * @param user.accessToken Access token for authentication
 * @param user.authorizationCode Authorization code for the workspace
 * @returns {Promise<string>} Returns a promise that resolves to the workspace ID
 * @throws Will throw an error if database operations fail after all retry attempts
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

  const operation = createRetryOperation();

  return new Promise((resolve, reject) => {
    operation.attempt((currentAttempt) => {
      pool
        .query<WorkspaceDTO>(saveWorkspaceQuery, saveParameters)
        .then((res) => {
          const workspaceId = res.rows[0].workspace_id;
          workspaceDbLogger.debug(`User saved with Workspace ID: ${workspaceId}`);
          resolve(workspaceId);
        })
        .catch((err: Error) => {
          workspaceDbLogger.error(
            `Error executing saveWorkspace query on attempt ${currentAttempt}: ${err}`
          );
          if (operation.retry(err)) {
            workspaceDbLogger.warn(
              `Attempt ${currentAttempt} to saveWorkspace failed. Retrying...`
            );
            return;
          }
          reject(operation.mainError()!);
        });
    });
  });
};

export { getWorkspace, saveWorkspace };
