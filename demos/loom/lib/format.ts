const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Formats a whole-rupee amount as "Rs 38,500". */
export function formatPrice(amount: number): string {
  return `Rs ${number.format(amount)}`;
}

export const FREE_DELIVERY_THRESHOLD = 15000;
