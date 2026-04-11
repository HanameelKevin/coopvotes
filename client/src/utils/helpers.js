/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Get department name from code
 */
export const getDepartmentName = (code) => {
  const deptMap = {
    'BIT': 'Business Information Technology',
    'BBM': 'Business Management',
    'CS': 'Computer Science',
    'COMM': 'Commerce',
    'LAW': 'Law',
    'EDU': 'Education',
    'ADMIN': 'Administration'
  };
  return deptMap[code] || code;
};

/**
 * Get position display name
 */
export const getPositionName = (position) => {
  const positionMap = {
    'President': 'President',
    'Congress Person': 'Congress Person',
    'Male Delegate': 'Male Delegate',
    'Female Delegate': 'Female Delegate'
  };
  return positionMap[position] || position;
};

/**
 * Calculate vote percentage
 */
export const calculatePercentage = (votes, total) => {
  if (!total || total === 0) return 0;
  return Math.round((votes / total) * 100);
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate university email
 */
export const isUniversityEmail = (email) => {
  const normalizedEmail = email?.toLowerCase().trim();
  return normalizedEmail?.endsWith('@student.cuk.ac.ke') || normalizedEmail?.endsWith('@coop.ac.ke');
};

/**
 * Get initials from name/email
 */
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split('@')[0].split('.');
  return parts.map(p => p[0].toUpperCase()).join('').slice(0, 2);
};

/**
 * Generate avatar color based on name
 */
export const getAvatarColor = (name) => {
  const colors = [
    'bg-green-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500'
  ];
  const index = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[index];
};
