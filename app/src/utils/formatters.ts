export const formatINR = (val?: number): string => {
  if (val === undefined || val === null) return '₹0';
  return '₹' + val.toLocaleString('en-IN');
};

export const formatDateAgo = (dateStr: string): string => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
