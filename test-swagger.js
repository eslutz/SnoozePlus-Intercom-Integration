#!/usr/bin/env node

/**
 * Simple test script to verify Swagger configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import express from 'express';

// Basic swagger options for testing
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SnoozePlus Test API',
      version: '0.0.2',
      description: 'Test API documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

try {
  const specs = swaggerJsdoc(options);
  console.log('✅ Swagger specs generated successfully');
  console.log(
    `Found ${Object.keys(specs.paths || {}).length} documented endpoints`
  );

  // Test express setup
  const app = express();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

  const server = app.listen(3001, () => {
    console.log('✅ Test server running on http://localhost:3001');
    console.log('📖 Swagger docs available at: http://localhost:3001/api-docs');
    server.close();
  });
} catch (error) {
  console.error('❌ Error setting up Swagger:', error.message);
  process.exit(1);
}
