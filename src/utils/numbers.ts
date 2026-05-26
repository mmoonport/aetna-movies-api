const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function intToCurrencyString(value: number): string {
  return usd.format(Number(value ?? 0));
}
