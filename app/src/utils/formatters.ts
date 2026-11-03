export const formatINR = (val?: number): string => {
  if (val === undefined || val === null) return '₹0';
  return '₹' + val.toLocaleString('en-IN');
};

const BACKEND_HOST = 'https://u-list-api.onrender.com';

export const getFullImageUrl = (url?: string): string => {
  if (!url) {
    return 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${BACKEND_HOST}${url}`;
  }
  return `${BACKEND_HOST}/${url}`;
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
