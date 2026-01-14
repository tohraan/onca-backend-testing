/**
 * Currency Exchange Utility
 * Uses Frankfurter API (Free, open-source rates) to convert currencies deterministically.
 */

interface ExchangeRates {
    base: string;
    date: string;
    rates: Record<string, number>;
}

// Simple in-memory cache to avoid repeated network calls during a single sync operation
const rateCache: Record<string, ExchangeRates> = {};

/**
 * Fetch latest exchange rates for a base currency
 */
export async function getExchangeRates(base: string): Promise<ExchangeRates | null> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${base}_${today}`;

    if (rateCache[cacheKey]) {
        return rateCache[cacheKey];
    }

    try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
        if (!response.ok) throw new Error(`Frankfurter API error: ${response.statusText}`);

        const data = await response.json();
        rateCache[cacheKey] = data;
        return data;
    } catch (error) {
        console.error('[CURRENCY ERROR] Fetch failed:', error);
        return null;
    }
}

/**
 * Convert an amount from source currency to target base currency
 */
export async function convertCurrency(
    amount: number,
    from: string,
    to: string
): Promise<{ convertedAmount: number; rate: number }> {
    // If currencies are the same, return as is
    if (from.toUpperCase() === to.toUpperCase()) {
        return { convertedAmount: amount, rate: 1 };
    }

    const ratesData = await getExchangeRates(to.toUpperCase());

    if (!ratesData || !ratesData.rates[from.toUpperCase()]) {
        console.warn(`[CURRENCY] Could not find rate for ${from} to ${to}. Returning original amount.`);
        return { convertedAmount: amount, rate: 1 };
    }

    // Frankfurter rates are: 1 Target (Base) = X Source
    // So to get Target from Source: Source / X
    const rate = ratesData.rates[from.toUpperCase()];
    const convertedAmount = parseFloat((amount / rate).toFixed(2));

    return { convertedAmount, rate };
}
