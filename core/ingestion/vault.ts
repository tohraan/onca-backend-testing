import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// MVP: Store in a local 'vault' directory adjacent to the core package or defined by ENV
const VAULT_DIR = process.env.VAULT_PATH || path.join(process.cwd(), 'data', 'vault');
const ALGORITHM = 'aes-256-cbc';
// In prod, this must come from a secure secret manager
const ENCRYPTION_KEY = process.env.VAULT_KEY
    ? Buffer.from(process.env.VAULT_KEY, 'hex')
    : crypto.randomBytes(32); // Fallback for dev ONLY

// Ensure vault exists
if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true });
}

export interface StoredDocument {
    storagePath: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    encryptionIv: string; // Store IV efficiently
}

/**
 * ENCYRPTION:
 * We use AES-256-CBC.
 * The IV is unique per file and must be stored to decrypt.
 */

export async function storeDocument(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string
): Promise<StoredDocument> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);

    // Generate a secure, content-addressed-like filename (random UUID for now)
    const fileId = crypto.randomUUID();
    const storageFilename = `${fileId}.enc`;
    const storagePath = path.join(VAULT_DIR, storageFilename);

    await fs.promises.writeFile(storagePath, encrypted);

    return {
        storagePath: storageFilename, // Store relative path
        originalFilename,
        mimeType,
        sizeBytes: fileBuffer.length,
        encryptionIv: iv.toString('hex')
    };
}

export async function retrieveDocument(
    storagePath: string,
    ivHex: string
): Promise<Buffer> {
    const fullPath = path.join(VAULT_DIR, storagePath);

    if (!fs.existsSync(fullPath)) {
        throw new Error(`Document not found in vault: ${storagePath}`);
    }

    const encrypted = await fs.promises.readFile(fullPath);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted;
}
