'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, Bell, Palette, Users, BookOpen, GraduationCap, User, Lock, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Mock user role - in real app this would come from auth context
  const userRole = user?.role || 'school_admin'; // 'school_admin', 'student', 'trainer'
  
  // Settings state
  const [settings, setSettings] = useState({
    // General settings
    emailNotifications: true,
    browserNotifications: false,
    darkMode: false,
    autoSave: true,
    language: 'en',
    timezone: 'UTC',
    
    // School Admin specific
    systemMaintenance: false,
    userRegistration: true,
    dataRetention: '365',
    auditLogs: true,
    
    // Student specific
    assignmentReminders: true,
    gradeNotifications: true,
    studyMode: 'focus',
    progressTracking: true,
    
    // Trainer specific
    classNotifications: true,
    submissionAlerts: true,
    gradingMode: 'detailed',
    feedbackTemplates: true,
  });

  // Handle settings change
  const handleSettingChange = (setting) => {
    setSettings(prev => {
      const newSettings = { ...prev, [setting]: !prev[setting] };
      
      // Save settings to backend
      saveSettings(newSettings);
      
      return newSettings;
    });
  };

  // Helper functions for handling form changes
  const handleSelectChange = (setting, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [setting]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  };

  const handleInputChange = (setting, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [setting]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  };

  // Save settings to backend
  const saveSettings = async (newSettings) => {
    try {
      setLoading(true);
      // In a real app, you would save these settings to the backend
      // await userService.updateSettings(newSettings);
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      console.error('Settings update error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get role-specific settings
  const getRoleSpecificSettings = () => {
    switch (userRole) {
      case 'school_admin':
        return {
          title: 'School Administration',
          icon: Shield,
          tabs: ['general', 'system', 'security', 'users']
        };
      case 'student':
        return {
          title: 'Student Preferences',
          icon: GraduationCap,
          tabs: ['general', 'learning', 'notifications']
        };
      case 'trainer':
        return {
          title: 'Trainer Dashboard',
          icon: BookOpen,
          tabs: ['general', 'teaching', 'grading']
        };
      default:
        return {
          title: 'Settings',
          icon: Settings,
          tabs: ['general']
        };
    }
  };

  const roleConfig = getRoleSpecificSettings();
  const RoleIcon = roleConfig.icon;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">
                Settings
              </h1>
              <p className="text-slate-600 mt-1 font-normal">
                {roleConfig.title} • {user?.name || 'User'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-slate-900 rounded-full flex items-center justify-center">
                <RoleIcon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700">Configuration</span>
            </div>
          </div>
          
          {/* Role Indicator */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
              <span className="text-slate-600">Role: {userRole.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="h-3 w-3 text-slate-500" />
              <span className="text-slate-500">Secure Configuration</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <div className="border-b border-slate-200">
            <TabsList className="bg-transparent h-auto p-0 space-x-8">
              {roleConfig.tabs.includes('general') && (
                <TabsTrigger 
                  value="general" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  General
                </TabsTrigger>
              )}
              {roleConfig.tabs.includes('system') && (
                <TabsTrigger 
                  value="system" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  System
                </TabsTrigger>
              )}
              {roleConfig.tabs.includes('security') && (
                <TabsTrigger 
                  value="security" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
              )}
              {roleConfig.tabs.includes('users') && (
                <TabsTrigger 
                  value="users" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
              )}
              {roleConfig.tabs.includes('learning') && (
                <TabsTrigger 
                  value="learning" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Learning
                </TabsTrigger>
              )}
              {roleConfig.tabs.includes('teaching') && (
                <TabsTrigger 
                  value="teaching" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Teaching
                </TabsTrigger>
              )}
              {roleConfig.tabs.includes('grading') && (
                <TabsTrigger 
                  value="grading" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  <User className="h-4 w-4 mr-2" />
                  Grading
                </TabsTrigger>
              )}
              {roleConfig.tabs.includes('notifications') && (
                <TabsTrigger 
                  value="notifications" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Appearance
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Customize the visual appearance of your interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-900">Dark Mode</span>
                      <span className="text-xs text-slate-500">Switch between light and dark themes</span>
                    </Label>
                    <Switch
                      id="dark-mode"
                      checked={settings.darkMode}
                      onCheckedChange={() => handleSettingChange('darkMode')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-900">Language</Label>
                    <Select value={settings.language} onValueChange={(value) => handleSelectChange('language', value)}>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Regional
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Configure timezone and regional preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-save" className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-900">Auto-save</span>
                      <span className="text-xs text-slate-500">Automatically save your work</span>
                    </Label>
                    <Switch
                      id="auto-save"
                      checked={settings.autoSave}
                      onCheckedChange={() => handleSettingChange('autoSave')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-900">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => handleSelectChange('timezone', value)}>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern Time</SelectItem>
                        <SelectItem value="PST">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* School Admin Specific Tabs */}
          {userRole === 'school_admin' && (
            <>
              <TabsContent value="system" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900">System Management</CardTitle>
                      <CardDescription className="text-slate-600">
                        Configure system-wide settings and maintenance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-slate-900">Maintenance Mode</span>
                          <span className="text-xs text-slate-500">Enable system maintenance mode</span>
                        </Label>
                        <Switch
                          checked={settings.systemMaintenance}
                          onCheckedChange={() => handleSettingChange('systemMaintenance')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-slate-900">User Registration</span>
                          <span className="text-xs text-slate-500">Allow new user registrations</span>
                        </Label>
                        <Switch
                          checked={settings.userRegistration}
                          onCheckedChange={() => handleSettingChange('userRegistration')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900">Data Management</CardTitle>
                      <CardDescription className="text-slate-600">
                        Configure data retention and audit settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-900">Data Retention (days)</Label>
                        <Input
                          type="number"
                          value={settings.dataRetention}
                          onChange={(e) => handleInputChange('dataRetention', e.target.value)}
                          className="border-slate-300"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-slate-900">Audit Logs</span>
                          <span className="text-xs text-slate-500">Enable comprehensive audit logging</span>
                        </Label>
                        <Switch
                          checked={settings.auditLogs}
                          onCheckedChange={() => handleSettingChange('auditLogs')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900">Security Settings</CardTitle>
                    <CardDescription className="text-slate-600">
                      Configure security policies and access controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-900">Password Policy</Label>
                        <Select defaultValue="strong">
                          <SelectTrigger className="border-slate-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="strong">Strong</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-900">Session Timeout (minutes)</Label>
                        <Input type="number" defaultValue="30" className="border-slate-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900">User Management</CardTitle>
                    <CardDescription className="text-slate-600">
                      Configure user roles and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="text-2xl font-light text-slate-900">156</div>
                        <div className="text-sm text-slate-600">Total Users</div>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="text-2xl font-light text-slate-900">23</div>
                        <div className="text-sm text-slate-600">Trainers</div>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="text-2xl font-light text-slate-900">133</div>
                        <div className="text-sm text-slate-600">Students</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {/* Student Specific Tabs */}
          {userRole === 'student' && (
            <>
              <TabsContent value="learning" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900">Study Preferences</CardTitle>
                      <CardDescription className="text-slate-600">
                        Customize your learning experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-900">Study Mode</Label>
                        <Select value={settings.studyMode} onValueChange={(value) => handleSelectChange('studyMode', value)}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="focus">Focus Mode</SelectItem>
                            <SelectItem value="relaxed">Relaxed Mode</SelectItem>
                            <SelectItem value="intensive">Intensive Mode</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-slate-900">Progress Tracking</span>
                          <span className="text-xs text-slate-500">Track your learning progress</span>
                        </Label>
                        <Switch
                          checked={settings.progressTracking}
                          onCheckedChange={() => handleSettingChange('progressTracking')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900">Assignment Settings</CardTitle>
                      <CardDescription className="text-slate-600">
                        Configure assignment and deadline preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-slate-900">Assignment Reminders</span>
                          <span className="text-xs text-slate-500">Get reminded about upcoming deadlines</span>
                        </Label>
                        <Switch
                          checked={settings.assignmentReminders}
                          onCheckedChange={() => handleSettingChange('assignmentReminders')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-slate-900">Grade Notifications</span>
                          <span className="text-xs text-slate-500">Receive notifications when grades are posted</span>
                        </Label>
                        <Switch
                          checked={settings.gradeNotifications}
                          onCheckedChange={() => handleSettingChange('gradeNotifications')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900">Notification Preferences</CardTitle>
                    <CardDescription className="text-slate-600">
                      Choose how you want to receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-slate-900">Email Notifications</span>
                        <span className="text-xs text-slate-500">Receive notifications via email</span>
                      </Label>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={() => handleSettingChange('emailNotifications')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-slate-900">Browser Notifications</span>
                        <span className="text-xs text-slate-500">Receive notifications in your browser</span>
                      </Label>
                      <Switch
                        checked={settings.browserNotifications}
                        onCheckedChange={() => handleSettingChange('browserNotifications')}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {/* Trainer Specific Tabs */}
          {userRole === 'trainer' && (
            <>
              <TabsContent value="teaching" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900">Class Management</CardTitle>
                      <CardDescription className="text-slate-600">
                        Configure your teaching preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-slate-900">Class Notifications</span>
                          <span className="text-xs text-slate-500">Get notified about class activities</span>
                        </Label>
                        <Switch
                          checked={settings.classNotifications}
                          onCheckedChange={() => handleSettingChange('classNotifications')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-slate-900">Submission Alerts</span>
                          <span className="text-xs text-slate-500">Alert when students submit assignments</span>
                        </Label>
                        <Switch
                          checked={settings.submissionAlerts}
                          onCheckedChange={() => handleSettingChange('submissionAlerts')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900">Teaching Tools</CardTitle>
                      <CardDescription className="text-slate-600">
                        Configure your teaching tools and templates
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-slate-900">Feedback Templates</span>
                          <span className="text-xs text-slate-500">Use predefined feedback templates</span>
                        </Label>
                        <Switch
                          checked={settings.feedbackTemplates}
                          onCheckedChange={() => handleSettingChange('feedbackTemplates')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="grading" className="space-y-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900">Grading Preferences</CardTitle>
                    <CardDescription className="text-slate-600">
                      Configure how you grade and provide feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-900">Grading Mode</Label>
                      <Select value={settings.gradingMode} onValueChange={(value) => handleSelectChange('gradingMode', value)}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quick">Quick Grade</SelectItem>
                          <SelectItem value="detailed">Detailed Feedback</SelectItem>
                          <SelectItem value="rubric">Rubric-based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={() => saveSettings(settings)}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}