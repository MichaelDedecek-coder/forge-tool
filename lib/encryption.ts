import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Token Encryption Utility
 * Uses AES-256-GCM for secure token storage
 *
 * CRITICAL: ENCRYPTION_KEY must be set in environment variables
 * Generate with: openssl rand -base64 32
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment
 * Throws if not configured
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY not configured in environment variables');
  }

  // Convert base64 key to buffer
  const keyBuffer = Buffer.from(key, 'base64');

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Invalid encryption key length. Expected ${KEY_LENGTH} bytes, got ${keyBuffer.length}`);
  }

  return keyBuffer;
}

/**
 * Encrypt sensitive text (tokens)
 * Format: iv:authTag:encryptedData (all base64)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encryptedData
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt encrypted text back to plaintext
 * Expects format: iv:authTag:encryptedData
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty string');
  }

  const parts = encryptedData.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected iv:authTag:encryptedData');
  }

  const [ivBase64, authTagBase64, encrypted] = parts;

  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if a string appears to be encrypted
 * (has the format iv:authTag:encryptedData)
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  const parts = data.split(':');
  return parts.length === 3;
}
