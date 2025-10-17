'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import authService from '@/lib/api/authService';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  const verifyQuery = useQuery({
    queryKey: ['verify-email', token],
    enabled: !!token,
    queryFn: () => authService.verifyEmail(token),
  });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }
    if (verifyQuery.isLoading) {
      setStatus('verifying');
      setMessage('');
      return;
    }
    if (verifyQuery.isError) {
      const err = verifyQuery.error;
      const msg = err?.response?.data?.message || 'Verification failed. The link may be expired or invalid.';
      setStatus('error');
      setMessage(msg);
      return;
    }
    if (verifyQuery.data) {
      const resp = verifyQuery.data;
      setStatus('success');
      setMessage(resp?.message || 'Your email has been successfully verified!');
    }
  }, [token, verifyQuery.isLoading, verifyQuery.isError, verifyQuery.data, verifyQuery.error]);

  const handleContinue = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-slate-900">
                Quaxt
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-4 py-2 h-9 text-sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-24">
        <section className="w-full py-16 md:py-24">
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 md:p-12">
              <div className="text-center space-y-6">
                {/* Status Icon */}
                <div className="flex justify-center">
                  {status === 'verifying' && (
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-slate-600 animate-spin" />
                    </div>
                  )}
                  {status === 'success' && (
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-light tracking-tight text-slate-900">
                    {status === 'verifying' && 'Verifying Your Email'}
                    {status === 'success' && 'Email Verified Successfully'}
                    {status === 'error' && 'Verification Failed'}
                  </h1>
                  <p className="text-lg text-slate-600 leading-relaxed max-w-md mx-auto">
                    {status === 'verifying' && 'Please wait while we verify your email address...'}
                    {status === 'success' && 'Welcome to Quaxt! Your account is now active and ready to use.'}
                    {status === 'error' && 'We encountered an issue while verifying your email address.'}
                  </p>
                </div>

                {/* Message */}
                {message && (
                  <div className={`p-4 rounded-lg border ${
                    status === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : status === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <p className="text-sm font-medium">{message}</p>
                  </div>
                )}

                {/* Actions */}
                {status !== 'verifying' && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    {status === 'success' && (
                      <Button 
                        onClick={handleContinue}
                        className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-6 py-3 h-11 text-sm"
                      >
                        Continue to Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                    {status === 'error' && (
                      <>
                        <Link href="/login">
                          <Button className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-6 py-3 h-11 text-sm">
                            Go to Sign In
                          </Button>
                        </Link>
                        <Link href="/register">
                          <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 h-11 text-sm">
                            Create New Account
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                )}

                {/* Additional Help */}
                {status === 'error' && (
                  <div className="pt-6 border-t border-slate-200">
                    <p className="text-sm text-slate-500">
                      Need help? Contact our support team or try requesting a new verification email.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Quaxt. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}