/**
 * Formats a number as a USD currency string.
 * @example formatCurrency(12.5) → "$12.50"
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
