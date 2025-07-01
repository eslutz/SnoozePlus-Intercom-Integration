import 'reflect-metadata';
import { Container } from 'inversify';
import { Pool } from 'pg';
import { Logger } from 'winston';
import { TYPES } from './types.js';
import {
  IMessageService,
  IWorkspaceService,
  IIntercomService,
  ICryptoService,
} from './interfaces.js';

// Service implementations
import { MessageService } from '../services/message-service.js';
import { WorkspaceService } from '../services/workspace-service.js';
import { IntercomService } from '../services/intercom-service-new.js';
import { CryptoService } from '../services/crypto-service.js';
import { CanvasService } from '../services/canvas-service-new.js';

// Infrastructure
import pool from '../config/db-config.js';
import logger from '../config/logger-config.js';

/**
 * Dependency injection container for the application
 */
const container = new Container();

// Infrastructure bindings
container.bind<Pool>(TYPES.DatabasePool).toConstantValue(pool);
container.bind<Logger>(TYPES.Logger).toConstantValue(logger.child({ module: 'di-container' }));

// Service bindings
container.bind<IMessageService>(TYPES.MessageService)
  .to(MessageService)
  .inSingletonScope();

container.bind<IWorkspaceService>(TYPES.WorkspaceService)
  .to(WorkspaceService)
  .inSingletonScope();

container.bind<IIntercomService>(TYPES.IntercomService)
  .to(IntercomService)
  .inSingletonScope();

container.bind<ICryptoService>(TYPES.CryptoService)
  .to(CryptoService)
  .inSingletonScope();

container.bind(TYPES.CanvasService)
  .to(CanvasService)
  .inSingletonScope();

export { container };