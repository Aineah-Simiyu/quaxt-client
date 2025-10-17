// utils/fcmTokenUtils.js

/**
 * FCM Token management utilities for persistent token handling
 */

const FCM_TOKEN_KEY = 'fcm-token';
const FCM_TOKEN_TIMESTAMP_KEY = 'fcm-token-timestamp';
const TOKEN_EXPIRY_HOURS = 24; // Refresh token daily

/**
 * Store FCM token with timestamp
 */
export const storeFcmToken = (token) => {
	if (!token) return false;
	
	try {
		localStorage.setItem(FCM_TOKEN_KEY, token);
		localStorage.setItem(FCM_TOKEN_TIMESTAMP_KEY, Date.now().toString());
		
		return true;
	} catch (error) {
		console.error('Error storing FCM token:', error);
		return false;
	}
};

/**
 * Get stored FCM token if valid
 */
export const getStoredFcmToken = () => {
	try {
		const token = localStorage.getItem(FCM_TOKEN_KEY);
		const timestamp = localStorage.getItem(FCM_TOKEN_TIMESTAMP_KEY);
		
		if (!token || !timestamp) {
			
			return null;
		}
		
		// Check if token is still valid (not expired)
		const tokenAge = Date.now() - parseInt(timestamp);
		const maxAge = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
		
		if (tokenAge > maxAge) {
			
			clearStoredFcmToken();
			return null;
		}
		
		
		return token;
	} catch (error) {
		console.error('Error retrieving stored FCM token:', error);
		return null;
	}
};

/**
 * Clear stored FCM token
 */
export const clearStoredFcmToken = () => {
	try {
		localStorage.removeItem(FCM_TOKEN_KEY);
		localStorage.removeItem(FCM_TOKEN_TIMESTAMP_KEY);
		
		return true;
	} catch (error) {
		console.error('Error clearing FCM token:', error);
		return false;
	}
};

/**
 * Check if stored token needs refresh
 */
export const shouldRefreshToken = () => {
	try {
		const timestamp = localStorage.getItem(FCM_TOKEN_TIMESTAMP_KEY);
		
		if (!timestamp) return true;
		
		const tokenAge = Date.now() - parseInt(timestamp);
		const refreshThreshold = (TOKEN_EXPIRY_HOURS - 2) * 60 * 60 * 1000; // Refresh 2 hours before expiry
		
		return tokenAge > refreshThreshold;
	} catch (error) {
		console.error('Error checking token refresh status:', error);
		return true;
	}
};

/**
 * Get token info for debugging
 */
export const getFcmTokenInfo = () => {
	try {
		const token = localStorage.getItem(FCM_TOKEN_KEY);
		const timestamp = localStorage.getItem(FCM_TOKEN_TIMESTAMP_KEY);
		
		if (!token || !timestamp) {
			return { exists: false };
		}
		
		const tokenAge = Date.now() - parseInt(timestamp);
		const ageHours = Math.floor(tokenAge / (60 * 60 * 1000));
		const maxAge = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
		const isExpired = tokenAge > maxAge;
		const needsRefresh = shouldRefreshToken();
		
		return {
			exists: true,
			token: token.substring(0, 20) + '...', // Truncated for security
			ageHours,
			isExpired,
			needsRefresh,
			timestamp: new Date(parseInt(timestamp)).toISOString()
		};
	} catch (error) {
		console.error('Error getting FCM token info:', error);
		return { exists: false, error: error.message };
	}
};