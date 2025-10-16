/**
 * Format number to abbreviated format (e.g., 1.2K, 3.5M)
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  if (num < 1000000) {
    const thousands = num / 1000;
    return `${thousands.toFixed(thousands < 10 ? 1 : 0)}K`;
  }

  if (num < 1000000000) {
    const millions = num / 1000000;
    return `${millions.toFixed(millions < 10 ? 1 : 0)}M`;
  }

  const billions = num / 1000000000;
  return `${billions.toFixed(billions < 10 ? 1 : 0)}B`;
}

/**
 * Format number with commas (e.g., 1,234,567)
 */
export function formatNumberWithCommas(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format count (likes, comments, etc.) - shows exact count if < 1000, abbreviated otherwise
 */
export function formatCount(count: number): string {
  if (count < 1000) {
    return formatNumberWithCommas(count);
  }
  return formatNumber(count);
}

/**
 * Parse number from abbreviated format (e.g., "1.2K" -> 1200)
 */
export function parseAbbreviatedNumber(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;

  const lastChar = value.slice(-1).toUpperCase();

  switch (lastChar) {
    case 'K':
      return num * 1000;
    case 'M':
      return num * 1000000;
    case 'B':
      return num * 1000000000;
    default:
      return num;
  }
}

/**
 * Format percentage (e.g., 0.456 -> "45.6%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export default {
  formatNumber,
  formatNumberWithCommas,
  formatCount,
  parseAbbreviatedNumber,
  formatPercentage,
};
