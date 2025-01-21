import pool from '../config/db-config.js';
import logger from '../config/logger-config.js';
import createRetryOperation from '../config/retry-config.js';
import { WorkspaceDTO } from '../models/workspace-dto-model.js';
import {
  Workspace,
  mapWorkspaceDTOToWorkspace,
} from '../models/workspace-model.js';

const userDbLogger = logger.child({ module: 'user-db-service' });

/**
 * Retrieves a user from the database based on the workspace ID.
 *
 * @param workspaceId - The unique identifier of the workspace to search for
 * @returns A Promise that resolves to either a User object containing the user's data or null if no user is found
 * @throws {Error} If the database operation fails after all retry attempts
 */

const getUser = async (workspaceId: string): Promise<Workspace | null> => {
  const getUserQuery = `
    SELECT workspace_id, admin_id, access_token
    FROM users
    WHERE workspace_id = $1;
  `;
  const getParameters = [workspaceId];

  const operation = createRetryOperation();

  return new Promise((resolve, reject) => {
    operation.attempt((currentAttempt) => {
      pool
        .query<WorkspaceDTO>(getUserQuery, getParameters)
        .then((res) => {
          if (res.rows.length > 0) {
            const user: Workspace = mapWorkspaceDTOToWorkspace(res.rows[0]);
            resolve(user);
          } else {
            resolve(null);
          }
        })
        .catch((err: Error) => {
          if (operation.retry(err)) {
            userDbLogger.warn(`Attempt ${currentAttempt} failed. Retrying...`);
            return;
          }
          reject(operation.mainError()!);
        });
    });
  });
};

const saveUser = async (user: Workspace): Promise<string> => {
  const saveUserQuery = `
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
        .query<WorkspaceDTO>(saveUserQuery, saveParameters)
        .then((res) => {
          const workspaceId = res.rows[0].workspace_id;
          userDbLogger.debug(`User saved with Workspace ID: ${workspaceId}`);
          resolve(workspaceId);
        })
        .catch((err: Error) => {
          userDbLogger.error(
            `Error executing saveUser query on attempt ${currentAttempt}: ${err}`
          );
          if (operation.retry(err)) {
            userDbLogger.warn(
              `Attempt ${currentAttempt} to saveUser failed. Retrying...`
            );
            return;
          }
          reject(operation.mainError()!);
        });
    });
  });
};

export { getUser, saveUser };
