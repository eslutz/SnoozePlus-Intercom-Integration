// Test importing the actual enum module
const SignatureAlgorithm = require('../signature-algorithm-enum');

describe('SignatureAlgorithm enum - actual import', () => {
  it('should have correct HMAC algorithm values', () => {
    expect(SignatureAlgorithm.default.WEBHOOK).toBe('sha1');
    expect(SignatureAlgorithm.default.CANVAS).toBe('sha256');
  });
  
  it('should be an object with two properties', () => {
    expect(typeof SignatureAlgorithm.default).toBe('object');
    expect(Object.keys(SignatureAlgorithm.default)).toHaveLength(2);
    expect(Object.keys(SignatureAlgorithm.default)).toEqual(['WEBHOOK', 'CANVAS']);
  });
});

describe('SignatureAlgorithm enum', () => {
  it('should have correct HMAC algorithm values', () => {
    // Import the actual enum to get coverage
    const SignatureAlgorithm = require('../../enums/signature-algorithm-enum');
    
    expect(SignatureAlgorithm.default.WEBHOOK).toBe('sha1');
    expect(SignatureAlgorithm.default.CANVAS).toBe('sha256');
  });
  
  it('should be an object with two properties', () => {
    const SignatureAlgorithm = require('../../enums/signature-algorithm-enum');
    
    expect(typeof SignatureAlgorithm.default).toBe('object');
    expect(Object.keys(SignatureAlgorithm.default)).toHaveLength(2);
    expect(Object.keys(SignatureAlgorithm.default)).toEqual(['WEBHOOK', 'CANVAS']);
  });
});