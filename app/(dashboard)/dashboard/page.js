'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
  FileText,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Star,
  Percent,
  GraduationCap, Contact, Users
} from 'lucide-react';
import RecentSubmissions from "@/components/dashboard/trainer/recentSubmissions";
import {ROLES} from "@/lib/constants";
import RecentAssignments from "@/components/dashboard/schoolAdmin/recentAssignments";
import KPIStatCard from "@/components/dashboard/KPIStatCard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await userService.getDashboardData();
        setDashboardData(data?.data || null);
      } catch (error) {
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
  const data = dashboardData || {
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
                Welcome back, {user?.firstName + " " + user.lastName || 'Executive'}
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {user.role === ROLES.STUDENT ? (
              <>
                <KPIStatCard
                    icon={FileText}
                    value={dashboardData?.totalAssignments || 0}
                    title="Total Assignments"
                    subtitle="Assigned to you"
                    iconBgClass="bg-slate-100"
                    iconColorClass="text-slate-700"
                />
                <KPIStatCard
                    icon={CheckCircle}
                    value={dashboardData?.completedAssignments || 0}
                    title="Completed"
                    subtitle="Assignments submitted"
                    iconBgClass="bg-green-50"
                    iconColorClass="text-green-600"
                />
                <KPIStatCard
                    icon={Star}
                    value={dashboardData?.gradedAssignments || 0}
                    title="Graded"
                    subtitle="Assignments graded"
                    iconBgClass="bg-yellow-50"
                    iconColorClass="text-yellow-600"
                />
                <KPIStatCard
                    icon={Percent}
                    value={`${dashboardData?.completionRate || 0}%`}
                    title="Completion Rate"
                    subtitle="Of all assignments"
                    iconBgClass="bg-indigo-50"
                    iconColorClass="text-indigo-600"
                />
              </>
          ) : (
              <>
                <KPIStatCard
                    icon={FileText}
                    value={dashboardData?.totalAssignments || 0}
                    title="Total Assignments"
                    subtitle="Active assignments"
                    iconBgClass="bg-slate-100"
                    iconColorClass="text-slate-700"
                />
                <KPIStatCard
                    icon={Users}
                    value={dashboardData?.totalStudents || 0}
                    title="Students"
                    subtitle="Active students"
                    iconBgClass="bg-emerald-50"
                    iconColorClass="text-emerald-600"
                />
                <KPIStatCard
                    icon={Contact}
                    value={dashboardData?.totalTrainers || 0}
                    title="Trainers"
                    subtitle="Active trainers"
                    iconBgClass="bg-amber-50"
                    iconColorClass="text-amber-600"
                />
                <KPIStatCard
                    icon={GraduationCap}
                    value={dashboardData?.totalCohorts || 0}
                    title="Cohorts"
                    subtitle="Active cohorts"
                    iconBgClass="bg-blue-50"
                    iconColorClass="text-blue-600"
                />
              </>
          )}
        </div>
        {user.role === ROLES.TRAINER && (<RecentSubmissions submissions={dashboardData?.recentActivity?.recentSubmissions || {}}/>)}
        {user.role === ROLES.SCHOOL_ADMIN && (<RecentAssignments assignments={dashboardData.recentActivity.recentAssignments || {}}/>)}
        
      </div>
    </div>
  );
}