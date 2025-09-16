import { useCallback } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

export function useSocketAuth() {
	const {
		socket,
		isConnected,
		showInfo,
		showError,
		reAuthenticateSocket,
		isAuthenticating
	} = useNotifications();
	const { user } = useAuth();
	
	// Manual authentication function that uses the context's method
	const authenticateSocket = useCallback(async (userData = null) => {
		if (!reAuthenticateSocket) {
			console.log('Re-authentication method not available');
			return false;
		}
		
		try {
			return await reAuthenticateSocket();
		} catch (error) {
			console.error('Error in manual authentication:', error);
			showError('Authentication Failed', 'Could not establish secure connection.');
			return false;
		}
	}, [reAuthenticateSocket, showError]);
	
	// Check socket connection status
	const checkConnection = useCallback(() => {
		if (!socket || !isConnected) {
			showError('Connection Error', 'Socket not connected. Please refresh the page.');
			return false;
		}
		return true;
	}, [socket, isConnected, showError]);
	
	// Test connection function
	const testConnection = useCallback(() => {
		if (!checkConnection()) return;
		
		socket.emit('test-connection', { timestamp: Date.now() });
		showInfo('Connection Test', 'Testing connection to server...');
	}, [socket, checkConnection, showInfo]);
	
	return {
		authenticateSocket,
		testConnection,
		checkConnection,
		isSocketAuthenticated: isConnected && !isAuthenticating,
		canAuthenticate: !!(user && socket && isConnected),
		isAuthenticating
	};
}