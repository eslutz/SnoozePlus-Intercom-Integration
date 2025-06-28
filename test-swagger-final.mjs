import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'],
};

try {
  const specs = swaggerJsdoc(options);
  console.log('✅ Swagger specs generated successfully');
  console.log(
    `📊 Found ${Object.keys(specs.paths || {}).length} documented endpoints:`
  );

  Object.keys(specs.paths || {}).forEach((path) => {
    const methods = Object.keys(specs.paths[path]);
    console.log(`  ${path}: ${methods.join(', ').toUpperCase()}`);
  });

  console.log(
    `📋 Schema definitions: ${Object.keys(specs.components?.schemas || {}).length}`
  );
} catch (error) {
  console.error('❌ Error generating specs:', error.message);
}
