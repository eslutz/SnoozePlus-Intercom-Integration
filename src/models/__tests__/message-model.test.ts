import { mapMessageDTOToMessage, mapMessageDTOToMessageWithoutAuth } from '../message-model';
import type { MessageDTO } from '../message-dto-model';

describe('Message Model', () => {
  const mockDate = new Date('2024-01-15T10:30:00Z');
  
  const mockMessageDTO: MessageDTO = {
    id: 'msg-123',
    workspace_id: 'ws-456',
    conversation_id: 789,
    message: 'Hello, this is a test message',
    send_date: mockDate,
    close_conversation: false,
    archived: false,
  };

  describe('mapMessageDTOToMessage', () => {
    it('should correctly map MessageDTO to Message with authentication details', () => {
      const adminId = 123;
      const accessToken = 'test-access-token';

      const result = mapMessageDTOToMessage(mockMessageDTO, adminId, accessToken);

      expect(result).toEqual({
        id: 'msg-123',
        workspaceId: 'ws-456',
        conversationId: 789,
        message: 'Hello, this is a test message',
        sendDate: mockDate,
        closeConversation: false,
        archived: false,
        adminId: 123,
        accessToken: 'test-access-token',
      });
    });

    it('should handle different data types correctly', () => {
      const dtoWithDifferentValues: MessageDTO = {
        id: '',
        workspace_id: 'workspace-empty',
        conversation_id: 0,
        message: '',
        send_date: new Date('2023-01-01'),
        close_conversation: true,
        archived: true,
      };

      const result = mapMessageDTOToMessage(dtoWithDifferentValues, 999, 'token-999');

      expect(result.id).toBe('');
      expect(result.conversationId).toBe(0);
      expect(result.closeConversation).toBe(true);
      expect(result.archived).toBe(true);
      expect(result.adminId).toBe(999);
      expect(result.accessToken).toBe('token-999');
    });

    it('should preserve all properties including nested objects', () => {
      const result = mapMessageDTOToMessage(mockMessageDTO, 456, 'auth-token');

      expect(Object.keys(result)).toHaveLength(9);
      expect(result.sendDate).toBeInstanceOf(Date);
      expect(result.sendDate.getTime()).toBe(mockDate.getTime());
    });
  });

  describe('mapMessageDTOToMessageWithoutAuth', () => {
    it('should correctly map MessageDTO to Message without authentication details', () => {
      const result = mapMessageDTOToMessageWithoutAuth(mockMessageDTO);

      expect(result).toEqual({
        id: 'msg-123',
        workspaceId: 'ws-456',
        conversationId: 789,
        message: 'Hello, this is a test message',
        sendDate: mockDate,
        closeConversation: false,
        archived: false,
        adminId: 0,
        accessToken: '',
      });
    });

    it('should set default authentication values', () => {
      const result = mapMessageDTOToMessageWithoutAuth(mockMessageDTO);

      expect(result.adminId).toBe(0);
      expect(result.accessToken).toBe('');
    });

    it('should handle edge cases with boolean values', () => {
      const dtoWithTrueValues: MessageDTO = {
        id: 'test-id',
        workspace_id: 'test-ws',
        conversation_id: 1,
        message: 'test message',
        send_date: new Date(),
        close_conversation: true,
        archived: true,
      };

      const result = mapMessageDTOToMessageWithoutAuth(dtoWithTrueValues);

      expect(result.closeConversation).toBe(true);
      expect(result.archived).toBe(true);
      expect(result.adminId).toBe(0);
      expect(result.accessToken).toBe('');
    });
  });
});