'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
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
import { useAuth } from '@/context/AuthContext';
import { Building2, User, Mail, Phone, MapPin, Lock, ArrowRight, ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// School registration schema
const schoolFormSchema = z.object({
	name: z.string().min(2, { message: 'Institution name must be at least 2 characters' }),
	email: z.string().email({ message: 'Please enter a valid email address' }),
	phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
	address: z.string().min(5, { message: 'Address must be at least 5 characters' }),
});

// Admin registration schema
const adminFormSchema = z.object({
	firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
	lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
	email: z.string().email({ message: 'Please enter a valid email address' }),
	password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ['confirmPassword'],
});

export default function RegisterPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	const [schoolData, setSchoolData] = useState(null);
	const router = useRouter();
	const { register } = useAuth();
	const { toast } = useToast();
	
	// School form
	const schoolForm = useForm({
		resolver: zodResolver(schoolFormSchema),
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			address: '',
		},
	});
	
	// Admin form
	const adminForm = useForm({
		resolver: zodResolver(adminFormSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			password: '',
			confirmPassword: '',
		},
		mode: 'onChange',
	});
	
useEffect(() => {
		if (currentStep === 2) {
			const currentValues = adminForm.getValues();
			const hasValues = Object.values(currentValues).some(value => value !== '');
			
			if (!hasValues) {
				adminForm.reset({
					firstName: '',
					lastName: '',
					email: '',
					password: '',
					confirmPassword: '',
				});
			}
		}
}, [currentStep, adminForm]);
	
	const onSchoolSubmit = async (data) => {
		setSchoolData(data);
		setCurrentStep(2);
	};
	
const registerMutation = useMutation({
    mutationFn: (registrationData) => register(registrationData),
    onSuccess: () => {
        toast({ title: 'Registration successful', description: 'Your institution has been registered successfully.' });
        router.push('/login');
    },
    onError: (error) => {
        console.error('Registration error:', error);
        toast({ title: 'Registration failed', description: error?.message || 'An error occurred during registration.', variant: 'destructive' });
    },
    onSettled: () => setIsLoading(false),
});

const onAdminSubmit = async (values) => {
    try {
        setIsLoading(true);
        const { confirmPassword, ...adminData } = values;
        const registrationData = { school: schoolData, admin: adminData };
        await registerMutation.mutateAsync(registrationData);
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
							Already have an account?{" "}
							<Link href="/login" className="font-medium text-slate-900 hover:text-slate-700 transition-colors">
								Sign in
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-2xl w-full">
					{/* Progress Header */}
					<div className="text-center mb-8">
						<h1 className="text-3xl font-light tracking-tight text-slate-900 mb-2">
							Create Your Institution Account
						</h1>
						<p className="text-lg text-slate-600">
							Join the enterprise platform trusted by leading educational institutions
						</p>
					</div>

					{/* Progress Indicator */}
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
								<span className="text-sm font-medium">Institution Details</span>
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
								<span className="text-sm font-medium">Administrator Setup</span>
							</div>
						</div>
					</div>

					{/* Registration Card */}
					<Card className="bg-white border border-slate-200 shadow-sm">
						<CardHeader className="text-center pb-6">
							<div className="mx-auto mb-4 w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
								{currentStep === 1 ? (
									<Building2 className="w-8 h-8 text-slate-600" />
								) : (
									<User className="w-8 h-8 text-slate-600" />
								)}
							</div>
							<CardTitle className="text-2xl font-light text-slate-900">
								{currentStep === 1 ? "Institution Information" : "Administrator Setup"}
							</CardTitle>
							<CardDescription className="text-slate-600 text-base">
								{currentStep === 1
									? "Provide your institution's details to get started"
									: "Create your administrator account credentials"}
							</CardDescription>
						</CardHeader>

						<CardContent className="px-8 pb-8">
							{currentStep === 1 ? (
								<Form {...schoolForm}>
									<form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-6">
										<FormField
											control={schoolForm.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Institution Name</FormLabel>
													<FormControl>
														<div className="relative">
															<Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																placeholder="Enter institution name"
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
											control={schoolForm.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Institution Email</FormLabel>
													<FormControl>
														<div className="relative">
															<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																placeholder="contact@institution.edu"
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
											control={schoolForm.control}
											name="phone"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Phone Number</FormLabel>
													<FormControl>
														<div className="relative">
															<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																placeholder="+1 (555) 123-4567"
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
											control={schoolForm.control}
											name="address"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Institution Address</FormLabel>
													<FormControl>
														<div className="relative">
															<MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																placeholder="123 Education Ave, City, State 12345"
																className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white"
																{...field}
															/>
														</div>
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
												{isLoading ? (
													"Processing..."
												) : (
													<>
														Continue to Administrator Setup
														<ArrowRight className="ml-2 h-4 w-4" />
													</>
												)}
											</Button>
										</div>
									</form>
								</Form>
							) : (
								<Form {...adminForm} key={`admin-form-${currentStep}`}>
									<form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-6">
										<div className="grid grid-cols-2 gap-4">
											<FormField
												control={adminForm.control}
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
																	autoComplete="given-name"
																	{...field}
																/>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											
											<FormField
												control={adminForm.control}
												name="lastName"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-sm font-medium text-slate-700">Last Name</FormLabel>
														<FormControl>
															<Input
																placeholder="Doe"
																className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white"
																autoComplete="family-name"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										
										<FormField
											control={adminForm.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Administrator Email</FormLabel>
													<FormControl>
														<div className="relative">
															<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																placeholder="admin@institution.edu"
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
										
										<FormField
											control={adminForm.control}
											name="password"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Password</FormLabel>
													<FormControl>
														<div className="relative">
															<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																type="password"
																placeholder="Create a secure password"
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
											control={adminForm.control}
											name="confirmPassword"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">Confirm Password</FormLabel>
													<FormControl>
														<div className="relative">
															<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
															<Input
																type="password"
																placeholder="Confirm your password"
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
											<Button
												type="submit"
												disabled={isLoading}
												className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-6 py-3 h-11"
											>
												{isLoading ? "Creating Account..." : "Complete Registration"}
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
								Enterprise Security & Compliance
							</h3>
							<p className="text-xs text-slate-600 leading-relaxed">
								Your data is protected with enterprise-grade security. We comply with FERPA, 
								GDPR, and industry best practices to ensure your institution&apos;s information remains secure.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}