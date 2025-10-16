'use client';

import { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import './change-password.css';
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
import { Lock, ArrowRight, Shield, AlertTriangle, User, Phone, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import authService from '@/lib/api/authService';
import userService from '@/lib/api/userService';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// KYC form schema for student users
const kycFormSchema = z.object({
	firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
	lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
	phoneNumber: z.string()
		.min(1, { message: 'Phone number is required' })
		.refine((value) => {
			if (!value) return false;
			
			const digitsOnly = value.replace(/\D/g, '');
			
			// Special validation for Kenyan numbers
			if (value.startsWith('+254')) {
				// Kenya: country code (254) + exactly 9 digits = 12 total
				if (digitsOnly.length !== 12) return false;
				// Check that it starts with valid Kenyan mobile prefixes (7, 1, or 0)
				const localNumber = digitsOnly.substring(3); // Remove 254
				if (!localNumber.match(/^[710]/)) return false;
			} else {
				// For other countries, also limit strictly
				if (digitsOnly.length < 7 || digitsOnly.length > 12) return false;
			}
			
			// Check for repeated patterns (like 1111111111)
			const uniqueDigits = new Set(digitsOnly).size;
			if (uniqueDigits < 3 && digitsOnly.length > 6) return false;
			
			return true;
		}, {
			message: 'Please enter a valid phone number (Kenyan numbers should have 9 digits after +254)'
		}),
});

// Password change form schema
const createFormSchema = z.object({
	currentPassword: z.string().min(1, { message: 'Current password is required' }),
	password: z.string().min(8, { message: 'New password must be at least 8 characters' }),
	confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ['confirmPassword'],
});

const ChangePasswordPage = memo(function ChangePasswordPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	const [kycData, setKycData] = useState(null);
	const router = useRouter();
	const { toast } = useToast();
	const { logout, user } = useAuth();

	// Determine if user needs KYC step (student role and isPhone false)
	const needsKyc = user?.role === 'student' || user?.role === 'trainer' && !user?.isPhone;

	// KYC form for step 1
	const kycForm = useForm({
		resolver: zodResolver(kycFormSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			phoneNumber: '',
		},
	});

	// Password change form for step 2 (or step 1 if no KYC needed)
	const passwordForm = useForm({
		resolver: zodResolver(createFormSchema),
		defaultValues: {
			currentPassword: '',
			password: '', // Fixed: changed from newPassword to password
			confirmPassword: '',
		},
		mode: 'onChange',
	});

	// Set initial step based on whether KYC is needed
	useEffect(() => {
		if (!needsKyc) {
			setCurrentStep(2); // Skip to password change step
		}
	}, [needsKyc]);


	// Handle KYC form submission (Step 1)
    const onKycSubmit = async (data) => {
		setKycData(data);
		setCurrentStep(2);
	};

    // Mutations
    const profileMutation = useMutation({
        mutationFn: (payload) => userService.updateUser(user._id, payload),
    });

    const changePasswordMutation = useMutation({
        mutationFn: (payload) => authService.changePassword(payload),
    });

    // Handle password change form submission (Step 2)
    const onPasswordSubmit = useCallback(async (values) => {
        setIsLoading(true);
        try {
            if (kycData) {
                const profileUpdateData = {
                    firstName: kycData.firstName,
                    lastName: kycData.lastName,
                    phoneNumber: kycData.phoneNumber,
                    _ip_iT: 1,
                };
                await profileMutation.mutateAsync(profileUpdateData);
            }

            const passwordPayload = {
                currentPassword: values.currentPassword,
                newPassword: values.password,
            };
            await changePasswordMutation.mutateAsync(passwordPayload);

            toast({
                title: 'Setup Complete!',
                description: kycData
                    ? 'Your profile has been updated and password changed successfully. Please log in again.'
                    : 'Your password has been updated. Please log in again with your new password.',
                variant: 'default',
            });

            setTimeout(async () => {
                await logout();
                router.push('/login');
            }, 1500);
        } catch (error) {
            toast({
                title: kycData ? 'Setup Failed' : 'Password Change Failed',
                description: error?.response?.data?.message || 'An error occurred while updating your information.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, logout, router, user, kycData, profileMutation, changePasswordMutation]);

	const handleLogout = async () => {
		try {
			await logout();
			router.push('/login');
		} catch (error) {
			console.error('Logout error:', error);
		}
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
						<Button
							variant="outline"
							onClick={handleLogout}
							className="border-slate-200 text-slate-600 hover:bg-slate-50"
						>
							Logout
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-2xl w-full">
					{/* Progress Header */}
					<div className="text-center mb-8">
						<div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
							<AlertTriangle className="w-8 h-8 text-white" />
						</div>
						<h1 className="text-3xl font-light tracking-tight text-slate-900 mb-2">
							{needsKyc ? 'Complete Your Profile' : 'Password Change Required'}
						</h1>
						<p className="text-lg text-slate-600">
							{needsKyc 
								? 'Please complete your profile information and change your password'
								: 'For security reasons, you must change your password before accessing your account'
							}
						</p>
					</div>

					{/* Progress Indicator - Only show if KYC is needed */}
					{needsKyc && (
						<div className="mb-8">
							<div className="flex items-center justify-center space-x-4">
								<div className={`flex items-center space-x-2 ${
									currentStep === 1 ? "text-slate-900" : "text-slate-400"
								}`}>
									<div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
										currentStep === 1 
											? "bg-slate-900 border-slate-900 text-white" 
											: currentStep > 1 
											? "bg-slate-100 border-slate-300 text-slate-600" 
											: "border-slate-300 text-slate-400"
									}`}>
										{currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
									</div>
									<span className="text-sm font-medium">Profile Information</span>
								</div>
								<div className={`w-16 h-0.5 ${
									currentStep > 1 ? "bg-slate-300" : "bg-slate-200"
								}`}></div>
								<div className={`flex items-center space-x-2 ${
									currentStep === 2 ? "text-slate-900" : "text-slate-400"
								}`}>
									<div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
										currentStep === 2 
											? "bg-slate-900 border-slate-900 text-white" 
											: currentStep > 2 
											? "bg-slate-100 border-slate-300 text-slate-600" 
											: "border-slate-300 text-slate-400"
									}`}>
										{currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : "2"}
									</div>
									<span className="text-sm font-medium">Password Setup</span>
								</div>
							</div>
						</div>
					)}

					{/* Form Card */}
					<Card className="bg-white border border-slate-200 shadow-sm">
						<CardHeader className="text-center pb-6">
							<div className="mx-auto mb-4 w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
								{currentStep === 1 ? (
									<User className="w-8 h-8 text-slate-600" />
								) : (
									<Shield className="w-8 h-8 text-slate-600" />
								)}
							</div>
							<CardTitle className="text-2xl font-light text-slate-900">
								{currentStep === 1 ? "Profile Information" : "Change Your Password"}
							</CardTitle>
							<CardDescription className="text-slate-600 text-base">
								{currentStep === 1
									? "Please provide your personal information to complete your profile"
									: "Enter your current password and choose a new secure password"}
							</CardDescription>
						</CardHeader>

						<CardContent className="px-8 pb-8">
							{currentStep === 1 ? (
								// Step 1: KYC Form
								<Form {...kycForm}>
									<form onSubmit={kycForm.handleSubmit(onKycSubmit)} className="space-y-6">
										<div className="grid grid-cols-2 gap-4">
											<FormField
												control={kycForm.control}
												name="firstName"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-sm font-medium text-slate-700">First Name</FormLabel>
														<FormControl>
															<div className="relative">
																<User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
																<Input
																	placeholder="John"
																	className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white"
																	{...field}
																/>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											
											<FormField
												control={kycForm.control}
												name="lastName"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-sm font-medium text-slate-700">Last Name</FormLabel>
														<FormControl>
															<Input
																placeholder="Doe"
																className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										
										<FormField
											control={kycForm.control}
											name="phoneNumber"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Phone Number</FormLabel>
													<FormControl>
														<PhoneInput
															placeholder="Enter phone number"
															value={field.value}
															onChange={(value) => {
																// Strictly limit Kenyan numbers to 9 digits after country code
																if (value) {
																	const digitsOnly = value.replace(/\D/g, '');
																	
																	if (value.startsWith('254')) {
																		// For Kenya: EXACTLY 12 digits total (254 + 9)
																		if (digitsOnly.length <= 12) {
																			field.onChange('+' + value);
																		}
																		// Don't allow more than 12 digits for Kenya
																	} else {
																		// For other countries, also limit to reasonable length
																		if (digitsOnly.length <= 12) {
																			field.onChange('+' + value);
																		}
																	}
																} else {
																	field.onChange('');
																}
															}}
															country="ke"
															enableSearch={true}
															disableCountryCode={false}
															containerClass="phone-input-custom"
															inputClass="border border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white rounded-md px-3 py-2 w-full"
															buttonClass="border border-slate-200 rounded-l-md"
															dropdownClass="border border-slate-200 rounded-md shadow-lg"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										
										<div className="pt-4">
											<Button
												type="submit"
												disabled={isLoading}
												className="w-full bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-6 py-3 h-11"
											>
												Continue to Password Setup
												<ArrowRight className="ml-2 h-4 w-4" />
											</Button>
										</div>
									</form>
								</Form>
							) : (
								// Step 2: Password Change Form
								<Form {...passwordForm} key="password-form">
									<form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
										<FormField
											control={passwordForm.control}
											name="currentPassword"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Current Password</FormLabel>
													<FormControl>
														<div className="relative">
															<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																type="password"
																placeholder="Enter your current password"
																className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white"
																autoComplete="current-password"
																{...field}
															/>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										

										<FormField
											control={passwordForm.control}
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
																key="new-password-field"
																{...field}
															/>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={passwordForm.control}
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
										
										<div className="flex justify-between pt-4">
											{needsKyc && (
												<Button
													type="button"
													variant="outline"
													onClick={() => setCurrentStep(1)}
													disabled={isLoading}
													className="border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-6"
												>
													<ArrowLeft className="mr-2 h-4 w-4" />
													Previous
												</Button>
											)}
											<Button
												type="submit"
												disabled={isLoading}
												className={`bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-6 py-3 h-11 ${!needsKyc ? 'w-full' : ''}`}
											>
												{isLoading ? (
													<div className="flex items-center justify-center gap-2">
														<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
														Changing Password...
													</div>
												) : (
													"Complete Setup"
												)}
											</Button>
										</div>
									</form>
								</Form>
							)}
						</CardContent>
					</Card>

					{/* Security Notice */}
					<div className="mt-8 text-center">
						<div className="bg-white border border-slate-200 rounded-lg p-6">
							<div className="flex items-center justify-center mb-3">
								<div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
									<Shield className="w-4 h-4 text-slate-600" />
								</div>
							</div>
							<h3 className="text-sm font-semibold text-slate-900 mb-2">
								Security & Privacy
							</h3>
							<p className="text-xs text-slate-600 leading-relaxed">
								{currentStep === 1 
									? "Your personal information is securely stored and used only for account verification purposes."
									: "This password change is required for security purposes. Choose a strong password with at least 8 characters."
								}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});

export default ChangePasswordPage;