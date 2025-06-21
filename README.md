# SnoozePlus-Intercom-Integration

Snooze+ is an inbox app for Intercom used to automate sending delayed responses to customers.

## Quick Start

1. **Install Dependencies**: `npm install`
2. **Set Up Environment**: Create `.env.local` file with required variables (see [docs/README.md](docs/README.md))
3. **Run Tests**: `npm test`
4. **Start Development**: `npm run dev`

For full setup and deployment instructions, see [docs/README.md](docs/README.md).

## Testing Framework

This project uses **Jest** with TypeScript support for comprehensive unit testing.

### Test Structure

```
src/
├── models/__tests__/           # Model transformation tests
├── utilities/__tests__/        # Utility function tests  
├── middleware/__tests__/       # Middleware logic tests
├── services/__tests__/         # Service layer tests
└── enums/__tests__/            # Enum validation tests
```

### What's Being Tested

**✅ Models (100% Coverage)**
- **message-model.test.ts**: Tests DTO to model mapping functions and authentication handling
- **workspace-model.test.ts**: Tests workspace DTO transformation logic

**✅ Enums (100% Coverage)**
- **signature-algorithm-enum.test.ts**: Validates HMAC algorithm constants used for signature verification

**✅ Utilities**
- **crypto-utility.test.ts**: Tests signature validation logic and encryption/decryption patterns
- **snooze-utility.test.ts**: Tests date calculations, Unix timestamp conversion, and object key processing
- **test-helpers.ts**: Common test utilities including Date mocking helpers (located in `src/__tests__/helpers/`)

**✅ Middleware**
- **validate-ip-middleware.test.ts**: Tests IP allowlist validation, string parsing, and request handling

**✅ Services**
- **heartbeat-service.test.ts**: Tests URL construction, Promise patterns, and HTTP method configuration

### How Tests Work

The testing strategy focuses on **pure function testing** to validate business logic without external dependencies:

1. **Isolated Logic Testing**: Each test validates core functionality using locally defined functions that mirror the actual implementation patterns
2. **Mocking Strategy**: Uses Jest mocks for external dependencies and custom helpers for complex mocking scenarios (like Date mocking)
3. **Edge Case Coverage**: Comprehensive testing of boundary conditions, error scenarios, and data type variations
4. **Pattern Validation**: Tests verify common patterns used throughout the application

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test-watch

# Run tests with coverage report
npm run test-coverage

# Run specific test file
npx jest src/models/__tests__/message-model.test.ts
```

### Coverage Configuration

- **Target**: 80% coverage across statements, branches, functions, and lines
- **Current**: 100% coverage achieved on core testable modules
- **Reports**: Generated in `coverage/` directory with HTML, LCOV, and text formats

### Test Utilities

The project includes test utilities in `src/__tests__/helpers/test-helpers.ts`:

- **DateMockHelper**: Simplifies Date mocking with setup/teardown functions
- **createDateMock()**: Factory function for consistent Date mocking across tests

Example usage:
```typescript
import { createDateMock } from '../../__tests__/helpers/test-helpers';

describe('date calculations', () => {
  const mockTime = new Date('2024-01-15T10:00:00Z').getTime();
  const dateMock = createDateMock(mockTime);

  beforeEach(() => dateMock.setup());
  afterEach(() => dateMock.teardown());

  it('should calculate with mocked date', () => {
    // Test with consistent mocked date
  });
});
```

### Coverage Reports

After running `npm run test-coverage`, view detailed reports:
- **Terminal**: Text summary with pass/fail status
- **HTML Report**: Open `coverage/lcov-report/index.html` in browser
- **LCOV**: Machine-readable format in `coverage/lcov.info`

## Architecture

- **Language**: TypeScript (98.6%)
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Testing**: Jest with ts-jest
- **External APIs**: Intercom API

See [docs/README.md](docs/README.md) for complete documentation.