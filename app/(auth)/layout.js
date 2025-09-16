'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// import { useSocketAuth } from '@/hooks/useSocketAuth'; // Import the hook

export default function AuthLayout({ children }) {
	const { user, loading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	
	// Initialize socket authentication
	// const { authenticateSocket, isSocketAuthenticated, canAuthenticate } = useSocketAuth();
	
	useEffect(() => {
		// Only handle redirects after loading is complete
		if (loading) return;
		
		// If user is authenticated
		if (user) {
			// Allow access to change-password page if required
			if (user.mustChangePassword && user.emailVerified &&
				pathname.includes('/change-password')) {
				return; // Stay on change-password page
			}
			
			// For all other auth pages, redirect to dashboard
			router.replace('/dashboard');
		}
	}, [loading, user, router, pathname]);
	
	// Show loading state
	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
				<div className="text-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
					<p className="mt-4 text-sm text-slate-600">Loading your session...</p>
				</div>
			</div>
		);
	}
	
	// Don't render anything while redirecting
	if (user && !(user.mustChangePassword && user.emailVerified &&
		pathname.includes('/change-password'))) {
		return (
			<div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
				<div className="text-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
					<p className="mt-4 text-sm text-slate-600">Redirecting to dashboard...</p>
				</div>
			</div>
		);
	}
	
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
			{children}
		</div>
	);
}