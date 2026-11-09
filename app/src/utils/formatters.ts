export const formatINR = (val?: number): string => {
  if (val === undefined || val === null) return '₹0';
  return '₹' + val.toLocaleString('en-IN');
};

const BACKEND_HOST = 'https://u-list-api.onrender.com';

export const getFullImageUrl = (url?: string): string => {
  if (!url) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
  }
  // Local object URLs, base64 data URIs, or file URIs must be returned as-is
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('file:')) {
    return url;
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

export const formatLastSeen = (dateStr?: string | Date): string => {
  if (!dateStr) return 'Offline';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Offline';
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));

  if (diffMinutes < 3) return 'Online';
  if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `last seen ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `last seen yesterday at ${timeStr}`;
  }
  if (diffDays < 7) return `last seen ${diffDays}d ago`;
  return `last seen ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
};
