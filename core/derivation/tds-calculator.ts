/**
 * TDS (Tax Deducted at Source) Calculator
 * 
 * Tier 1: Financial Derivation (100% Coverage Required)
 * 
 * Calculates TDS amount based on payment amount and TDS rate.
 * This is critical for Indian tax compliance.
 */

/**
 * Calculate TDS amount from payment and rate
 * 
 * @param paymentAmount - The total payment amount
 * @param tdsRate - TDS rate as percentage (0-100)
 * @returns TDS amount rounded to 2 decimal places
 * @throws Error if rate is invalid
 */
export function calculateTDS(paymentAmount: number, tdsRate: number): number {
    // Validate inputs
    if (paymentAmount < 0) {
        throw new Error('Payment amount cannot be negative');
    }

    if (tdsRate < 0 || tdsRate > 100) {
        throw new Error('TDS rate must be between 0 and 100');
    }

    if (paymentAmount === null || paymentAmount === undefined) {
        throw new Error('Payment amount is required');
    }

    if (tdsRate === null || tdsRate === undefined) {
        throw new Error('TDS rate is required');
    }

    // Calculate TDS
    const tdsAmount = (paymentAmount * tdsRate) / 100;

    // Round to 2 decimal places
    return Math.round(tdsAmount * 100) / 100;
}
