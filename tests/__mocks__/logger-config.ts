// Mock logger that doesn't log to external services during testing
interface MockLogger {
  error: jest.MockedFunction<(...args: unknown[]) => unknown>;
  warn: jest.MockedFunction<(...args: unknown[]) => unknown>;
  info: jest.MockedFunction<(...args: unknown[]) => unknown>;
  http: jest.MockedFunction<(...args: unknown[]) => unknown>;
  debug: jest.MockedFunction<(...args: unknown[]) => unknown>;
  child: jest.MockedFunction<(options?: unknown) => MockLogger>;
  profile: jest.MockedFunction<(id: string, options?: unknown) => unknown>;
  on: jest.MockedFunction<(event: string, callback: () => void) => void>;
  close: jest.MockedFunction<() => void>;
  end: jest.MockedFunction<() => void>;
}

const mockChild: MockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  debug: jest.fn(),
  child: jest.fn((): MockLogger => mockChild),
  profile: jest.fn(),
  on: jest.fn(),
  close: jest.fn(),
  end: jest.fn(),
};

// Mock the Logtail object to prevent open connections
class MockLogtail {
  flush = jest.fn().mockResolvedValue(undefined);
}

// Export both the logger and logtail mocks
export const logtail = new MockLogtail();
export default mockChild;
