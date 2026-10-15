/**
 * Returns the currency symbol for a given ISO 4217 currency code.
 * Falls back to the code itself if unknown.
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    CHF: "CHF",
    CAD: "CA$",
    AUD: "A$",
    JPY: "¥",
  };
  return symbols[currency] ?? currency;
}

/**
 * Formats a number as a currency string using the given symbol and locale.
 * e.g. formatCurrency(42000, "€", "fi-FI") → "42 000 €"
 */
export function formatCurrency(value: number, currencySymbol: string, locale = "en-US"): string {
  return `${Math.round(value).toLocaleString(locale)} ${currencySymbol}`;
}

/**
 * Returns a formatter function bound to a specific symbol and locale.
 * Convenient when the same currency is used many times in a component.
 */
export function makeCurrencyFormatter(currencySymbol: string, locale = "en-US") {
  return (value: number) => `${Math.round(value).toLocaleString(locale)} ${currencySymbol}`;
}

/**
 * Formats a number in thousands with the currency symbol, e.g. "42k€".
 */
export function formatCurrencyK(value: number, currencySymbol: string): string {
  return `${(value / 1000).toFixed(0)}k${currencySymbol}`;
}
