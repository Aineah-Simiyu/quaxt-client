"use client";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { userService, whatsappService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { getRoleDisplayName, ROLES, isSchoolAdmin } from "@/lib/constants";
import {
  User,
  Lock,
  Camera,
  Mail,
  Calendar,
  Shield,
  Settings,
  MessageSquare,
  Smartphone,
  Wifi,
  WifiOff,
  QrCode,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
} from "lucide-react";
import Image from 'next/image'

// ... (rest of imports and schemas unchanged)
const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters" }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
});
const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  // WhatsApp integration state
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({
    isConnected: false,
    status: "DISCONNECTED",
    connectionText: "Disconnected",
    statusText: "Inactive",
    sessionId: null,
    connectedAt: null,
    lastUpdated: null,
    hasActiveSession: false,
  });
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [sessionName, setSessionName] = useState("");
  const [isSessionSaved, setIsSessionSaved] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Hello from your school! This is a test message.",
  );
  const [testLoading, setTestLoading] = useState(false);
  const [sessions, setSessions] = useState([]);

  // ... (profileForm, passwordForm setup unchanged)
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        lastName: user.lastName || "",
        firstName: user.firstName || "",
        email: user.email || "",
      });
      setAvatarPreview(user.avatar || "");
    }
  }, [user, profileForm]);

  // React Query: WhatsApp sessions
  const sessionsQuery = useQuery({
    queryKey: ["whatsappSessions", user?.school?._id || user?.school],
    enabled: !!user && isSchoolAdmin(user) && !!user?.school,
    queryFn: async () => whatsappService.getSessions(),
  });

  useEffect(() => {
    const resp = sessionsQuery.data;
    const docs = resp?.data?.docs || resp?.data || resp || [];
    if (Array.isArray(docs)) {
      setSessions(docs);
      if (docs.length > 0) {
        setWhatsappEnabled(true);
        setIsSessionSaved(true);
      } else {
        setWhatsappEnabled(false);
        setIsSessionSaved(false);
      }
    }
  }, [sessionsQuery.data]);

  // Determine target session (prefer non-closed)
  const targetSessionId = (() => {
    if (!sessions || sessions.length === 0) return null;
    const active = sessions.find((s) => s.metaData?.status !== "CLOSED");
    return (active?._id) || sessions[0]?._id || null;
  })();

  // React Query: WhatsApp status for selected session, polled when connect modal open
  const statusQuery = useQuery({
    queryKey: ["whatsappStatus", targetSessionId],
    enabled: !!user && isSchoolAdmin(user) && !!user?.school && !!targetSessionId && showConnectModal,
    queryFn: async () => whatsappService.getSessionStatus(targetSessionId),
    refetchInterval: showConnectModal ? 3000 : false,
  });

  useEffect(() => {
    if (!targetSessionId) {
      setWhatsappStatus({
        isConnected: false,
        status: "DISCONNECTED",
        connectionText: "Disconnected",
        statusText: "Inactive",
        sessionId: null,
        connectedAt: null,
        lastUpdated: null,
        hasActiveSession: false,
      });
      return;
    }
    const resp = statusQuery.data;
    const data = resp?.data || resp;
    if (!data) return;
    const isConnected = data.connection === "connected";
    setWhatsappStatus({
      isConnected,
      status: data.connection || "DISCONNECTED",
      connectionText: isConnected ? "Connected" : "Disconnected",
      statusText: data.connection || "Inactive",
      sessionId: targetSessionId,
      connectedAt: data.connectedAt,
      lastUpdated: data.lastUpdated,
      hasActiveSession: isConnected,
    });
    if (isConnected) setIsSessionSaved(true);
  }, [targetSessionId, statusQuery.data]);

  // Close modal and refresh when connected
  useEffect(() => {
    if (!showConnectModal) return;
    if (whatsappStatus.isConnected || whatsappStatus.status === "connected") {
      toast({
        title: "Connection Successful!",
        description: "WhatsApp has been connected successfully.",
        variant: "default",
      });
      setTimeout(() => {
        setShowConnectModal(false);
        qc.invalidateQueries({ queryKey: ["whatsappSessions"] });
        // Full reload to ensure all dependent data reflects connection
        window.location.reload();
      }, 500);
    }
  }, [showConnectModal, whatsappStatus.isConnected, whatsappStatus.status, qc, toast]);



  // Step 1: Toggle only enables UI
  const handleWhatsappToggle = (enabled) => {
    if (sessions.length > 0) {
      // If sessions exist, don't allow disabling
      toast({
        title: "Cannot Disable",
        description: "You have active sessions. Please disconnect them first.",
        variant: "destructive",
      });
      return;
    }
    
    setWhatsappEnabled(enabled);
    if (!enabled) {
      // Reset entire flow
      setSessionName("");
      setIsSessionSaved(false);
      setShowConnectModal(false);
      setQrCode(null);
    }
  };

  // Step 2 & 3: Save session name to DB
  const handleSaveSessionName = async () => {
    if (!sessionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a session name",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSessionMutation.mutateAsync({ schoolId: user.school?._id || user.school, label: sessionName });
      setIsSessionSaved(true);
      toast({
        title: "Session Saved",
        description: "Session name saved successfully.",
      });
      setTimeout(() => {
        window.location.reload()
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: whatsappService.formatError(error),
        variant: "destructive",
      });
    }
  };

  // Mutation: create session
  const createSessionMutation = useMutation({
    mutationFn: async ({ schoolId, label }) => whatsappService.createSession(schoolId, label),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsappSessions"] }),
  });

  // Handle modal close and reload sessions if connection was successful
  const handleModalClose = () => {
    setShowConnectModal(false);
    // Check if connection was successful and reload sessions
    if (whatsappStatus.isConnected || whatsappStatus.status === 'connected') {
      qc.invalidateQueries({ queryKey: ["whatsappSessions"] });
    }
  };

  // Step 4–7: Open modal and handle connection
  const handleConnectClick = async (session = null) => {
    setShowConnectModal(true);
    setQrCode(null);

    try {
      if (session) {
        // For existing sessions, get status with QR code
        const response = await whatsappService.getSessionStatus(session._id);
        if (response.data?.qr) {
          setQrCode(response.data.qr);
        }
      } else {
        // For new sessions, create session first
        const sessionNameToUse = sessionName;
        const response = await createSessionMutation.mutateAsync({ schoolId: user.school, label: sessionNameToUse });
        if (response?.data?.qr) {
          setQrCode(response.data.qr);
        }
      }
    } catch (error) {
      console.error("Connection failed:", error);
      toast({
        title: "Error",
        description: whatsappService.formatError(error),
        variant: "destructive",
      });
      setShowConnectModal(false);
    }
  };

  // ... (other handlers: test, profile, password, avatar — unchanged)

  const handleTestNotification = async () => {
    if (!testPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }
    const phoneValidation = whatsappService.validatePhoneNumber(testPhone);
    if (!phoneValidation.isValid) {
      toast({
        title: "Error",
        description: phoneValidation.message,
        variant: "destructive",
      });
      return;
    }
    setTestLoading(true);
    try {
      await whatsappService.sendTestNotification(
        user.school,
        phoneValidation.cleaned,
        testMessage,
      );
      toast({
        title: "Test Message Sent!",
        description: `Test notification sent to ${phoneValidation.cleaned}`,
      });
      setTestPhone("");
    } catch (error) {
      console.error("Test notification error:", error);
      toast({
        title: "Error",
        description: whatsappService.formatError(error),
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      await updateProfile(data);
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Failed to update profile";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setPasswordLoading(true);
      await userService.changePassword(data);
      toast({ title: "Success", description: "Password updated successfully" });
      passwordForm.reset();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Failed to update password";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Password update error:", error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("avatar", file);
      await userService.updateAvatar(formData);
      toast({ title: "Success", description: "Avatar updated successfully" });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Failed to update avatar";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Avatar update error:", error);
      setAvatarPreview(user?.avatar || "");
      setAvatarFile(null);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      case "SCHOOL_ADMIN":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "TRAINER":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
      case "STUDENT":
        return "bg-purple-500/20 text-purple-700 border-purple-500/30";
      default:
        return "bg-slate-500/20 text-slate-700 border-slate-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Profile Settings
          </h1>
          <p className="text-slate-600 mt-1 font-normal">
            Manage your account information and preferences
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Profile Overview Sidebar */}
          <div className="lg:col-span-4">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-6">
                  <Avatar className="h-24 w-24 border-2 border-slate-200">
                    <AvatarImage
                      src={user?.avatar}
                      alt={user?.firstName + " " + user?.lastName || "User"}
                    />
                    <AvatarFallback className="text-lg font-semibold bg-slate-100 text-slate-700">
                      {getInitials(
                        user?.firstName + " " + user?.lastName || "User",
                      )}
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
                  <h3 className="text-xl font-semibold text-slate-900">
                    {user?.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getRoleBadgeColor(user?.role)} font-medium`}
                  >
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
                      <p>
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                  {user?.lastLogin && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-medium">Last active</p>
                        <p>
                          {new Date(user.lastLogin).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
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
              <TabsList className="bg-white border border-slate-200 p-1 h-auto shadow-sm flex flex-wrap">
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
                {isSchoolAdmin(user) && (
                  <TabsTrigger
                    value="school-settings"
                    className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600 font-medium px-4 py-2 h-9"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    School Settings
                  </TabsTrigger>
                )}
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
                    <CardTitle className="text-lg font-semibold">
                      Personal Information
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                      Update your account details and contact information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form
                      onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="firstName"
                            className="text-sm font-medium"
                          >
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            {...profileForm.register("firstName")}
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
                          <Label
                            htmlFor="lastName"
                            className="text-sm font-medium"
                          >
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            {...profileForm.register("lastName")}
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
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...profileForm.register("email")}
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
                          {loading ? "Saving..." : "Save Changes"}
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
                    <CardTitle className="text-lg font-semibold">
                      Change Password
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                      Update your password to keep your account secure.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form
                      onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label
                          htmlFor="currentPassword"
                          className="text-sm font-medium"
                        >
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          {...passwordForm.register("currentPassword")}
                          className="h-10 border-slate-200 focus:border-slate-400 focus:ring-0"
                          placeholder="Enter current password"
                        />
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-xs text-red-600">
                            {
                              passwordForm.formState.errors.currentPassword
                                .message
                            }
                          </p>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="newPassword"
                            className="text-sm font-medium"
                          >
                            New Password
                          </Label>
                          <Input
                            id="newPassword"
                            type="password"
                            {...passwordForm.register("newPassword")}
                            className="h-10 border-slate-200 focus:border-slate-400 focus:ring-0"
                            placeholder="Enter new password"
                          />
                          {passwordForm.formState.errors.newPassword && (
                            <p className="text-xs text-red-600">
                              {
                                passwordForm.formState.errors.newPassword
                                  .message
                              }
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="confirmPassword"
                            className="text-sm font-medium"
                          >
                            Confirm Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            {...passwordForm.register("confirmPassword")}
                            className="h-10 border-slate-200 focus:border-slate-400 focus:ring-0"
                            placeholder="Confirm new password"
                          />
                          {passwordForm.formState.errors.confirmPassword && (
                            <p className="text-xs text-red-600">
                              {
                                passwordForm.formState.errors.confirmPassword
                                  .message
                              }
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
                          {passwordLoading ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </form>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-900">
                        Password Requirements
                      </h4>
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

              {/* School Settings Tab */}
              {isSchoolAdmin(user) && (
                <TabsContent value="school-settings">
                  <div className="space-y-6">
                    <Card className="bg-white border border-slate-200 shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                          WhatsApp Integration
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600">
                          Connect your school&apos;s WhatsApp to send automated notifications
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* WhatsApp Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-slate-900">WhatsApp Integration</p>
                                <p className="text-sm text-slate-600">
                                  {sessions.length > 0 
                                    ? `${sessions.length} session${sessions.length > 1 ? 's' : ''} configured`
                                    : "Enable to send automated notifications"
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {sessionsLoading && (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                            )}
                            <Switch
                              className="border border-slate-300"
                              checked={whatsappEnabled}
                              onCheckedChange={handleWhatsappToggle}
                              disabled={sessionsLoading}
                            />
                          </div>
                        </div>

                        {/* Existing Sessions */}
                        {sessions.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-slate-900">WhatsApp Sessions</h4>
                            <div className="space-y-3">
                              {sessions.map((session) => {
                                const isClosed = session.metaData?.status === 'CLOSED';
                                return (
                                  <div 
                                    key={session._id} 
                                    className={`flex items-center justify-between p-4 rounded-lg border ${
                                      isClosed 
                                        ? 'border-slate-100 bg-slate-50 opacity-60' 
                                        : 'border-slate-200 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        {(session.metaData?.status === 'CONNECTED' || session.metaData?.status === 'OPEN') ? (
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : session.metaData?.status === 'CREATED' ? (
                                          <AlertCircle className="h-5 w-5 text-amber-500" />
                                        ) : session.metaData?.status === 'PENDING' ? (
                                          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                                        ) : isClosed ? (
                                          <WifiOff className="h-5 w-5 text-red-400" />
                                        ) : (
                                          <WifiOff className="h-5 w-5 text-slate-400" />
                                        )}
                                        <div>
                                          <p className={`font-medium ${isClosed ? 'text-slate-500' : 'text-slate-900'}`}>
                                            {session.label}
                                          </p>
                                          <p className={`text-sm ${isClosed ? 'text-slate-400' : 'text-slate-600'}`}>
                                            Status: {session.metaData?.status || 'Unknown'} • 
                                            Created {new Date(session.createdAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {(session.metaData?.status === 'CONNECTED' || session.metaData?.status === 'OPEN') && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                          Connected
                                        </Badge>
                                      )}
                                      {(session.metaData?.status === 'CREATED' || session.metaData?.status === 'PENDING' || session.metaData?.status === 'CONNECTING') && session.metaData?.status !== 'OPEN' && (
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => handleConnectClick(session)}
                                          className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          Connect
                                        </Button>
                                      )}
                                      {isClosed && (
                                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                          Session Closed
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Prompt for closed sessions - Show when all sessions are closed */}
                        {whatsappEnabled && sessions.length > 0 && sessions.every(session => session.metaData?.status === 'CLOSED') && (
                          <div className="space-y-4 p-4 rounded-lg border border-amber-200 bg-amber-50">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                              <h4 className="font-medium text-amber-900">All Sessions Closed</h4>
                            </div>
                            <p className="text-sm text-amber-800">
                              All your WhatsApp sessions are currently closed. You need to create a new session to continue using WhatsApp notifications.
                            </p>
                            <div className="space-y-3">
                              <Label htmlFor="newSessionName" className="text-sm font-medium text-amber-900">
                                New Session Name
                              </Label>
                              <Input
                                id="newSessionName"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                placeholder="e.g., New School Account"
                                className="h-10 border-amber-300 focus:border-amber-500"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveSessionName}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                Add New Session
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Step 2: Session Name Input - Only show if no sessions exist */}
                        {whatsappEnabled && sessions.length === 0 && (
                          <div className="space-y-3">
                            <Label htmlFor="sessionName" className="text-sm font-medium">
                              Session Name
                            </Label>
                            <Input
                              id="sessionName"
                              value={sessionName}
                              onChange={(e) => setSessionName(e.target.value)}
                              placeholder="e.g., Main School Account"
                              className="h-10"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveSessionName}
                              className="bg-slate-900 hover:bg-slate-800 text-white"
                            >
                              Create Session
                            </Button>
                          </div>
                        )}

                        {/* Test Notification (only when connected) */}
                        {(whatsappStatus.isConnected || whatsappStatus.status === 'connected') && (
                          <div className="space-y-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
                            <h4 className="font-medium text-slate-900 flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Test Notification
                            </h4>
                            <p className="text-sm text-slate-600">
                              Send a test message to verify your WhatsApp connection
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="testPhone" className="text-sm font-medium">
                                  Phone Number
                                </Label>
                                <Input
                                  id="testPhone"
                                  type="tel"
                                  placeholder="+254712345678"
                                  value={testPhone}
                                  onChange={(e) => setTestPhone(e.target.value)}
                                  className="h-9"
                                />
                                <p className="text-xs text-slate-500">
                                  Include country code (e.g., +254 for Kenya)
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="testMessage" className="text-sm font-medium">
                                  Message
                                </Label>
                                <Input
                                  id="testMessage"
                                  value={testMessage}
                                  onChange={(e) => setTestMessage(e.target.value)}
                                  className="h-9"
                                  placeholder="Test message"
                                />
                              </div>
                            </div>
                            <Button
                              onClick={handleTestNotification}
                              disabled={testLoading || !testPhone.trim()}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {testLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Send Test Message
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* WhatsApp Info */}
                        <div className="space-y-3 text-sm text-slate-600">
                          <h4 className="font-medium text-slate-900">How it works:</h4>
                          <ul className="space-y-1 list-disc list-inside">
                            <li>Connect your school&apos;s WhatsApp Business account</li>
                            <li>Automatically send assignment notifications to students</li>
                            <li>Send deadline reminders and important updates</li>
                            <li>Maintain professional communication with parents</li>
                          </ul>
                          {whatsappStatus.sessionId && (
                            <div className="mt-4 p-3 rounded-lg bg-slate-100">
                              <p className="text-xs text-slate-500">
                                Session ID: <code className="font-mono">{whatsappStatus.sessionId.slice(-8)}</code>
                              </p>
                              {whatsappStatus.lastUpdated && (
                                <p className="text-xs text-slate-500">
                                  Last updated: {new Date(whatsappStatus.lastUpdated).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                  </div>
                </TabsContent>
              )}

              {/* Preferences Tab (unchanged) */}
              <TabsContent value="preferences">
              {/* Additional School Settings */}
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Additional Settings</CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    More school configuration options coming soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500">
                    <Settings className="h-8 w-8 mx-auto mb-3" />
                    <p className="text-sm">More settings coming soon</p>
                    <p className="text-xs mt-1">Email notifications, SMS integration, and more</p>
                  </div>
                </CardContent>
              </Card>              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* WhatsApp Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleModalClose}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Connect WhatsApp</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleModalClose}
              >
                ✕
              </Button>
            </div>

            {qrCode ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Scan this QR code using WhatsApp on your phone:
                </p>
                <div className="flex justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}`}
                    alt="WhatsApp QR Code"
                    className="w-60 h-60"
                  />
                </div>
                
                {/* Real-time status indicator */}
                <div className="flex items-center justify-center space-x-2 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-600">Checking connection status...</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Status: {whatsappStatus.status || 'CHECKING'}
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 text-center">
                  QR code expires in 60 seconds. Connection status updates every second.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
                <p className="text-sm text-slate-600">Generating QR code...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
