'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
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
import { Mail, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '@/lib/api';

const formSchema = z.object({
	email: z.string().email({ message: 'Please enter a valid email address' }),
});

export default function ForgotPasswordPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const { toast } = useToast();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
		},
	});

	const mutation = useMutation({
		mutationFn: ({ email }) => authService.forgotPassword(email),
		onSuccess: () => {
			setIsSuccess(true);
			toast({ title: 'Reset email sent', description: 'Please check your email for password reset instructions.' });
		},
		onError: (error) => {
			const message = error?.response?.data?.message || error?.message || 'Failed to send reset email. Please try again.';
			toast({ title: 'Error', description: message, variant: 'destructive' });
		},
		onSettled: () => setIsLoading(false),
	});

	const onSubmit = async (values) => {
		try {
			setIsLoading(true);
			await mutation.mutateAsync({ email: values.email });
		} catch (e) {}
	};

	return (
		<div className="min-h-screen bg-slate-50">
			{/* Header */}
			<div className="bg-white border-b border-slate-200">
				<div className="max-w-7xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<Link href="/" className="text-xl font-semibold text-slate-900">
							Quaxt
						</Link>
						<div className="text-sm text-slate-600">
							Remember your password?{" "}
							<Link href="/login" className="font-medium text-slate-900 hover:text-slate-700 transition-colors">
								Sign in
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
							Reset Your Password
						</h1>
						<p className="text-lg text-slate-600">
							Enter your email address and we&apos;ll send you a secure reset link
						</p>
					</div>

					{!isSuccess ? (
						<Card className="bg-white border border-slate-200 shadow-sm">
							<CardHeader className="text-center pb-6">
								<div className="mx-auto mb-4 w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
									<Mail className="w-8 h-8 text-slate-600" />
								</div>
								<CardTitle className="text-2xl font-light text-slate-900">
									Password Recovery
								</CardTitle>
								<CardDescription className="text-slate-600 text-base">
									Provide your account email to receive reset instructions
								</CardDescription>
							</CardHeader>

							<CardContent className="px-8 pb-8">
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Email Address</FormLabel>
													<FormControl>
														<div className="relative">
															<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																type="email"
																placeholder="Enter your email address"
																className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white"
																autoComplete="email"
																{...field}
															/>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="space-y-4 pt-2">
											<Button
												type="submit"
												disabled={isLoading}
												className="w-full bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-6 py-3 h-11"
											>
												{isLoading ? "Sending Reset Link..." : "Send Reset Link"}
											</Button>

											<Link href="/login">
												<Button
													type="button"
													variant="outline"
													className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-6"
												>
													<ArrowLeft className="mr-2 h-4 w-4" />
													Back to Sign In
												</Button>
											</Link>
										</div>
									</form>
								</Form>
							</CardContent>
						</Card>
					) : (
						<Card className="bg-white border border-slate-200 shadow-sm">
							<CardHeader className="text-center pb-6">
								<div className="mx-auto mb-4 w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center">
									<CheckCircle className="w-8 h-8 text-green-600" />
								</div>
								<CardTitle className="text-2xl font-light text-slate-900">
									Check Your Email
								</CardTitle>
								<CardDescription className="text-slate-600 text-base">
									We&apos;ve sent password reset instructions to your email
								</CardDescription>
							</CardHeader>

							<CardContent className="px-8 pb-8">
								<div className="space-y-6">
									<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
										<p className="text-sm text-slate-700 leading-relaxed">
											A secure password reset link has been sent to <strong>{form.getValues('email')}</strong>. 
											Please check your inbox and follow the instructions to reset your password.
										</p>
									</div>

									<div className="text-center">
										<p className="text-xs text-slate-500 mb-4">
											Didn&apos;t receive the email? Check your spam folder or try again.
										</p>
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												setIsSuccess(false);
												form.reset();
											}}
											className="border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-6"
										>
											Send Another Email
										</Button>
									</div>

									<div className="pt-4">
										<Link href="/login">
											<Button
												type="button"
												variant="outline"
												className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-6"
											>
												<ArrowLeft className="mr-2 h-4 w-4" />
												Back to Sign In
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
								Secure Password Reset
							</h3>
							<p className="text-xs text-slate-600 leading-relaxed">
								Reset links are encrypted and expire after 24 hours for your security. 
								If you didn&apos;t request this reset, you can safely ignore this email.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}