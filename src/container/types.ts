/**
 * Dependency injection type symbols for the application.
 * These symbols are used to identify and bind different services in the IoC container.
 */
export const TYPES = {
  // Database
  DatabasePool: Symbol.for('DatabasePool'),
  
  // Services
  MessageService: Symbol.for('MessageService'),
  IntercomService: Symbol.for('IntercomService'),
  WorkspaceService: Symbol.for('WorkspaceService'),
  CanvasService: Symbol.for('CanvasService'),
  
  // Utilities
  Logger: Symbol.for('Logger'),
  CryptoService: Symbol.for('CryptoService'),
  
  // External
  IntercomClient: Symbol.for('IntercomClient'),
} as const;