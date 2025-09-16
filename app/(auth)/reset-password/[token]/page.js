'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Lock, ArrowRight, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
	password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ['confirmPassword'],
});

export default function ResetPasswordPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [isValidToken, setIsValidToken] = useState(true);
	const [isCheckingToken, setIsCheckingToken] = useState(true);
	const router = useRouter();
	const params = useParams();
	const { toast } = useToast();
	const token = params.token;

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			password: '',
			confirmPassword: '',
		},
	});

	// Verify token on component mount
	useEffect(() => {
		const verifyToken = async () => {
			try {
				const response = await fetch(`/api/auth/verify-reset-token/${token}`);
				if (!response.ok) {
					setIsValidToken(false);
				}
			} catch (error) {
				console.error('Token verification error:', error);
				setIsValidToken(false);
			} finally {
				setIsCheckingToken(false);
			}
		};

		if (token) {
			verifyToken();
		} else {
			setIsValidToken(false);
			setIsCheckingToken(false);
		}
	}, [token]);

	const onSubmit = async (values) => {
		try {
			setIsLoading(true);
			
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					token,
					password: values.password,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to reset password');
			}

			setIsSuccess(true);
			toast({
				title: "Password reset successful",
				description: "Your password has been updated successfully."
			});

			// Redirect to login after 3 seconds
			setTimeout(() => {
				router.push('/login');
			}, 3000);
		} catch (error) {
			console.error('Reset password error:', error);
			toast({
				title: "Error",
				description: error.message || "Failed to reset password. Please try again.",
				variant: "destructive"
			});
		} finally {
			setIsLoading(false);
		}
	};

	if (isCheckingToken) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
					<p className="text-slate-600">Verifying reset token...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50">
			{/* Header */}
			<div className="bg-white border-b border-slate-200">
				<div className="max-w-7xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<Link href="/" className="text-xl font-semibold text-slate-900">
							Evalura
						</Link>
						<div className="text-sm text-slate-600">
							Need help?{" "}
							<Link href="/login" className="font-medium text-slate-900 hover:text-slate-700 transition-colors">
								Back to Sign In
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
				<div className="max-w-md w-full">
					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-3xl font-light tracking-tight text-slate-900 mb-2">
							{!isValidToken ? "Invalid Reset Link" : "Set New Password"}
						</h1>
						<p className="text-lg text-slate-600">
							{!isValidToken 
								? "This password reset link is invalid or has expired"
								: "Create a strong, secure password for your account"}
						</p>
					</div>

					{!isValidToken ? (
						/* Invalid Token State */
						<Card className="bg-white border border-slate-200 shadow-sm">
							<CardHeader className="text-center pb-6">
								<div className="mx-auto mb-4 w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center">
									<AlertCircle className="w-8 h-8 text-red-600" />
								</div>
								<CardTitle className="text-2xl font-light text-slate-900">
									Link Expired
								</CardTitle>
								<CardDescription className="text-slate-600 text-base">
									This password reset link is no longer valid
								</CardDescription>
							</CardHeader>

							<CardContent className="px-8 pb-8">
								<div className="space-y-6">
									<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
										<p className="text-sm text-slate-700 leading-relaxed">
											Password reset links expire after 24 hours for security reasons. 
											Please request a new password reset link to continue.
										</p>
									</div>

									<div className="space-y-3">
										<Link href="/forgot-password">
											<Button className="w-full bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-6 py-3 h-11">
												Request New Reset Link
											</Button>
										</Link>
										<Link href="/login">
											<Button
												variant="outline"
												className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-6"
											>
												Back to Sign In
											</Button>
										</Link>
									</div>
								</div>
							</CardContent>
						</Card>
					) : !isSuccess ? (
						/* Reset Password Form */
						<Card className="bg-white border border-slate-200 shadow-sm">
							<CardHeader className="text-center pb-6">
								<div className="mx-auto mb-4 w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
									<Lock className="w-8 h-8 text-slate-600" />
								</div>
								<CardTitle className="text-2xl font-light text-slate-900">
									Create New Password
								</CardTitle>
								<CardDescription className="text-slate-600 text-base">
									Choose a strong password to secure your account
								</CardDescription>
							</CardHeader>

							<CardContent className="px-8 pb-8">
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
										<FormField
											control={form.control}
											name="password"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">New Password</FormLabel>
													<FormControl>
														<div className="relative">
															<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																type="password"
																placeholder="Enter your new password"
																className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white"
																autoComplete="new-password"
																{...field}
															/>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="confirmPassword"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Confirm New Password</FormLabel>
													<FormControl>
														<div className="relative">
															<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																type="password"
																placeholder="Confirm your new password"
																className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white"
																autoComplete="new-password"
																{...field}
															/>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										{/* Password Requirements */}
										<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
											<h4 className="text-sm font-medium text-slate-900 mb-2">Password Requirements:</h4>
											<ul className="text-xs text-slate-600 space-y-1">
												<li>• At least 8 characters long</li>
												<li>• Mix of uppercase and lowercase letters</li>
												<li>• Include numbers and special characters</li>
												<li>• Avoid common words or personal information</li>
											</ul>
										</div>

										<div className="pt-2">
											<Button
												type="submit"
												disabled={isLoading}
												className="w-full bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-6 py-3 h-11"
											>
												{isLoading ? (
													"Updating Password..."
												) : (
													<>
														Update Password
														<ArrowRight className="ml-2 h-4 w-4" />
													</>
												)}
											</Button>
										</div>
									</form>
								</Form>
							</CardContent>
						</Card>
					) : (
						/* Success State */
						<Card className="bg-white border border-slate-200 shadow-sm">
							<CardHeader className="text-center pb-6">
								<div className="mx-auto mb-4 w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center">
									<CheckCircle className="w-8 h-8 text-green-600" />
								</div>
								<CardTitle className="text-2xl font-light text-slate-900">
									Password Updated Successfully
								</CardTitle>
								<CardDescription className="text-slate-600 text-base">
									Your password has been securely updated
								</CardDescription>
							</CardHeader>

							<CardContent className="px-8 pb-8">
								<div className="space-y-6">
									<div className="bg-green-50 border border-green-200 rounded-lg p-4">
										<p className="text-sm text-green-800 leading-relaxed">
											Your password has been successfully updated. You can now sign in with your new password.
										</p>
									</div>

									<div className="text-center">
										<p className="text-sm text-slate-600 mb-4">
											Redirecting you to sign in page in a few seconds...
										</p>
										<Link href="/login">
											<Button className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-6 py-3 h-11">
												Continue to Sign In
												<ArrowRight className="ml-2 h-4 w-4" />
											</Button>
										</Link>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Security Notice */}
					<div className="mt-8 text-center">
						<div className="bg-white border border-slate-200 rounded-lg p-6">
							<div className="flex items-center justify-center mb-3">
								<div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
									<Shield className="w-4 h-4 text-slate-600" />
								</div>
							</div>
							<h3 className="text-sm font-semibold text-slate-900 mb-2">
								Secure Password Management
							</h3>
							<p className="text-xs text-slate-600 leading-relaxed">
								Your password is encrypted using industry-standard security protocols. 
								We recommend using a unique password that you don&apos;t use elsewhere.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}