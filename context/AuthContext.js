'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, userService } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { ROLES, hasRole as hasRoleHelper, isInstructorOrAdmin, isAdmin, isSchoolAdmin } from '@/lib/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isInitialized, setIsInitialized] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const { toast } = useToast();
	
	// Memoized function to check if current path is an auth page
	const isAuthPage = useCallback(() => {
		const authPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/change-password', '/verify-email'];
		return authPaths.some(path => pathname.includes(path));
	}, [pathname]);
	
	// Check if user is logged in on initial load
	useEffect(() => {
		const checkUserLoggedIn = async () => {
			try {
				// Skip if already initialized or on auth pages (except change-password)
				if (isInitialized) {
					setLoading(false);
					return;
				}
				
				// On most auth pages, just set loading to false without checking auth
				if (isAuthPage() && !pathname.includes('/change-password')) {
					setLoading(false);
					setIsInitialized(true);
					return;
				}
				
				// Check authentication
				const response = await authService.getCurrentUser();
				const userData = response.data?.user || response.data || response;
				setUser({...userData, schoolId: userData.school?._id});
				
				// Only redirect for password change if we're not already on change-password page
				if (userData.mustChangePassword && userData.emailVerified &&
					!pathname.includes('/change-password')) {
					router.replace('/change-password'); // Use replace instead of push
				}
			} catch (error) {
				// User is not logged in or session expired
				setUser(null);
				// Only redirect to login if not already on an auth page
				if (!isAuthPage()) {
					router.replace('/login');
				}
			} finally {
				setLoading(false);
				setIsInitialized(true);
			}
		};
		
		checkUserLoggedIn();
	}, [isInitialized, pathname, isAuthPage, router]); // Removed pathname from dependencies to prevent excessive calls
	
	// Login function
	const login = async (credentials) => {
		try {
			setLoading(true);
			const response = await authService.login(credentials);
			const userData = response.data?.user || response.data || response;
			
			setUser(
				{...userData, schoolId: userData.school?._id}
			);
			
			// Show single success toast
			toast({
				title: 'Login successful',
				description: `Welcome back, ${userData.firstName || userData.name || userData.email}!`,
			});
			
			// Handle password change requirement
			if (userData.mustChangePassword && userData.emailVerified) {
				// Don't show additional toast here, just redirect
				router.replace('/change-password');
				return userData;
			}
			
			return userData;
		} catch (error) {
			const message = error.response?.data?.message || 'Login failed';
			toast({
				title: 'Login failed',
				description: message,
				variant: 'destructive',
			});
			throw error;
		} finally {
			setLoading(false);
		}
	};
	
	// Register function
	const register = async (userData) => {
		try {
			setLoading(true);
			
			const response = await authService.register(userData);
			
			if (userData.school && userData.admin) {
				toast({
					title: 'School registration successful',
					description: 'School and admin account created. Please check your email to verify your account.',
				});
			} else {
				toast({
					title: 'Registration successful',
					description: 'Please check your email to verify your account.',
				});
			}
			
			return response;
		} catch (error) {
			const message = error.response?.data?.message || 'Registration failed';
			toast({
				title: 'Registration failed',
				description: message,
				variant: 'destructive',
			});
			throw error;
		} finally {
			setLoading(false);
		}
	};
	
	// Logout function
	const logout = async () => {
		try {
			setLoading(true);
			await authService.logout();
			setUser(null);
			
			toast({
				title: 'Logged out',
				description: 'You have been successfully logged out.',
			});
			router.replace('/login');
		} catch (error) {
			toast({
				title: 'Logout failed',
				description: 'There was a problem logging you out.',
				variant: 'destructive',
			});
			console.error(error);
		} finally {
			setLoading(false);
		}
	};
	
	// Update user profile
	const updateProfile = async (userData) => {
		try {
			setLoading(true);
			const response = await userService.updateProfile(userData);
			const updatedUser = response.data?.user || response.data || response;
			setUser(updatedUser);
			
			toast({
				title: 'Profile updated',
				description: 'Your profile has been successfully updated.',
			});
			return updatedUser;
		} catch (error) {
			const message = error.response?.data?.message || 'Failed to update profile';
			toast({
				title: 'Profile update failed',
				description: message,
				variant: 'destructive',
			});
			throw error;
		} finally {
			setLoading(false);
		}
	};
	
	// Check if user has a specific role
	const hasRole = (role) => {
		return hasRoleHelper(user, role);
	};
	
	// Helper functions for common role checks
	const isUserInstructorOrAdmin = () => isInstructorOrAdmin(user);
	const isUserAdmin = () => isAdmin(user);
	const isUserSchoolAdmin = () => isSchoolAdmin(user);
	
	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				login,
				register,
				logout,
				updateProfile,
				isAuthenticated: !!user,
				hasRole,
				isInstructorOrAdmin: isUserInstructorOrAdmin,
				isAdmin: isUserAdmin,
				isSchoolAdmin: isUserSchoolAdmin,
				ROLES,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};