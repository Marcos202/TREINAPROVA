import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * AES-256-GCM symmetric encryption for API keys.
 *
 * Master key lives in process.env.SYSTEM_MASTER_KEY (64 hex chars = 32 bytes).
 * Generate with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Stored format: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 * The database stores only this opaque string — it cannot decrypt without the env key.
 */

const ALGORITHM = 'aes-256-gcm';

function getMasterKey(): Buffer {
  const hex = process.env.SYSTEM_MASTER_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'SYSTEM_MASTER_KEY env var is missing or invalid. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, 'hex');
}

export function encryptApiKey(plainText: string): string {
  const key = getMasterKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptApiKey(stored: string): string {
  const parts = stored.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted key format.');
  const [ivHex, tagHex, dataHex] = parts;
  const key = getMasterKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

/** Mask an API key for safe display: shows last 4 chars, rest dotted. */
export function maskApiKey(plain: string): string {
  if (plain.length <= 4) return '••••';
  const prefix = plain.slice(0, plain.lastIndexOf('-') + 1) || 'sk-';
  const suffix = plain.slice(-4);
  return `${prefix}${'•'.repeat(12)}${suffix}`;
}
