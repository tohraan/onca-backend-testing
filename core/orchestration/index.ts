import { ingest } from '../ingestion';
import { normalize } from '../normalization';
import { deriveSummary } from '../derivation';
import { explain } from '../intelligence';

export const processUserUpload = async (orgId: string, source: string, data: any) => {
    // Orchestration Flow: Ingest -> Normalize -> Derive -> Intelligence
    console.log('Orchestrating upload for org', orgId);

    const receipt = await ingest(source, data);
    const normalized = await normalize(receipt.id);
    const summary = await deriveSummary(orgId);
    const explanation = await explain(summary);

    return {
        receipt,
        normalized,
        summary,
        explanation,
    };
};
