import { injectable, inject } from 'inversify';
import { Pool } from 'pg';
import { Logger } from 'winston';
import { TYPES } from '../container/types.js';
import type { IWorkspaceService } from '../container/interfaces.js';
import { retryAsyncOperation } from '../utilities/retry-utility.js';
import { WorkspaceDTO } from '../models/workspace-dto-model.js';
import {
  Workspace,
  mapWorkspaceDTOToWorkspace,
} from '../models/workspace-model.js';
import { AppError } from '../middleware/error-middleware.js';

/**
 * Injectable workspace service for database operations
 */
@injectable()
export class WorkspaceService implements IWorkspaceService {
  constructor(
    @inject(TYPES.DatabasePool) private pool: Pool,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * Retrieves a workspace from the database based on the workspace ID.
   *
   * @param workspaceId - The unique identifier of the workspace to search for
   * @returns Promise that resolves to either a Workspace object or null if not found
   * @throws AppError|Error if the database operation fails after all retry attempts
   */
  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    this.logger.debug('Getting workspace', { workspaceId });
    
    const getWorkspaceQuery = `
      SELECT workspace_id, admin_id, access_token
      FROM users
      WHERE workspace_id = $1;
    `;
    const getParameters = [workspaceId];

    return retryAsyncOperation<Workspace | null>(async () => {
      const res = await this.pool.query<WorkspaceDTO>(
        getWorkspaceQuery,
        getParameters
      );
      if (res.rows.length > 0) {
        const workspaceDto = res.rows[0];
        if (!workspaceDto) {
          throw new AppError('Workspace data is undefined', 500);
        }
        const workspace = mapWorkspaceDTOToWorkspace(workspaceDto);
        this.logger.debug('Workspace retrieved successfully', { 
          workspaceId: workspace.workspaceId 
        });
        return workspace;
      }
      this.logger.debug('Workspace not found', { workspaceId });
      return null;
    }, 'getWorkspace');
  }

  /**
   * Saves or updates a workspace in the database.
   * If a workspace with the given ID exists, it updates the access token and authorization code.
   * If it doesn't exist, it creates a new workspace entry.
   *
   * @param workspace - The workspace object containing user details
   * @returns Promise that resolves to the workspace ID
   * @throws AppError|Error if database operations fail after all retry attempts
   */
  async saveWorkspace(workspace: Workspace): Promise<string> {
    this.logger.info('Saving workspace', { 
      workspaceId: workspace.workspaceId, 
      adminId: workspace.adminId 
    });
    
    const saveWorkspaceQuery = `
      INSERT INTO users (workspace_id, admin_id, access_token, authorization_code)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (workspace_id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        authorization_code = EXCLUDED.authorization_code
      RETURNING workspace_id;
    `;
    const saveParameters = [
      workspace.workspaceId,
      workspace.adminId,
      workspace.accessToken,
      workspace.authorizationCode,
    ];

    return retryAsyncOperation<string>(async () => {
      const res = await this.pool.query<WorkspaceDTO>(
        saveWorkspaceQuery,
        saveParameters
      );
      const workspaceId = res.rows[0]?.workspace_id;
      if (workspaceId === undefined) {
        throw new AppError(
          'Save workspace query returned undefined workspace_id',
          500
        );
      }
      this.logger.info('Workspace saved successfully', { workspaceId });
      return workspaceId;
    }, 'saveWorkspace');
  }
}