/**
 * Receivables & Payables Calculator
 * 
 * Tier 1: Financial Derivation (100% Coverage Required)
 * 
 * Calculates outstanding receivables, payables, overdue obligations, and net position.
 */

export interface Obligation {
    amount: number;
    type: 'RECEIVABLE' | 'PAYABLE';
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    due_date: Date;
}

export interface ObligationSummary {
    totalReceivables: number;
    totalPayables: number;
    overdueReceivables: number;
    overduePayables: number;
    netPosition: number;
}

/**
 * Calculate outstanding receivables from obligations
 */
export function calculateOutstandingReceivables(obligations: Obligation[]): number {
    return obligations
        .filter(o => o.type === 'RECEIVABLE' && o.status !== 'PAID')
        .reduce((sum, o) => sum + o.amount, 0);
}

/**
 * Calculate outstanding payables from obligations
 */
export function calculateOutstandingPayables(obligations: Obligation[]): number {
    return obligations
        .filter(o => o.type === 'PAYABLE' && o.status !== 'PAID')
        .reduce((sum, o) => sum + o.amount, 0);
}

/**
 * Determine if an obligation is overdue
 */
export function isOverdue(obligation: Obligation, currentDate: Date = new Date()): boolean {
    if (obligation.status === 'PAID') {
        return false;
    }
    return obligation.due_date < currentDate;
}

/**
 * Calculate net position (receivables - payables)
 */
export function calculateNetPosition(receivables: number, payables: number): number {
    return Math.round((receivables - payables) * 100) / 100;
}

/**
 * Generate complete obligation summary
 */
export function generateObligationSummary(
    obligations: Obligation[],
    currentDate: Date = new Date()
): ObligationSummary {
    const totalReceivables = calculateOutstandingReceivables(obligations);
    const totalPayables = calculateOutstandingPayables(obligations);

    const overdueReceivables = obligations
        .filter(o => o.type === 'RECEIVABLE' && isOverdue(o, currentDate))
        .reduce((sum, o) => sum + o.amount, 0);

    const overduePayables = obligations
        .filter(o => o.type === 'PAYABLE' && isOverdue(o, currentDate))
        .reduce((sum, o) => sum + o.amount, 0);

    const netPosition = calculateNetPosition(totalReceivables, totalPayables);

    return {
        totalReceivables: Math.round(totalReceivables * 100) / 100,
        totalPayables: Math.round(totalPayables * 100) / 100,
        overdueReceivables: Math.round(overdueReceivables * 100) / 100,
        overduePayables: Math.round(overduePayables * 100) / 100,
        netPosition,
    };
}
