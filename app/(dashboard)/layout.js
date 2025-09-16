'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
      router.push('/login');
    }
  }, [loading, isAuthenticated, router, toast]);

  // Redirect to change-password if user must change password
  useEffect(() => {
    if (!loading && user && user.mustChangePassword && user.emailVerified) {
      toast({
        title: "Password change required",
        description: "You must change your password before accessing the dashboard",
        variant: "destructive",
      });
      router.push('/change-password');
    }
  }, [loading, user, router, toast]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Only render dashboard if authenticated and password doesn't need to be changed
  if (!isAuthenticated || (user && user.mustChangePassword && user.emailVerified)) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden  bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
          <div className="relative">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-6xl mx-auto space-y-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}