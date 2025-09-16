import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names into a single string, merging Tailwind CSS classes efficiently.
 * @param {...string} inputs - Class names to combine
 * @returns {string} - Combined class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string into a human-readable format
 * @param {string|Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  return new Date(date).toLocaleDateString(undefined, mergedOptions);
}

/**
 * Truncates a string to a specified length and adds an ellipsis
 * @param {string} str - The string to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} - Truncated string
 */
export function truncateString(str, length = 100) {
  if (!str || str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

/**
 * Generates initials from a name
 * @param {string} name - The name to generate initials from
 * @returns {string} - Initials
 */
export function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Debounces a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
