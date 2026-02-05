// Currency formatting for Sierra Leonean Leone (SLE)
export const formatCurrency = (amount: number): string => {
  return `SLE ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatCurrencyShort = (amount: number): string => {
  return `SLE ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
