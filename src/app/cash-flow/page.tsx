import { redirect } from 'next/navigation';

/**
 * Redirect /cash-flow to /cashflow
 * This route was consolidated for consistency
 */
export default function CashFlowRedirect() {
    redirect('/cashflow');
}
