'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, FileText, CheckCircle, Clock, TrendingUp, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await userService.getDashboardData();
        setDashboardData(data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="relative">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
        </div>
      </div>
    );
  }

  // Extract data from API response with fallback defaults
  const data = dashboardData?.data || {
    recentAssignments: [],
    stats: {
      totalAssignments: 0,
      completedAssignments: 0,
      pendingAssignments: 0,
      upcomingAssignments: 0,
    },
    performance: {
      completionRate: 0,
      efficiency: 0,
      trend: '+0%'
    },
    recentActivity: []
  };

  // Extract individual data sections for easier access
  const recentAssignments = data?.recentAssignments || [];
  const stats = data?.stats || {
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    upcomingAssignments: 0
  };
  const performance = data?.performance || {
    completionRate: 0,
    efficiency: 0,
    trend: '+0%'
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-slate-600 mt-1 font-normal">
                Welcome back, {user?.name || 'Executive'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-slate-900 rounded-full flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700">Performance</span>
            </div>
          </div>
          
          {/* Performance Indicator */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
              <span className="text-slate-600">Completion Rate: {performance?.completionRate}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600 font-medium">{performance?.trend} vs last month</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-700" />
                </div>
                <span className="text-2xl font-light text-slate-900">{stats?.totalAssignments}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Total Projects</p>
                <p className="text-xs text-slate-500">Active assignments</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-2xl font-light text-slate-900">{stats?.completedAssignments}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Completed</p>
                <p className="text-xs text-slate-500">Successfully delivered</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-2xl font-light text-slate-900">{stats?.pendingAssignments}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">In Progress</p>
                <p className="text-xs text-slate-500">Currently active</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-2xl font-light text-slate-900">{stats?.upcomingAssignments}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Upcoming</p>
                <p className="text-xs text-slate-500">Next 7 days</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
                <CardDescription className="text-slate-600 mt-1">Latest project updates and deliverables</CardDescription>
              </div>
              <button className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                View all →
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentAssignments?.map((assignment, index) => (
                <div key={assignment.id} className="px-6 py-4 hover:bg-slate-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(assignment.status)}`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{assignment.title}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-slate-500">
                            Due {new Date(assignment.dueDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityStyles(assignment.priority)}`}>
                            {assignment.priority?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusStyles(assignment.status)}`}>
                        {formatStatus(assignment.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {data.recentActivity && data.recentActivity.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-slate-900">Recent Activity</CardTitle>
              <CardDescription>Latest updates on your assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`h-2 w-2 rounded-full ${
                        activity.type === 'submission' ? 'bg-green-500' :
                        activity.type === 'assignment' ? 'bg-blue-500' :
                        activity.type === 'deadline' ? 'bg-orange-500' : 'bg-slate-400'
                      }`}></div>
                      <span className="text-sm font-medium text-slate-900">{activity.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                        activity.status === 'new' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <button className="text-slate-600 hover:text-slate-900 font-medium">Export Data</button>
            <button className="text-slate-600 hover:text-slate-900 font-medium">Generate Report</button>
            <button className="text-slate-600 hover:text-slate-900 font-medium">Settings</button>
          </div>
          <div className="text-slate-500">
            Last updated: {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getStatusColor(status) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500';
    case 'in-progress':
      return 'bg-blue-500';
    case 'not-started':
      return 'bg-slate-400';
    case 'overdue':
      return 'bg-red-500';
    default:
      return 'bg-slate-400';
  }
}

function getStatusStyles(status) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'in-progress':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'not-started':
      return 'bg-slate-50 text-slate-700 border border-slate-200';
    case 'overdue':
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200';
  }
}

function getPriorityStyles(priority) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'low':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function formatStatus(status) {
  switch (status) {
    case 'completed':
      return 'Complete';
    case 'in-progress':
      return 'In Progress';
    case 'not-started':
      return 'Pending';
    case 'overdue':
      return 'Overdue';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');
  }
}