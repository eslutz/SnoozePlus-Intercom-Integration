/**
 * Test utility functions for common mocking patterns
 */

/**
 * Helper class for mocking Date in tests
 */
export class DateMockHelper {
  private originalDate: typeof Date;

  constructor() {
    this.originalDate = global.Date;
  }

  /**
   * Mock Date constructor to return a fixed timestamp
   * @param mockTimestamp - The timestamp to use as "current time"
   */
  mockDate(mockTimestamp: number): void {
    const originalDate = this.originalDate;
    
    global.Date = jest.fn((dateString?: string) => {
      if (dateString) {
        return new originalDate(dateString);
      }
      return new originalDate(mockTimestamp);
    }) as any;
    
    global.Date.now = jest.fn(() => mockTimestamp);
    Object.setPrototypeOf(global.Date, originalDate);
  }

  /**
   * Restore the original Date constructor
   */
  restoreDate(): void {
    global.Date = this.originalDate;
  }
}

/**
 * Creates a Date mock helper and returns setup/teardown functions
 * @param mockTimestamp - The timestamp to use as "current time"
 * @returns Object with setup and teardown functions
 */
export function createDateMock(mockTimestamp: number) {
  const helper = new DateMockHelper();
  
  return {
    setup: () => helper.mockDate(mockTimestamp),
    teardown: () => helper.restoreDate(),
  };
}