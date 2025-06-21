# API Documentation

## Overview

The SnoozePlus Intercom Integration provides a REST API for managing delayed message responses in Intercom conversations.

## Base URL

- **Production**: `https://your-domain.com`
- **Development**: `http://localhost:3000`

## Authentication

This application uses OAuth 2.0 with Intercom for authentication. Users must be authenticated with valid Intercom credentials.

## API Endpoints

### Health Check

#### GET /healthcheck

Check the health status of the application and its dependencies.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "intercom": "available"
  }
}
```

### Authentication

#### GET /auth/login

Initiate Intercom OAuth flow.

**Query Parameters:**
- `state` (optional): Return URL after authentication

#### GET /auth/callback

OAuth callback endpoint for Intercom.

#### GET /auth/failure

Authentication failure endpoint.

### Canvas Integration

#### POST /canvas/initialize

Initialize the Intercom canvas for a conversation.

**Request Body:**
```json
{
  "canvas_id": "string",
  "workspace_id": "string", 
  "admin_id": "string",
  "conversation_id": "string",
  "current_url": "string"
}
```

#### POST /canvas/submit

Submit scheduled messages for a conversation.

**Request Body:**
```json
{
  "canvas_id": "string",
  "workspace_id": "string",
  "admin_id": "string", 
  "conversation_id": "string",
  "current_url": "string",
  "input_values": {
    "message1": "First scheduled message",
    "date1": "2024-01-01T12:00:00Z",
    "message2": "Second scheduled message", 
    "date2": "2024-01-02T12:00:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Messages scheduled successfully",
  "scheduled_count": 2
}
```

### Webhooks

#### POST /webhooks/intercom

Receive webhooks from Intercom.

**Headers:**
- `X-Hub-Signature`: Webhook signature for verification

**Request Body:**
```json
{
  "type": "conversation.admin.replied",
  "data": {
    "item": {
      "type": "conversation",
      "id": "conversation_id",
      // ... other conversation data
    }
  },
  "created_at": 1640995200,
  "id": "webhook_id"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": true,
  "message": "Validation Error",
  "details": ["Field 'message' is required"],
  "status": 400,
  "requestId": "req_123456"
}
```

### 401 Unauthorized
```json
{
  "error": true,
  "message": "Authentication required",
  "status": 401,
  "requestId": "req_123456"
}
```

### 404 Not Found
```json
{
  "error": true,
  "message": "Route /invalid-endpoint not found",
  "status": 404,
  "requestId": "req_123456"
}
```

### 500 Internal Server Error
```json
{
  "error": true,
  "message": "Internal server error",
  "status": 500,
  "requestId": "req_123456"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit**: 100 requests per 15-minute window per IP
- **Headers**: Rate limit information is included in response headers
- **Reset**: Rate limits reset every 15 minutes

When rate limited, the API returns:

```json
{
  "error": true,
  "message": "Too many requests from this IP, please try again later.",
  "status": 429,
  "requestId": "req_123456"
}
```

## Security

### Headers

The API includes security headers via Helmet.js:

- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer
- X-Download-Options: noopen

### CORS

CORS is configured to allow requests from:
- Intercom app origins
- Development localhost (in non-production environments)

### Request Size Limits

- JSON payload limit: 10MB
- URL-encoded payload limit: 10MB

## Environment Variables

See [.env.sample](../docs/.env.sample) for required environment variables.

## Development

### Running Locally

1. Copy environment variables: `cp docs/.env.sample .env.local`
2. Fill in required values
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
# Development build
npm run dev-build

# Production build
npm run prod-build
```