export const CONFIG = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
};

export const CONSTANTS = {
    ORG_ROLES: ['admin', 'viewer', 'editor'] as const,
    INGESTION_STATUS: ['pending', 'completed', 'failed'] as const,
};
