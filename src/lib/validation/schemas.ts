/**
 * Input Validation Schemas
 * Zod schemas for all API routes to prevent invalid data
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const UUIDSchema = z.string().uuid();
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const AmountSchema = z.number().positive().finite();
export const OrgIdSchema = UUIDSchema;
export const UserIdSchema = UUIDSchema;

// ============================================================================
// File Upload Schemas
// ============================================================================

export const FileTypeSchema = z.enum(['BANK_STATEMENT', 'INVOICE', 'EXPENSE', 'GENERAL']);

export const UploadRequestSchema = z.object({
    fileType: FileTypeSchema.optional().default('GENERAL'),
});

// ============================================================================
// Invoice Schemas
// ============================================================================

export const InvoiceTypeSchema = z.enum(['PAYABLE', 'RECEIVABLE']);
export const InvoiceStatusSchema = z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE']);

export const CreateInvoiceSchema = z.object({
    invoice_type: InvoiceTypeSchema,
    counterparty_name: z.string().min(1).max(255),
    invoice_number: z.string().max(100).optional(),
    amount: AmountSchema,
    tax_amount: AmountSchema.optional().default(0),
    invoice_date: DateSchema,
    due_date: DateSchema,
    notes: z.string().max(1000).optional(),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().extend({
    id: UUIDSchema,
    status: InvoiceStatusSchema.optional(),
});

// ============================================================================
// Expense Schemas
// ============================================================================

export const ExpenseCategorySchema = z.enum([
    'OFFICE',
    'TRAVEL',
    'SOFTWARE',
    'MARKETING',
    'UTILITIES',
    'MISC'
]);

export const PaymentMethodSchema = z.enum(['CASH', 'CARD', 'BANK', 'UNKNOWN']);

export const CreateExpenseSchema = z.object({
    expense_date: DateSchema,
    amount: AmountSchema,
    category: ExpenseCategorySchema,
    vendor_name: z.string().min(1).max(255),
    payment_method: PaymentMethodSchema.optional().default('UNKNOWN'),
    notes: z.string().max(1000).optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial().extend({
    id: UUIDSchema,
});

// ============================================================================
// Financial Task Schemas (Payables/Receivables)
// ============================================================================

export const TaskTypeSchema = z.enum(['PAYABLE', 'RECEIVABLE']);
export const TaskStatusSchema = z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']);

export const CreateFinancialTaskSchema = z.object({
    type: TaskTypeSchema,
    counterparty_name: z.string().min(1).max(255),
    amount: AmountSchema,
    expected_date: DateSchema,
    notes: z.string().max(1000).optional(),
});

export const UpdateFinancialTaskSchema = CreateFinancialTaskSchema.partial().extend({
    id: UUIDSchema,
    status: TaskStatusSchema.optional(),
});

// ============================================================================
// Google Sheets Schemas
// ============================================================================

export const SheetsSyncSchema = z.object({
    url: z.string().url(),
    sheetName: z.string().optional(),
    mapping: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// Banking Schemas
// ============================================================================

export const BankTransactionDirectionSchema = z.enum(['DEBIT', 'CREDIT']);

export const ColumnMappingSchema = z.object({
    date: z.string(),
    description: z.string(),
    amount: z.string(),
    direction: z.string().optional(),
});

export const ConfirmMappingSchema = z.object({
    uploadId: UUIDSchema,
    mapping: ColumnMappingSchema,
});

// ============================================================================
// Cash Snapshot Schemas
// ============================================================================

export const CreateCashSnapshotSchema = z.object({
    available_balance: AmountSchema,
});

// ============================================================================
// TDS Schemas
// ============================================================================

export const CreateTDSEntrySchema = z.object({
    vendor_name: z.string().min(1).max(255),
    invoice_reference: z.string().max(100).optional(),
    payment_date: DateSchema,
    payment_amount: AmountSchema,
    tds_rate: z.number().min(0).max(100),
    tds_amount: AmountSchema,
    due_date: DateSchema,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate request body against schema
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validated data or throws error
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = (error as any).errors.map((err: any) => ({
                field: err.path.join('.'),
                message: err.message
            }));
            throw new ValidationError('Invalid request data', formattedErrors);
        }
        throw error;
    }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
    constructor(
        message: string,
        public errors: Array<{ field: string; message: string }>
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}
