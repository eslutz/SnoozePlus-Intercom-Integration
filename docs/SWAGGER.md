# Swagger API Documentation Implementation

## Overview

Successfully implemented Swagger/OpenAPI documentation for the SnoozePlus Intercom Integration API using:

- **swagger-ui-express**: Serves the interactive Swagger UI
- **swagger-jsdoc**: Generates OpenAPI specs from JSDoc comments in code

## Features Added

### 1. Swagger Configuration (`src/config/swagger-config.ts`)

- OpenAPI 3.0 specification
- Security schemes for different authentication types
- Reusable schema components
- Tagged endpoints for better organization

### 2. Interactive Documentation

- Available at `/api-docs` in development mode
- Disabled in production for security
- Custom styling and branding

### 3. Documented Endpoints

#### Authentication (`/auth`)

- `GET /auth/intercom` - Initiate OAuth login
- `GET /auth/intercom/callback` - OAuth callback handler
- `GET /auth/failure` - Authentication failure page
- `GET /auth/logout` - User logout

#### Health Checks (`/healthcheck`)

- `GET /healthcheck` - Basic health status
- `GET /healthcheck/db-healthcheck` - Database connectivity
- `POST /healthcheck/installation-healthcheck` - Installation validation

#### Canvas Integration (`/submit`)

- `POST /submit` - Process Intercom Canvas form submissions

#### Canvas Initialization (`/initialize`)

- `POST /initialize` - Initialize Intercom Canvas Kit component

#### Webhooks (`/webhook`)

- `HEAD /webhook` - Validate webhook configuration
- `POST /webhook` - Receive and process webhook events

### 4. Schema Definitions

- `Error` - Standardized error responses
- `HealthCheck` - Health status responses
- `IntercomCanvas` - Canvas request structure
- `SnoozeRequest` - Snooze functionality data
- `WebhookEvent` - Intercom webhook event structure
- `CanvasComponent` - Individual canvas form components
- `CanvasContent` - Canvas content with components
- `Message` - Message data with authentication details
- `Workspace` - Workspace configuration and tokens

### 5. Security Documentation

- Bearer token authentication
- Session-based authentication
- Intercom webhook signature validation

## Usage

### Development

```bash
npm run dev
```

Then visit: `http://localhost:8706/api-docs`

### Adding Documentation to New Routes

```typescript
/**
 * @swagger
 * /your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [YourTag]
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
router.get('/your-endpoint', controller.yourMethod);
```

## Benefits

1. **Interactive Testing**: Test API endpoints directly from the documentation
2. **Auto-generated**: Documentation stays in sync with code changes
3. **Standardized**: OpenAPI 3.0 standard for maximum compatibility
4. **Developer Experience**: Easy to understand and use API documentation
5. **Integration Ready**: Can be used for client code generation and testing

## Security

- Documentation is only available in development mode
- Production deployment automatically disables the `/api-docs` endpoint
- Webhook signature validation documented for security awareness

## Next Steps

The documentation is now complete for all current endpoints! Additional enhancements you could consider:

1. **Enhanced Examples**: Add more realistic request/response examples
2. **Error Scenarios**: Document specific error conditions and responses
3. **Authentication Flow**: Add step-by-step authentication examples
4. **Rate Limiting**: Document rate limiting policies
5. **Webhook Events**: Add examples for different webhook event types
6. **Testing Guide**: Create a guide for testing the API using Swagger UI

## Troubleshooting Swagger UI Loading Issues

If you see a blank page or Swagger UI does not load, try the following steps:

1. **Use Google Chrome or Firefox**
   - Some browsers (like Safari) may enforce strict HTTPS or caching policies that interfere with local Swagger UI loading.
   - Chrome and Firefox are generally more forgiving for local development.

2. **Clear HSTS Settings (Safari/Chrome/Firefox)**
   - If you ever visited `https://localhost` or your local API over HTTPS, your browser may force HTTPS for all future requests (HSTS).
   - This can cause blank pages if your server is only running on HTTP.
   - To clear HSTS in Safari:
     - Go to Safari > Preferences > Privacy > Manage Website Data, search for `localhost`, and remove it.
     - Or, clear all website data.
   - In Chrome, go to `chrome://net-internals/#hsts` and delete the `localhost` policy.

3. **Force HTTP**
   - Always use `http://localhost:8706/api-docs` (not `https://...`) for local development.
   - If you are redirected to HTTPS, clear HSTS as above and try again.

4. **Check Browser Console for Errors**
   - Open the browser dev tools (F12 or Cmd+Opt+I) and look for red errors in the Console tab.
   - CSP (Content Security Policy) or mixed content errors may indicate a configuration issue.

5. **Check the Swagger Spec Directly**
   - Add a route in your app: `app.get('/swagger-test', (_req, res) => res.json(swaggerSpecs));`
   - Visit `http://localhost:8706/swagger-test` to verify the OpenAPI JSON loads.
   - If this is empty, check your `apis` paths in `swagger-config.ts`.

6. **Try Incognito/Private Window**
   - Sometimes browser cache or service workers interfere. Try an incognito/private window.

7. **Try a Different Browser**
   - If all else fails, test in Chrome or Firefox to isolate if the issue is browser-specific.

If you continue to have issues, check your browser's documentation for clearing HSTS or site data, and ensure your Express server is running on HTTP for local development.
