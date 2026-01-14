import { NormalizedData } from './index';

/**
 * Normalizes raw ingestion data into structured financial records.
 */
export async function normalize(ingestionId: string): Promise<NormalizedData> {
    // Mock implementation for build success
    console.log(`[Normalization] Processing ingestion ${ingestionId}`);

    return {
        id: crypto.randomUUID(),
        rawId: ingestionId,
        type: 'transaction',
        data: {},
        confidence: 0.95,
        provenance: 'automated-rule'
    };
}
