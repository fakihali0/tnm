/**
 * Credential Encryption Utilities
 * Uses Web Crypto API (AES-256-GCM) for secure credential storage
 */

export interface EncryptedCredentials {
  encrypted_data: string;
  iv: string;
  encryption_key_id: string;
}

/**
 * Generate a new AES-256 encryption key
 */
async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or create encryption key for this session
 * In production, this should be stored in Supabase secrets with proper rotation
 */
let cachedKey: CryptoKey | null = null;
async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  
  const keyMaterial = Deno.env.get('CREDENTIAL_ENCRYPTION_KEY');
  if (!keyMaterial) {
    // Generate new key if not found (for development)
    console.warn('No CREDENTIAL_ENCRYPTION_KEY found, generating temporary key');
    cachedKey = await generateEncryptionKey();
    return cachedKey;
  }
  
  // Import key from base64
  const keyData = Uint8Array.from(atob(keyMaterial), c => c.charCodeAt(0));
  cachedKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return cachedKey;
}

/**
 * Encrypt credentials using AES-256-GCM
 */
export async function encryptCredentials(
  credentials: Record<string, any>
): Promise<EncryptedCredentials> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(credentials));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Convert to base64 for storage
  const encryptedArray = new Uint8Array(encrypted);
  const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
  const ivBase64 = btoa(String.fromCharCode(...iv));
  
  return {
    encrypted_data: encryptedBase64,
    iv: ivBase64,
    encryption_key_id: 'primary_key_v1' // Key rotation identifier
  };
}

/**
 * Decrypt credentials
 */
export async function decryptCredentials(
  encryptedData: string,
  iv: string
): Promise<Record<string, any>> {
  const key = await getEncryptionKey();
  
  // Convert from base64
  const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivArray },
    key,
    encryptedArray
  );
  
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decrypted);
  
  return JSON.parse(jsonString);
}

/**
 * Sanitize sensitive data from logs
 * Masks passwords, API keys, and other credentials
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['password', 'pwd', 'secret', 'token', 'key', 'credential', 'api_key', 'apikey'];
  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Secure console log that automatically sanitizes sensitive data
 */
export function secureLog(message: string, data?: any) {
  if (data) {
    console.log(message, sanitizeForLogging(data));
  } else {
    console.log(message);
  }
}
