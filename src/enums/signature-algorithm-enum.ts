/**
 * Represents the HMAC algorithms used for signature validation.
 *
 * @enum {string}
 * @readonly
 * @property {string} WEBHOOK SHA-1 algorithm used for webhook signatures
 * @property {string} CANVAS SHA-256 algorithm used for canvas signatures
 */
enum SignatureAlgorithm {
  WEBHOOK = 'sha1',
  CANVAS = 'sha256',
}

export default SignatureAlgorithm;
