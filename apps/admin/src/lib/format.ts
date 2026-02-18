const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatCurrency(value: unknown): string {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return '$0.00';
  }
  return moneyFormatter.format(number);
}

export function formatDateTime(value: unknown): string {
  if (!value) {
    return 'N/A';
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return dateTimeFormatter.format(date);
}

export function toLabel(input: string): string {
  if (!input) {
    return '';
  }

  return input
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
