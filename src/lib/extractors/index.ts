import { Extractor } from './definitions';
import { CsvExtractor } from './CsvExtractor';
import { AiExtractor } from './AiExtractor';

export class ExtractorFactory {
    static getExtractor(mimeType: string, filename: string): Extractor {
        if (new CsvExtractor().canHandle(mimeType, filename)) {
            return new CsvExtractor();
        }
        if (new AiExtractor().canHandle(mimeType, filename)) {
            return new AiExtractor();
        }

        throw new Error(`No extractor found for file type: ${mimeType}`);
    }
}
