'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { useNotifiq } from '@/providers/notificationProvider';
import { Button } from '@/components/ui/button';
import {apiClient} from '@/lib/api';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
// import { useSocketAuth } from '@/hooks/useSocketAuth';

const formSchema = z.object({
	email: z.string().email({ message: 'Please enter a valid email address' }),
	password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function LoginPage() {
	const { client, ready } = useNotifiq();
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { login } = useAuth();
	// const { authenticateSocket } = useSocketAuth();
	
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const getToken = async () => {
		if (!ready) return;
		const token = await client.getToken(); // v2 instance method
		
	};

	const registerUserToken = async (token) => {
		try {
			
			const newRes = await apiClient.post("/fcm-tokens", {
				token,
				deviceType: "web",
			});

			if (!newRes.ok) {
				throw new Error(`HTTP ${newRes.status}: ${newRes.statusText}`);
			}

			
		} catch (err) {
			console.error("Failed to register FCM token:", err);
		}
  };
	
	const loginMutation = useMutation({
		mutationFn: (values) => login(values),
		onSuccess: async (userData) => {
			localStorage.clear();
			if (!userData.mustChangePassword || !userData.emailVerified) {
				const token = await client.getToken();
				await registerUserToken(token);
				router.replace('/dashboard');
			}
		},
		onError: (error) => {
			console.error('Login error:', error);
		},
		onSettled: () => setIsLoading(false),
	});

	const onSubmit = async (values) => {
		try {
			setIsLoading(true);
			await loginMutation.mutateAsync(values);
		} catch (e) {}
	};
	
	return (
		<div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="text-center mb-8">
					<Link href="https://quaxt.co.ke" className="inline-block mb-6">
						<h1 className="text-2xl font-semibold text-slate-900">Quaxt</h1>
					</Link>
					<h2 className="text-3xl font-light tracking-tight text-slate-900 mb-2">
						Welcome Back
					</h2>
					<p className="text-slate-600 leading-relaxed">
						Sign in to access your enterprise dashboard
					</p>
				</div>
				
				{/* Login Card */}
				<Card className="bg-white border border-slate-200 shadow-sm">
					<CardContent className="p-8">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm font-medium text-slate-700">
												Email Address
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
													<Input
														placeholder="you@company.com"
														className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white text-sm h-11"
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
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm font-medium text-slate-700">
												Password
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
													<Input
														type="password"
														placeholder="Enter your password"
														className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white text-sm h-11"
														{...field}
													/>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								
								<div className="flex items-center justify-between">
									<div className="text-sm">
										<Link
											href="/forgot-password"
											className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
										>
											Forgot your password?
										</Link>
									</div>
								</div>
								
								<Button
									type="submit"
									className="w-full bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium h-11 text-sm"
									disabled={isLoading}
								>
									{isLoading ? 'Signing in...' : 'Sign in to Dashboard'}
									{!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
				
				{/* Footer */}
				<div className="text-center mt-8">
					<p className="text-sm text-slate-600">
						New to Quaxt?{' '}
						<Link href="/register" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
							Create an account
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}