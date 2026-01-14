/**
 * Test Data Factories
 * 
 * Generate mock data for testing financial operations.
 * Follows ONCA's deterministic testing philosophy.
 */

export interface Transaction {
    id: string;
    org_id: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    date: Date;
    description?: string;
}

export interface Invoice {
    id: string;
    org_id: string;
    invoice_type: 'PAYABLE' | 'RECEIVABLE';
    amount: number;
    status: 'UNPAID' | 'PAID' | 'OVERDUE';
    due_date: Date;
    counterparty_name: string;
}

export interface Expense {
    id: string;
    org_id: string;
    amount: number;
    category: string;
    vendor_name: string;
    expense_date: Date;
}

let idCounter = 0;

export const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: `txn_${++idCounter}`,
    org_id: 'test_org_1',
    amount: 1000,
    type: 'EXPENSE',
    date: new Date('2024-01-15'),
    description: 'Test transaction',
    ...overrides,
});

export const buildInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
    id: `inv_${++idCounter}`,
    org_id: 'test_org_1',
    invoice_type: 'RECEIVABLE',
    amount: 5000,
    status: 'UNPAID',
    due_date: new Date('2024-02-15'),
    counterparty_name: 'Test Client',
    ...overrides,
});

export const buildExpense = (overrides: Partial<Expense> = {}): Expense => ({
    id: `exp_${++idCounter}`,
    org_id: 'test_org_1',
    amount: 500,
    category: 'OFFICE',
    vendor_name: 'Test Vendor',
    expense_date: new Date('2024-01-15'),
    ...overrides,
});

export const resetIdCounter = () => {
    idCounter = 0;
};
