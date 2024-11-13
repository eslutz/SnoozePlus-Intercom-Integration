import crypto from 'crypto';

const algorithm = process.env.ENCRYPTION_ALGORITHM;
if (!algorithm) {
  throw new Error('ENCRYPTION_ALGORITHM cannot be found!');
}
const key = process.env.ENCRYPTION_KEY;
if (!key) {
  throw new Error('ENCRYPTION_KEY cannot be found!');
}

const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decrypt = (encryptedText: string): string => {
  const [ivHex, encrypted] = encryptedText.split(':');
  const cipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  let decrypted = cipher.update(encrypted, 'hex', 'utf8');
  decrypted += cipher.final('utf8');
  return decrypted;
};

export { encrypt, decrypt };
