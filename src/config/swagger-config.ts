/**
 * Swagger/OpenAPI configuration for SnoozePlus Intercom Integration API.
 *
 * This module configures swagger-jsdoc to generate OpenAPI documentation
 * from JSDoc comments in route files.
 *
 * @module swagger-config
 */

import swaggerJsdoc from 'swagger-jsdoc';
import config from './config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for proper path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SnoozePlus Intercom Integration API',
      version: '0.0.2',
      description:
        'Inbox integration for Intercom to automate delayed responses to customers.',
      contact: {
        name: 'Eric Slutz',
        email: 'eric@ericslutz.dev',
        url: 'https://www.ericslutz.dev',
      },
      license: {
        name: 'Private',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: process.env.BASE_URL ?? `https://api.snoozeplus.app`,
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'snoozeplus.sid',
        },
        intercomWebhook: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Hub-Signature',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error description',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
          required: ['error', 'message', 'statusCode'],
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'error'],
              description: 'Health status',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of the health check',
            },
            uptime: {
              type: 'number',
              description: 'Application uptime in seconds',
            },
            version: {
              type: 'string',
              description: 'Application version',
            },
          },
          required: ['status', 'timestamp'],
        },
        IntercomCanvas: {
          type: 'object',
          properties: {
            canvas_id: {
              type: 'string',
              description: 'Unique identifier for the canvas',
            },
            current_submitter: {
              type: 'object',
              description: 'Information about the current user',
            },
            input_values: {
              type: 'object',
              description: 'Form input values',
            },
          },
          required: ['canvas_id'],
        },
        SnoozeRequest: {
          type: 'object',
          properties: {
            conversationId: {
              type: 'string',
              description: 'Intercom conversation ID',
            },
            messageBody: {
              type: 'string',
              description: 'Message content to be sent',
            },
            delay: {
              type: 'integer',
              description: 'Delay in minutes before sending the message',
              minimum: 1,
            },
            adminId: {
              type: 'string',
              description: 'ID of the admin who created the snooze',
            },
          },
          required: ['conversationId', 'messageBody', 'delay', 'adminId'],
        },
        WebhookEvent: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: [
                'notification_event',
                'conversation.admin.replied',
                'conversation.admin.assigned',
                'conversation.user.replied',
              ],
              description: 'Type of webhook event',
            },
            id: {
              type: 'string',
              description: 'Unique identifier for the event',
            },
            created_at: {
              type: 'integer',
              description: 'Unix timestamp when the event was created',
            },
            data: {
              type: 'object',
              properties: {
                item: {
                  type: 'object',
                  description:
                    'The conversation or other object that triggered the event',
                },
              },
              required: ['item'],
            },
          },
          required: ['type', 'id', 'created_at', 'data'],
        },
        CanvasComponent: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['input', 'textarea', 'button', 'spacer', 'text'],
              description: 'Type of canvas component',
            },
            id: {
              type: 'string',
              description: 'Unique identifier for the component',
            },
            label: {
              type: 'string',
              description: 'Label text for the component',
            },
            placeholder: {
              type: 'string',
              description: 'Placeholder text for input components',
            },
            disabled: {
              type: 'boolean',
              description: 'Whether the component is disabled',
            },
          },
          required: ['type'],
        },
        CanvasContent: {
          type: 'object',
          properties: {
            components: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CanvasComponent',
              },
              description: 'List of canvas components',
            },
            disabled: {
              type: 'boolean',
              description: 'Whether the entire canvas is disabled',
            },
          },
          required: ['components'],
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the message',
            },
            workspaceId: {
              type: 'string',
              description:
                'The unique identifier of the workspace where the message belongs',
            },
            conversationId: {
              type: 'integer',
              description:
                'The unique identifier of the conversation this message is part of',
            },
            message: {
              type: 'string',
              description: 'The content of the message',
            },
            sendDate: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the message should be sent',
            },
            closeConversation: {
              type: 'boolean',
              description:
                'Flag indicating if this message should close the conversation',
            },
            archived: {
              type: 'boolean',
              description: 'Flag indicating if the message has been archived',
            },
            adminId: {
              type: 'integer',
              description: 'The unique identifier of the admin user',
            },
            accessToken: {
              type: 'string',
              description: 'The access token for authentication',
            },
          },
          required: [
            'id',
            'workspaceId',
            'conversationId',
            'message',
            'sendDate',
            'adminId',
            'accessToken',
          ],
        },
        Workspace: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'The unique identifier for the workspace',
            },
            adminId: {
              type: 'integer',
              description: "The administrator's unique identifier",
            },
            accessToken: {
              type: 'string',
              description:
                'The authentication token for accessing workspace resources',
            },
            authorizationCode: {
              type: 'string',
              description:
                'The authorization code used for initial authentication',
            },
          },
          required: [
            'workspaceId',
            'adminId',
            'accessToken',
            'authorizationCode',
          ],
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'OAuth authentication with Intercom',
      },
      {
        name: 'Health Check',
        description: 'Application health monitoring',
      },
      {
        name: 'Canvas',
        description: 'Intercom Canvas integration endpoints',
      },
      {
        name: 'Webhooks',
        description: 'Intercom webhook handlers',
      },
      {
        name: 'Snooze',
        description: 'Message snoozing functionality',
      },
    ],
  },
  apis: [
    join(__dirname, '../routes/*.js'),
    join(__dirname, '../controllers/*.js'),
    join(__dirname, '../models/*.js'),
  ],
};

const specs = swaggerJsdoc(options);

export default specs;
