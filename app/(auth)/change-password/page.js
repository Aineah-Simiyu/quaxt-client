'use client';

import { useState, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Lock, ArrowRight, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import authService from '@/lib/api/authService';

const formSchema = z.object({
	currentPassword: z.string().min(1, { message: 'Current password is required' }),
	password: z.string().min(8, { message: 'New password must be at least 8 characters' }),
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ['confirmPassword'],
});

const ChangePasswordPage = memo(function ChangePasswordPage() {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { toast } = useToast();
	const { user, logout } = useAuth();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			currentPassword: '',
			password: '',
			confirmPassword: '',
		},
	});

	const onSubmit = useCallback(async (values) => {
		setIsLoading(true);
		try {
			await authService.changePassword({
				currentPassword: values.currentPassword,
				newPassword: values.password,
			});

			toast({
				title: 'Password Changed Successfully',
				description: 'Your password has been updated. Please log in again with your new password.',
				variant: 'default',
			});

			// Log out user and redirect to login after successful password change
			setTimeout(async () => {
				await logout();
				router.push('/login');
			}, 1500);
		} catch (error) {
			toast({
				title: 'Password Change Failed',
				description: error.response?.data?.message || 'An error occurred while changing your password.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	}, [toast, logout, router]);

	const handleLogout = async () => {
		try {
			await logout();
			router.push('/login');
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8">
			<div className="w-full max-w-md space-y-6">
				{/* Header */}
				<div className="text-center space-y-2">
					<div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
						<AlertTriangle className="w-8 h-8 text-white" />
					</div>
					<h1 className="text-2xl font-bold text-slate-900">Password Change Required</h1>
					<p className="text-slate-600 text-sm leading-relaxed">
						For security reasons, you must change your password before accessing your account.
					</p>
				</div>

				{/* Form Card */}
				<Card className="border-slate-200 shadow-xl">
					<CardHeader className="space-y-1 pb-6">
						<CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
							<Shield className="w-5 h-5 text-slate-700" />
							Change Your Password
						</CardTitle>
						<CardDescription className="text-slate-600">
							Enter your current password and choose a new secure password.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
								<FormField
									control={form.control}
									name="currentPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-slate-700 font-medium">Current Password</FormLabel>
											<FormControl>
												<div className="relative">
													<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
													<Input
														type="password"
														placeholder="Enter your current password"
														className="pl-10 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
														{...field}
													/>
												</div>
											</FormControl>
											<FormMessage className="text-red-600" />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-slate-700 font-medium">New Password</FormLabel>
											<FormControl>
												<div className="relative">
													<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
													<Input
														type="password"
														placeholder="Enter your new password"
														className="pl-10 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
														{...field}
													/>
												</div>
											</FormControl>
											<FormMessage className="text-red-600" />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="confirmPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-slate-700 font-medium">Confirm New Password</FormLabel>
											<FormControl>
												<div className="relative">
													<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
													<Input
														type="password"
														placeholder="Confirm your new password"
														className="pl-10 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
														{...field}
													/>
												</div>
											</FormControl>
											<FormMessage className="text-red-600" />
										</FormItem>
									)}
								/>

								<div className="space-y-3 pt-2">
									<Button
										type="submit"
										disabled={isLoading}
										className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 transition-colors duration-200"
									>
										{isLoading ? (
											<div className="flex items-center justify-center gap-2">
												<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
												Changing Password...
											</div>
										) : (
											<div className="flex items-center justify-center gap-2">
												Change Password
												<ArrowRight className="w-4 h-4" />
											</div>
										)}
									</Button>

									<Button
										type="button"
										variant="outline"
										onClick={handleLogout}
										className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
									>
										Logout Instead
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>

				{/* Security Notice */}
				<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<div className="flex items-start gap-3">
						<Shield className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
						<div className="text-sm text-slate-600">
							<p className="font-medium mb-1">Security Notice</p>
							<p className="text-xs leading-relaxed">
								This password change is required for security purposes. Choose a strong password with at least 8 characters.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});

export default ChangePasswordPage;