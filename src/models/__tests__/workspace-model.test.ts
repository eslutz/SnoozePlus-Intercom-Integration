// Import the actual modules to get coverage
import { mapWorkspaceDTOToWorkspace, type Workspace } from '../workspace-model';
import type { WorkspaceDTO } from '../workspace-dto-model';

describe('Workspace Model', () => {
  describe('mapWorkspaceDTOToWorkspace', () => {
    it('should correctly map WorkspaceDTO to Workspace', () => {
      const dto: WorkspaceDTO = {
        workspace_id: 'test-workspace-123',
        admin_id: 456,
        access_token: 'access-token-abc',
        authorization_code: 'auth-code-xyz',
      };

      const result = mapWorkspaceDTOToWorkspace(dto);

      expect(result).toEqual({
        workspaceId: 'test-workspace-123',
        adminId: 456,
        accessToken: 'access-token-abc',
        authorizationCode: 'auth-code-xyz',
      });
    });

    it('should handle empty strings', () => {
      const dto: WorkspaceDTO = {
        workspace_id: '',
        admin_id: 0,
        access_token: '',
        authorization_code: '',
      };

      const result = mapWorkspaceDTOToWorkspace(dto);

      expect(result).toEqual({
        workspaceId: '',
        adminId: 0,
        accessToken: '',
        authorizationCode: '',
      });
    });

    it('should preserve all properties', () => {
      const dto: WorkspaceDTO = {
        workspace_id: 'ws-001',
        admin_id: 999,
        access_token: 'token-123',
        authorization_code: 'code-456',
      };

      const result = mapWorkspaceDTOToWorkspace(dto);

      expect(Object.keys(result)).toHaveLength(4);
      expect(result).toHaveProperty('workspaceId');
      expect(result).toHaveProperty('adminId');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('authorizationCode');
    });
  });
});