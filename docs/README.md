# SnoozePlus-Intercom-Integration

> [!NOTE]
> This project is a work in progress and not yet in a usable state.

Snooze+ is an inbox app for Intercom used to automate sending delayed responses to customers.

## Architecture

The application is built using a modern, resilient architecture that provides high reliability and testability through dependency injection and circuit breaker patterns.

### Dependency Injection

The application uses [Inversify](https://inversify.io/) as a comprehensive dependency injection (DI) container to manage service dependencies and improve testability:

**Key Benefits:**

- **Loose Coupling**: Services are decoupled through interface-based design
- **Testability**: All dependencies can be easily mocked for unit testing
- **Maintainability**: Clear separation of concerns and SOLID principles
- **Type Safety**: Full TypeScript support with compile-time interface verification

**Core Components:**

- **Container**: Centralized DI container configuration (`src/container/`)
- **Interfaces**: Type-safe service contracts (`src/container/interfaces.ts`)
- **Injectable Services**: Class-based services using `@injectable()` decorator
- **Type Definitions**: Service identifier constants (`src/container/types.ts`)

**Example Usage:**

```typescript
@injectable()
export class SubmitController {
  constructor(
    @inject(TYPES.MessageService) private messageService: IMessageService,
    @inject(TYPES.IntercomService) private intercomService: IIntercomService
  ) {}
}
```

### Circuit Breaker Protection

External API calls are protected by a circuit breaker pattern to prevent cascade failures and ensure system resilience:

**Circuit States:**

- **CLOSED**: Normal operation, requests flow through
- **OPEN**: Circuit trips after failure threshold, requests fail fast
- **HALF_OPEN**: Testing recovery, limited requests allowed

**Configuration:**

- **Failure Threshold**: 5 failures trigger circuit opening
- **Timeout**: 10 second timeout per operation
- **Reset Timeout**: 60 seconds before attempting recovery
- **Monitoring Period**: 30 second health check window

**Protected Operations:**

- Intercom API message sending
- Conversation management
- User workspace operations
- All external service calls

The circuit breaker automatically handles:

- Timeout protection for slow API responses
- Exponential backoff and retry logic
- Automatic service recovery detection
- Operational monitoring and logging

## Table of Contents

- [Architecture](#architecture)
  - [Dependency Injection](#dependency-injection)
  - [Circuit Breaker Protection](#circuit-breaker-protection)
- [Local Development](#local-development)
- [Development Tools](#development-tools)
  - [Code Quality](#code-quality)
  - [Debugging](#debugging)
  - [Testing](#testing)
- [Database](#database)
  - [Setup](#setup)
  - [Migrations](#migrations)
  - [Schema Overview](#schema-overview)
  - [Database Access](#database-access)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Steps To Deploy Application](#steps-to-deploy-application)
- [Application Hosting - Opalstack Node.js](#application-hosting---opalstack-nodejs)
  - [Controlling the app](#controlling-the-app)
    - [Starting the app](#starting-the-app)
    - [Stopping the app](#stopping-the-app)
- [Authentication](#authentication)
- [Required Environment Variables](#required-environment-variables)
- [Tools and Dependencies](#tools-and-dependencies)
- [Docker & Dev Container Usage](./DOCKER.md)

## Local Development

1. **Install Node.js and npm**: Ensure that Node.js (version 20.x or higher) and npm (version 6.x or higher) are installed on your machine [download Node.js](https://nodejs.org/)
1. **Clone the Repository**: Clone this repo to your machine:
1. **Navigate to the Project Directory**: Navigate to the root directory of the application:
1. **Create Environment Variables File**: Create an `.env.local` file with the [required environment variables](#required-environment-variables)
1. **Install Dependencies**: Run the command `npm install` to install dependencies
1. **Setup Database**: [Setup](#setup) a PostgreSQL database and run the [migrations](#migrations)
1. **Start the Application**: Run the command `npm run dev` to start the application
1. **Access the Application**: Access the application at `http://localhost:8706`
1. **Intercom**: Ensure that you have an Intercom account with an [Inbox App](https://developers.intercom.com/docs/build-an-integration/getting-started/build-an-app-for-your-inbox) created

### Running Locally

1. Copy environment variables: `cp docs/.env.sample .env.local`
1. Fill in required values
1. Install dependencies: `npm install`
1. Start development server: `npm run dev`

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

## Development Tools

### Code Quality

The following tools are used to maintain code quality:

- [ESLint](https://eslint.org) for code linting
- [Prettier](https://prettier.io) for code formatting
- [TypeScript](https://www.typescriptlang.org) for static type checking

### Debugging

VS Code launch configurations are provided for:

- Debugging the application
- Debugging tests

### Testing framework

[Jest](https://jestjs.io) is configured for testing with:

- TypeScript support
- Environment variables from .env.test
- Watch mode for development
- **Dependency Injection Testing**: Services can be easily mocked using the DI container
- **Circuit Breaker Testing**: Comprehensive tests for all circuit states and failure scenarios
- **Integration Testing**: Full system testing with injectable mock services

**Testing with Dependency Injection:**

```typescript
// Easy service mocking with DI container
const mockMessageService: IMessageService = {
  saveMessages: jest.fn().mockResolvedValue(['id1', 'id2']),
  getMessages: jest.fn().mockResolvedValue([]),
};
container
  .bind<IMessageService>(TYPES.MessageService)
  .toConstantValue(mockMessageService);
```

The architecture enables complete isolation testing where any service can be mocked without affecting the core business logic.

## Database

The application uses **PostgreSQL** as its relational database to store user and message data.

### Setup

1. **Install PostgreSQL**: Ensure that PostgreSQL is installed on your system ([download PostgreSQL](https://www.postgresql.org/download/))
1. **Create a Database**: Create a new PostgreSQL database for the application
1. **Configure Environment Variables**: Update your .env file with your database connection details
1. **Run Migrations**: Apply the database migrations to create the necessary tables

### Migrations

The application uses [Flyway](https://www.red-gate.com/products/flyway/community/) for database migrations. Migration scripts are located in the `database/migrations/` directory. To apply migrations, navigate to the `database/` directory and run:

```sh
cd database
flyway migrate
```

### Schema Overview

The database consists of two main tables:

- `users`: Stores user authentication and authorization data
- `messages`: Stores scheduled messages to be sent to customers

### Database Access

Database interactions are handled using the [pg](https://www.npmjs.com/package/pg) library.

## Project Structure

```text
database/
  migrations/        # Database migrations
  schema-model/      # Database schema models
scripts/             # Deployment scripts
src/
  config/            # Configuration files
  container/         # Dependency injection container setup
    container.ts     # Main DI container configuration
    interfaces.ts    # Service interface definitions
    types.ts         # Service type identifiers
  controllers/       # Controllers for handling HTTP requests
  middleware/        # Custom middleware functions
  models/            # Database models or schemas
  routes/            # Route definitions
  services/          # Business logic and data access logic (injectable services)
  types/             # TypeScript type definitions
  utilities/         # Utility functions and helpers
    circuit-breaker.ts # Circuit breaker implementation
  app.ts             # Main application file
tests/
  integration/       # Integration tests with DI container
  services/          # Service unit tests with mocking
  utilities/         # Utility function tests (circuit breaker, etc.)
```

## Scripts

| Script               | Description                               |
| -------------------- | ----------------------------------------- |
| `npm start`          | Start the application                     |
| `npm run dev`        | Start the application in development mode |
| `npm run type-check` | Check for type errors                     |
| `npm run dev-build`  | Build for development                     |
| `npm run prod-build` | Build for production with tests           |
| `npm run copy-files` | Copy additional files to dist             |
| `npm run lint`       | Run linter and fix issues                 |
| `npm run test`       | Run tests in watch mode                   |

## Steps To Deploy Application

1. Clone this repo to your local machine
1. Navigate to the root directory of the application
1. Create a **.env.production** file with the [required environment variables](#required-environment-variables)
1. Run the command `npm run prod-build` to get the application files ready for deployment
1. Start a SSH session with the server
1. On the server, run the [stop script](#stopping-the-app)
1. Start a SFTP session with the server
1. Upload files from your local machine to the server
   - Local file path: `./SnoozePlus-Intercom-Integration/dist/`
   - Remote server path: `/home/activelabs/apps/snoozeplus/`
1. Go back to the SSH session and on the server, run the [start script](#starting-the-app)

## Application Hosting - Opalstack Node.js

Application server: `opal7.opalstack.com`
Database server: `opal7.opalstack.com`

## Controlling the app

The app can be controlled using the start and stop scripts. Each script takes a single argument for the app name (e.g. `snoozeplus_dev`, `snoozeplus`). If no argument is passed the default app name is `snoozeplus`.

1. Navigate to the directory `~/apps/snoozeplus/`
1. Run the start or stop script with the app name

### Starting the app

To start the app, run:

```sh
./start [app_name]
```

### Stopping the app

Stop the app by running:

```sh
./stop [app_name]
```

## Authentication

The application uses OAuth 2.0 for authentication with Intercom utilizing [Passport](https://www.passportjs.org) with the [Intercom Strategy](https://www.passportjs.org/packages/passport-intercom/). Here is an overview of how the authentication process works:

1. **Login:** When a user attempts to access a protected route, they are redirected to the Intercom login page
1. **Authorization:** The user logs in to their Intercom account and authorizes the application to access their Intercom data
1. **Callback:** After authorization, Intercom redirects the user back to the application with an authorization code
1. **Token Exchange:** The application exchanges the authorization code for an access token
1. **Session Management:** The access token is encrypted and stored in the user's session, with the session being managed using [express-session](https://expressjs.com/en/resources/middleware/session.html)
1. **Authenticated Requests:** The access token is used to make authenticated requests to the Intercom API on behalf of the user

### IP Validation

The application validates incoming requests to ensure they originate from allowed [Intercom Canvas Kit IP addresses](https://developers.intercom.com/docs/canvas-kit#what-ip-addresses-does-intercom-send-canvas-kit-requests-from) or [Intercom Webhook Notification IP addresses](https://developers.intercom.com/docs/webhooks/webhook-notifications#ensuring-delivery-behind-a-firewall). The allowed IP addresses are specified in the `IP_ALLOWLIST` environment variable, which should be a comma-separated list of IP addresses.

### Signature Validation

The application validates the signatures of incoming requests to ensure they are sent by Intercom. This is done using the `X-Body-Signature` header for [Canvas Kit requests](https://developers.intercom.com/docs/canvas-kit#signing-notifications) and the `X-Hub-Signature` header for [Webhook Notification requests](https://developers.intercom.com/docs/references/webhooks/webhook-models#signed-notifications).

## Required Environment Variables

The environment variables for this application can be found in the **[.env.sample](.env.sample)** file.

All of the environment variables are required for the application to run correctly. Note that _NODE_ENV_ must be set to _production_ in the **.env.production** file.

## Tools and Dependencies

The application uses the following tools:

- [Node.js](https://nodejs.org/): JavaScript runtime environment
- [TypeScript](https://www.typescriptlang.org/): Typed superset of JavaScript that compiles to plain JavaScript
- [Inversify](https://inversify.io/): Powerful and lightweight inversion of control container for JavaScript & Node.js apps
- [ESLint](https://eslint.org/): Linting utility for JavaScript and TypeScript
- [Prettier](https://prettier.io/): Opinionated code formatter
- [Jest](https://jestjs.io/): JavaScript testing framework
- [PostgreSQL](https://www.postgresql.org/): Open-source relational database
- [Flyway](https://www.red-gate.com/products/flyway/community/): Database schema migration and versioning tool

The application leverages the following packages:

**Core Framework:**

- [Express](https://expressjs.com/): Web framework for Node.js
- [Inversify](https://inversify.io/): Dependency injection container
- [Reflect Metadata](https://www.npmjs.com/package/reflect-metadata): Metadata reflection API for decorators

**Authentication & Security:**

- [Passport](https://www.passportjs.org/): Authentication middleware for Node.js
- [Passport-Intercom](https://www.passportjs.org/packages/passport-intercom/): Intercom authentication strategy for Passport
- [Express Session](https://expressjs.com/en/resources/middleware/session.html): Session middleware for Express
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html): Provides cryptographic functionality

**External Service Integration:**

- [Node Fetch](https://www.npmjs.com/package/node-fetch): A light-weight module that brings Fetch API to Node.js
- [Retry](https://www.npmjs.com/package/retry): Abstraction for exponential and custom retry strategies

**Database & Data Management:**

- [pg](https://www.npmjs.com/package/pg): PostgreSQL client for Node.js

**Logging & Monitoring:**

- [Morgan](https://www.npmjs.com/package/morgan): HTTP request logger middleware for Node.js
- [Winston](https://www.npmjs.com/package/winston): Logging library for Node.js
- [Logtail](https://www.npmjs.com/package/@logtail/node): Cloud-based logging solution

**Task Scheduling:**

- [Node Schedule](https://www.npmjs.com/package/node-schedule): Cron-like and not-cron-like job scheduler for Node.js

## Postman Collection

See [POSTMAN.md](./POSTMAN.md) for instructions on importing and using the Postman collection to test all API endpoints.
