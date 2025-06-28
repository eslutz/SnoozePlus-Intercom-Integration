# Copilot Instructions for SnoozePlus-Intercom-Integration

## Project Overview

This is a TypeScript-based Inbox integration for Intercom that automates delayed responses to customers. The project allows support teams to schedule automated responses after a specified delay period.

## Technology Stack

- **Language**: TypeScript (98.6%)
- **Runtime**: Node.js
- **Framework**: Express.js for API server
- **External Services**: Intercom API
- **Testing Framework**: Jest
- **Package Manager**: npm

## Key Dependencies

- `@intercom/api`: Official Intercom API client
- `express`: Web framework
- `dotenv`: Environment variable management
- `jest`: Testing framework
- TypeScript and related tooling

## Project Structure

- `/api`: API endpoints and webhook handlers
- `/src`: Core application logic
  - `intercom.ts`: Intercom API integration and client setup
- `/types`: TypeScript type definitions
- Configuration files: `tsconfig.json`, `.env.example`

## Core Functionality

1. **Webhook Processing**: Handles Intercom webhooks for conversation events
2. **Delayed Response Scheduling**: Manages automated response timing
3. **Intercom Integration**: Sends messages and manages conversation states

## Environment Variables

The project requires environment variables defined in `.env.example`:

- `INTERCOM_ACCESS_TOKEN`: Intercom API authentication
- Additional environment variables as specified in the .env.example file

## Development Guidelines

- Use TypeScript for all new code
- Follow existing patterns for error handling
- Test webhook integrations using Intercom's webhook testing tools
- Ensure proper TypeScript typing throughout
- Write unit tests using Jest for all new functionality

## Key Components

- Webhook handler for processing Intercom events
- Intercom client configuration and API integration
- Response scheduling logic

## Testing Considerations

- **Framework**: Use Jest for all unit and integration tests
- Test webhook signature verification if implemented
- Verify scheduled messages are sent at correct times
- Test Intercom API integration
- Ensure proper error handling for API failures
- Mock external API calls in unit tests
- Aim for high test coverage on critical business logic

## Security Notes

- Use environment variables for all sensitive data (API tokens)
- Implement proper webhook verification
- Never expose API credentials in code

## Formatting and Style Guidelines

- Always follow the formatting and style conventions defined in the project's `.editorconfig` and `.prettierrc` files. This includes indentation, line endings, quote style, trailing commas, and other code style rules.
- **Always use the `.js` extension on all local (relative) import paths in TypeScript source files.** This is required for ES module compatibility in Node.js and is the established convention for this project. For example:
  ```typescript
  import myModule from './my-module.js';
  ```
- Do not omit the `.js` extension for local imports, even when importing TypeScript files. The extension must match the compiled JavaScript output for ES modules.
- Automatically fix all markdown linting errors.
