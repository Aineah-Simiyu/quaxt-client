'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

/**
 * Higher-order component to protect routes that require authentication
 * @param {React.Component} Component - The component to wrap with authentication
 * @param {Object} options - Options for the auth guard
 * @param {Array|String} options.roles - Required roles to access the route
 * @returns {React.Component} Protected component
 */
export function withAuth(Component, options = {}) {
  return function ProtectedRoute(props) {
    const { user, loading, hasRole } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    useEffect(() => {
      // Wait until auth state is loaded
      if (!loading) {
        // If user is not authenticated, redirect to login
        if (!user) {
          toast({
            title: 'Authentication required',
            description: 'Please log in to access this page',
            variant: 'destructive',
          });
          router.push('/login');
        } 
        // If roles are specified, check if user has required role
        else if (options.roles && !hasRole(options.roles)) {
          toast({
            title: 'Access denied',
            description: 'You do not have permission to access this page',
            variant: 'destructive',
          });
          router.push('/dashboard');
        }
      }
    }, [user, loading, router, hasRole, toast]);

    // Show loading state while checking authentication
    if (loading || !user) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      );
    }

    // If roles are specified and user doesn't have required role, don't render component
    if (options.roles && !hasRole(options.roles)) {
      return null;
    }

    // Render the protected component
    return <Component {...props} />;
  };
}

/**
 * Higher-order component to protect routes that should only be accessible to non-authenticated users
 * @param {React.Component} Component - The component to wrap
 * @returns {React.Component} Protected component
 */
export function withGuest(Component) {
  return function GuestRoute(props) {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      // Wait until auth state is loaded
      if (!loading && user) {
        // If user is authenticated, redirect to dashboard
        router.push('/dashboard');
      }
    }, [user, loading, router]);

    // Show loading state while checking authentication
    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      );
    }

    // If user is authenticated, don't render component
    if (user) {
      return null;
    }

    // Render the guest component
    return <Component {...props} />;
  };
}