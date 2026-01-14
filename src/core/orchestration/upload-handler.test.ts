/**
 * Upload Handler Tests
 * 
 * Tier 3: Orchestration - 80-90% Coverage Required
 */

import { UploadHandler, UploadStatus } from './upload-handler';

describe('Upload Handler - Orchestration', () => {
    let handler: UploadHandler;

    beforeEach(() => {
        handler = new UploadHandler(3, 100); // 3 retries, 100ms delay
    });

    describe('Job Sequencing', () => {
        it('executes upload workflow in correct sequence', async () => {
            const statusChanges: UploadStatus[] = [];
            const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });

            const result = await handler.execute(
                mockFile,
                'BANK_STATEMENT',
                (status) => statusChanges.push(status)
            );

            expect(result.success).toBe(true);
            expect(statusChanges).toEqual(['VALIDATING', 'PENDING', 'AWAITING_CONFIRMATION']);
        });

        it('transitions through all states for confirmed mapping', async () => {
            const statusChanges: UploadStatus[] = [];
            const uploadId = 'test-upload-id';
            const columnMappings = [
                { columnIndex: 0, userSelectedType: 'DATE' },
                { columnIndex: 1, userSelectedType: 'DESCRIPTION' },
            ];

            const result = await handler.processConfirmedMapping(
                uploadId,
                columnMappings,
                (status) => statusChanges.push(status)
            );

            expect(result.success).toBe(true);
            expect(statusChanges).toEqual(['PROCESSING', 'IMPORTING', 'COMPLETE']);
        });
    });

    describe('Validation', () => {
        it('rejects non-CSV files', async () => {
            const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

            const result = await handler.execute(mockFile, 'BANK_STATEMENT');

            expect(result.success).toBe(false);
            expect(result.status).toBe('FAILED');
            expect(result.error).toContain('CSV');
        });

        it('rejects empty files', async () => {
            const mockFile = new File([], 'test.csv', { type: 'text/csv' });

            const result = await handler.execute(mockFile, 'BANK_STATEMENT');

            expect(result.success).toBe(false);
            expect(result.error).toContain('empty');
        });

        it('rejects files over size limit', async () => {
            const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
            const mockFile = new File([largeContent], 'test.csv', { type: 'text/csv' });

            const result = await handler.execute(mockFile, 'BANK_STATEMENT');

            expect(result.success).toBe(false);
            expect(result.error).toContain('too large');
        });
    });

    describe('Retry Logic', () => {
        it('retries on transient errors', async () => {
            let attemptCount = 0;
            const failingHandler = new UploadHandler(3, 10);

            // Mock validateFile to fail twice then succeed
            const originalValidate = (failingHandler as any).validateFile;
            (failingHandler as any).validateFile = async (file: File) => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Transient error');
                }
                return originalValidate.call(failingHandler, file);
            };

            const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
            const result = await failingHandler.execute(mockFile, 'BANK_STATEMENT');

            expect(attemptCount).toBe(3);
            expect(result.success).toBe(true);
        });

        it('fails after max retries', async () => {
            const failingHandler = new UploadHandler(2, 10);

            // Mock validateFile to always fail
            (failingHandler as any).validateFile = async () => {
                throw new Error('Permanent error');
            };

            const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
            const result = await failingHandler.execute(mockFile, 'BANK_STATEMENT');

            expect(result.success).toBe(false);
            expect(result.status).toBe('FAILED');
            expect(result.error).toBeTruthy(); // Just check error exists
        });

        it('uses exponential backoff', async () => {
            const delays: number[] = [];
            const failingHandler = new UploadHandler(3, 100);

            // Mock delay to track timing
            const originalDelay = (failingHandler as any).delay;
            (failingHandler as any).delay = async (ms: number) => {
                delays.push(ms);
                return originalDelay.call(failingHandler, 10); // Use shorter delay for testing
            };

            // Mock validateFile to always fail
            (failingHandler as any).validateFile = async () => {
                throw new Error('Error');
            };

            const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
            await failingHandler.execute(mockFile, 'BANK_STATEMENT');

            // Should have exponential backoff: 100ms, 200ms, 400ms
            expect(delays).toEqual([100, 200, 400]);
        });
    });

    describe('Error Propagation', () => {
        it('propagates validation errors', async () => {
            const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

            const result = await handler.execute(mockFile, 'BANK_STATEMENT');

            expect(result.success).toBe(false);
            expect(result.error).toBeTruthy();
        });

        it('propagates processing errors', async () => {
            const failingHandler = new UploadHandler(1, 10);

            // Mock parseCSV to fail
            (failingHandler as any).parseCSV = async () => {
                throw new Error('Parse error');
            };

            const result = await failingHandler.processConfirmedMapping(
                'test-id',
                []
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Parse error');
        });
    });

    describe('State Transitions', () => {
        it('transitions from PENDING to AWAITING_CONFIRMATION', async () => {
            const statusChanges: UploadStatus[] = [];
            const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });

            await handler.execute(
                mockFile,
                'BANK_STATEMENT',
                (status) => statusChanges.push(status)
            );

            expect(statusChanges).toContain('PENDING');
            expect(statusChanges).toContain('AWAITING_CONFIRMATION');
        });

        it('transitions from PROCESSING to COMPLETE', async () => {
            const statusChanges: UploadStatus[] = [];

            await handler.processConfirmedMapping(
                'test-id',
                [],
                (status) => statusChanges.push(status)
            );

            expect(statusChanges).toContain('PROCESSING');
            expect(statusChanges).toContain('COMPLETE');
        });

        it('transitions to FAILED on error', async () => {
            const statusChanges: UploadStatus[] = [];
            const mockFile = new File([], 'test.csv', { type: 'text/csv' });

            await handler.execute(
                mockFile,
                'BANK_STATEMENT',
                (status) => statusChanges.push(status)
            );

            expect(statusChanges).toContain('FAILED');
        });
    });

    describe('Cleanup', () => {
        it('cleans up temporary files on success', async () => {
            let cleanupCalled = false;

            (handler as any).cleanup = async () => {
                cleanupCalled = true;
            };

            await handler.processConfirmedMapping('test-id', []);

            expect(cleanupCalled).toBe(true);
        });
    });
});
