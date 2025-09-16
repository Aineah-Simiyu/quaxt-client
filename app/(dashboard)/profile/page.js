'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils';
import { getRoleDisplayName } from '@/lib/constants';
import { User, Lock, Camera, Mail, Calendar, Shield, Settings } from 'lucide-react';

// Fixed Form validation schema to include firstName and lastName
const profileSchema = z.object({
	firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
	lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
	email: z.string().email({ message: 'Please enter a valid email address' }),
});

const passwordSchema = z.object({
	currentPassword: z.string().min(1, { message: 'Current password is required' }),
	newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
	confirmPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
	message: "Passwords don't match",
	path: ['confirmPassword'],
});

export default function ProfilePage() {
	const { user, updateProfile } = useAuth();
	const [loading, setLoading] = useState(false);
	const [passwordLoading, setPasswordLoading] = useState(false);
	const [avatarFile, setAvatarFile] = useState(null);
	const [avatarPreview, setAvatarPreview] = useState('');
	const { toast } = useToast();
	
	// Fixed Profile form with correct default values
	const profileForm = useForm({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: '',
		},
	});
	
	// Password form
	const passwordForm = useForm({
		resolver: zodResolver(passwordSchema),
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		},
	});
	
	// Set form values when user data is available
	useEffect(() => {
		if (user) {
			profileForm.reset({
				lastName: user.lastName || '',
				firstName: user.firstName || '',
				email: user.email || '',
			});
			setAvatarPreview(user.avatar || '');
		}
	}, [user, profileForm]);
	
	// Handle profile update
	const onProfileSubmit = async (data) => {
		try {
			setLoading(true);
			await updateProfile(data);
			toast({ title: 'Success', description: 'Profile updated successfully' });
		} catch (error) {
			const errorMessage = error.response?.data?.message ||
				error.response?.data?.errors?.[0]?.msg ||
				'Failed to update profile';
			toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
			console.error('Profile update error:', error);
		} finally {
			setLoading(false);
		}
	};
	
	// Handle password update
	const onPasswordSubmit = async (data) => {
		try {
			setPasswordLoading(true);
			await userService.changePassword(data);
			toast({ title: 'Success', description: 'Password updated successfully' });
			passwordForm.reset();
		} catch (error) {
			const errorMessage = error.response?.data?.message ||
				error.response?.data?.errors?.[0]?.msg ||
				'Failed to update password';
			toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
			console.error('Password update error:', error);
		} finally {
			setPasswordLoading(false);
		}
	};
	
	// Handle avatar change
	const handleAvatarChange = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		
		if (file.size > 5 * 1024 * 1024) {
			toast({ title: 'Error', description: 'Image size should be less than 5MB', variant: 'destructive' });
			return;
		}
		
		setAvatarFile(file);
		setAvatarPreview(URL.createObjectURL(file));
		
		try {
			setLoading(true);
			const formData = new FormData();
			formData.append('avatar', file);
			await userService.updateAvatar(formData);
			toast({ title: 'Success', description: 'Avatar updated successfully' });
		} catch (error) {
			const errorMessage = error.response?.data?.message ||
				error.response?.data?.errors?.[0]?.msg ||
				'Failed to update avatar';
			toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
			console.error('Avatar update error:', error);
			// Reset avatar preview on error
			setAvatarPreview(user?.avatar || '');
			setAvatarFile(null);
		} finally {
			setLoading(false);
		}
	};
	
	const getRoleBadgeColor = (role) => {
		switch (role) {
			case 'ADMIN':
				return 'bg-red-500/20 text-red-700 border-red-500/30';
			case 'SCHOOL_ADMIN':
				return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
			case 'TRAINER':
				return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
			case 'STUDENT':
				return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
			default:
				return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
		}
	};
	
	return (
		<div className="min-h-screen bg-slate-50">
			<div className="max-w-4xl mx-auto px-6 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-light text-slate-900 tracking-tight">Profile Settings</h1>
					<p className="text-slate-600 mt-1 font-normal">
						Manage your account information and preferences
					</p>
				</div>
				
				<div className="grid lg:grid-cols-12 gap-8">
					{/* Profile Overview Sidebar */}
					<div className="lg:col-span-4">
						<Card className="bg-white border border-slate-200 shadow-sm">
							<CardContent className="p-6 text-center">
								<div className="relative inline-block mb-6">
									<Avatar className="h-24 w-24 border-2 border-slate-200">
										<AvatarImage src={user?.avatar} alt={user?.firstName  + " " + user?.lastName || 'User'} />
										<AvatarFallback className="text-lg font-semibold bg-slate-100 text-slate-700">
											{getInitials(user?.firstName  + " " + user?.lastName || 'User')}
										</AvatarFallback>
									</Avatar>
									<label
										htmlFor="avatar-upload"
										className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-lg"
									>
										<Camera className="h-4 w-4" />
										<span className="sr-only">Change avatar</span>
									</label>
									<Input
										id="avatar-upload"
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleAvatarChange}
									/>
								</div>
								
								<div className="space-y-3">
									<h3 className="text-xl font-semibold text-slate-900">{user?.name}</h3>
									<div className="flex items-center justify-center gap-2 text-sm text-slate-600">
										<Mail className="h-4 w-4" />
										<span>{user?.email}</span>
									</div>
									<Badge variant="outline" className={`${getRoleBadgeColor(user?.role)} font-medium`}>
										<Shield className="h-3 w-3 mr-1" />
										{getRoleDisplayName(user?.role)}
									</Badge>
								</div>
								
								<Separator className="my-6" />
								
								<div className="space-y-4 text-sm">
									<div className="flex items-center gap-3 text-slate-600">
										<Calendar className="h-4 w-4 flex-shrink-0" />
										<div className="text-left">
											<p className="font-medium">Member since</p>
											<p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
												month: 'long',
												year: 'numeric'
											}) : 'Unknown'}</p>
										</div>
									</div>
									{user?.lastLogin && (
										<div className="flex items-center gap-3 text-slate-600">
											<User className="h-4 w-4 flex-shrink-0" />
											<div className="text-left">
												<p className="font-medium">Last active</p>
												<p>{new Date(user.lastLogin).toLocaleDateString('en-US', {
													month: 'short',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit'
												})}</p>
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
					
					{/* Main Content */}
					<div className="lg:col-span-8">
						<Tabs defaultValue="account" className="space-y-6">
							<TabsList className="bg-white border border-slate-200 p-1 h-auto shadow-sm">
								<TabsTrigger
									value="account"
									className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600 font-medium px-4 py-2 h-9"
								>
									<User className="h-4 w-4 mr-2" />
									Account
								</TabsTrigger>
								<TabsTrigger
									value="security"
									className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600 font-medium px-4 py-2 h-9"
								>
									<Lock className="h-4 w-4 mr-2" />
									Security
								</TabsTrigger>
								<TabsTrigger
									value="preferences"
									className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600 font-medium px-4 py-2 h-9"
								>
									<Settings className="h-4 w-4 mr-2" />
									Preferences
								</TabsTrigger>
							</TabsList>
							
							{/* Account Tab */}
							<TabsContent value="account">
								<Card className="bg-white border border-slate-200 shadow-sm">
									<CardHeader className="pb-4">
										<CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
										<CardDescription className="text-sm text-slate-600">
											Update your account details and contact information.
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
											<div className="grid gap-4 sm:grid-cols-2">
												<div className="space-y-2">
													<Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
													<Input
														id="firstName"
														{...profileForm.register('firstName')}
														placeholder="Enter your first name"
														className="h-10 border-slate-200 focus:border-slate-400 focus:ring-0"
													/>
													{profileForm.formState.errors.firstName && (
														<p className="text-xs text-red-600">
															{profileForm.formState.errors.firstName.message}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
													<Input
														id="lastName"
														{...profileForm.register('lastName')}
														placeholder="Enter your last name"
														className="h-10 border-slate-200 focus:border-slate-400 focus:ring-0"
													/>
													{profileForm.formState.errors.lastName && (
														<p className="text-xs text-red-600">
															{profileForm.formState.errors.lastName.message}
														</p>
													)}
												</div>
											</div>
											
											<div className="space-y-2">
												<Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
												<Input
													id="email"
													type="email"
													{...profileForm.register('email')}
													placeholder="Enter your email"
													className="h-10 border-slate-200 focus:border-slate-400 focus:ring-0"
												/>
												{profileForm.formState.errors.email && (
													<p className="text-xs text-red-600">
														{profileForm.formState.errors.email.message}
													</p>
												)}
											</div>
											
											<div className="pt-4">
												<Button
													type="submit"
													disabled={loading}
													className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-6"
												>
													{loading ? 'Saving...' : 'Save Changes'}
												</Button>
											</div>
										</form>
									</CardContent>
								</Card>
							</TabsContent>
							
							{/* Security Tab */}
							<TabsContent value="security">
								<Card className="bg-white border border-slate-200 shadow-sm">
									<CardHeader className="pb-4">
										<CardTitle className="text-lg font-semibold">Change Password</CardTitle>
										<CardDescription className="text-sm text-slate-600">
											Update your password to keep your account secure.
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
												<Input
													id="currentPassword"
													type="password"
													{...passwordForm.register('currentPassword')}
													className="h-10 border-slate-200 focus:border-slate-400 focus:ring-0"
													placeholder="Enter current password"
												/>
												{passwordForm.formState.errors.currentPassword && (
													<p className="text-xs text-red-600">
														{passwordForm.formState.errors.currentPassword.message}
													</p>
												)}
											</div>
											
											<div className="grid gap-4 sm:grid-cols-2">
												<div className="space-y-2">
													<Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
													<Input
														id="newPassword"
														type="password"
														{...passwordForm.register('newPassword')}
														className="h-10 border-slate-200 focus:border-slate-400 focus:ring-0"
														placeholder="Enter new password"
													/>
													{passwordForm.formState.errors.newPassword && (
														<p className="text-xs text-red-600">
															{passwordForm.formState.errors.newPassword.message}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
													<Input
														id="confirmPassword"
														type="password"
														{...passwordForm.register('confirmPassword')}
														className="h-10 border-slate-200 focus:border-slate-400 focus:ring-0"
														placeholder="Confirm new password"
													/>
													{passwordForm.formState.errors.confirmPassword && (
														<p className="text-xs text-red-600">
															{passwordForm.formState.errors.confirmPassword.message}
														</p>
													)}
												</div>
											</div>
											
											<div className="pt-4">
												<Button
													type="submit"
													disabled={passwordLoading}
													className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-6"
												>
													{passwordLoading ? 'Updating...' : 'Update Password'}
												</Button>
											</div>
										</form>
										
										<Separator />
										
										<div className="space-y-4">
											<h4 className="text-sm font-medium text-slate-900">Password Requirements</h4>
											<ul className="text-xs text-slate-600 space-y-1">
												<li>• At least 8 characters long</li>
												<li>• Include uppercase and lowercase letters</li>
												<li>• Include at least one number</li>
												<li>• Include at least one special character</li>
											</ul>
										</div>
									</CardContent>
								</Card>
							</TabsContent>
							
							{/* Preferences Tab */}
							<TabsContent value="preferences">
								<Card className="bg-white border border-slate-200 shadow-sm">
									<CardHeader className="pb-4">
										<CardTitle className="text-lg font-semibold">Account Preferences</CardTitle>
										<CardDescription className="text-sm text-slate-600">
											Customize your experience and notification settings.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="text-center py-12 text-slate-500">
											<Settings className="h-8 w-8 mx-auto mb-3" />
											<p className="text-sm">Preferences panel coming soon</p>
											<p className="text-xs mt-1">Configure notifications, themes, and other settings</p>
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</div>
				</div>
				
				{/* Footer */}
				<div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
					<p>Last updated: {new Date().toLocaleDateString('en-US', {
						month: 'long',
						day: 'numeric',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					})}</p>
				</div>
			</div>
		</div>
	);
}