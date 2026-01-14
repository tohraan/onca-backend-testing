export interface FinancialSummary {
    cashBalance: number;
    monthlyBurn: number;
    pendingInvoices: number;
    avgDaysToPay: number;
    period: string;
}

// Note: Derivation logic is implemented in specific modules:
// - Cash balance: cash-balance.ts
// - P&L computation: pl-computation.ts
// - Receivables/Payables: receivables-payables.ts
// - TDS calculator: tds-calculator.ts
// API routes handle derivation orchestration
