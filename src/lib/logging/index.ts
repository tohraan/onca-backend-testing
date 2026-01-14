export const logger = {
    info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
    error: (msg: string, error?: any) => console.error(`[ERROR] ${msg}`, error || ''),
    warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
};
