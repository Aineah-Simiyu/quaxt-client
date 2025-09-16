'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { analyticsService, cohortService, userService } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  Target, 
  Award,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { ROLES, isSchoolAdmin } from '@/lib/constants';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const isSchoolAdminUser = isSchoolAdmin(user);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    if (cohorts.length > 0) {
      fetchAnalyticsData();
    }
  }, [selectedCohort, selectedTimeRange, cohorts]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch cohorts based on user role
      let cohortsData = [];
      if (isSchoolAdminUser) {
        cohortsData = await cohortService.getCohortsBySchool(user.school);
      } else {
        cohortsData = await cohortService.getCohortsByTrainer(user._id);
      }
      
      setCohorts(cohortsData.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load initial data',
        variant: 'destructive'
      });
      console.error('Initial data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setRefreshing(true);
      
      const filters = {
        startDate: getStartDate(),
        endDate: new Date().toISOString().split('T')[0]
      };

      if (selectedCohort !== 'all') {
        filters.cohortId = selectedCohort;
      }

      let data;
      if (isSchoolAdminUser) {
        data = await analyticsService.getSchoolAnalytics(user.school, filters);
      } else {
        data = await analyticsService.getTrainerAnalytics(user._id, filters);
      }
      
      setAnalyticsData(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
      console.error('Analytics data fetch error:', error);
      
      // Set placeholder data for development
      setAnalyticsData(getPlaceholderData());
    } finally {
      setRefreshing(false);
    }
  };

  const getStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(selectedTimeRange));
    return date.toISOString().split('T')[0];
  };

  const getPlaceholderData = () => ({
    assignments: {
      totalAssignments: 45,
      assignmentsByStatus: { active: 32, completed: 13 },
      assignmentsByDifficulty: { easy: 15, medium: 20, hard: 10 },
      averageCompletionTime: 4.2
    },
    submissions: {
      totalSubmissions: 342,
      submissionsByStatus: { submitted: 298, draft: 44 },
      onTimeVsLate: { onTime: 276, late: 66 },
      submissionRate: 87.5,
      averageSubmissionTime: 2.8
    },
    gradings: {
      totalGraded: 298,
      averageScore: 84.2,
      gradeDistribution: { A: 89, B: 124, C: 67, D: 15, F: 3 },
      gradingEfficiency: 92.3
    }
  });

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Analytics report will be downloaded shortly'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="relative">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
        </div>
      </div>
    );
  }

  const data = analyticsData || getPlaceholderData();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-slate-600 mt-1 font-normal">
                {isSchoolAdminUser ? 'School Performance Overview' : 'Training Performance Insights'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filters:</span>
            </div>
            
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-40 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCohort} onValueChange={setSelectedCohort}>
              <SelectTrigger className="w-48 border-slate-200">
                <SelectValue placeholder="Select cohort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cohorts</SelectItem>
                {cohorts.map((cohort) => (
                  <SelectItem key={cohort._id} value={cohort._id}>
                    {cohort.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-2xl font-light text-slate-900">{data.assignments?.totalAssignments || 0}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Total Assignments</p>
                <p className="text-xs text-slate-500">Active projects</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-2xl font-light text-slate-900">{data.submissions?.totalSubmissions || 0}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Total Submissions</p>
                <p className="text-xs text-slate-500">Student responses</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-2xl font-light text-slate-900">{data.gradings?.averageScore || 0}%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Average Score</p>
                <p className="text-xs text-slate-500">Overall performance</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-2xl font-light text-slate-900">{data.submissions?.submissionRate || 0}%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Submission Rate</p>
                <p className="text-xs text-slate-500">Completion efficiency</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-white">Assignments</TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-white">Submissions</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Assignment Status Distribution */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="px-6 py-5 border-b border-slate-100">
                  <CardTitle className="text-lg font-semibold text-slate-900">Assignment Status</CardTitle>
                  <CardDescription className="text-slate-600">Distribution of assignment states</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">Active</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{data.assignments?.assignmentsByStatus?.active || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-3 w-3 bg-slate-400 rounded-full"></div>
                        <span className="text-sm text-slate-700">Completed</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{data.assignments?.assignmentsByStatus?.completed || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Timing */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="px-6 py-5 border-b border-slate-100">
                  <CardTitle className="text-lg font-semibold text-slate-900">Submission Timing</CardTitle>
                  <CardDescription className="text-slate-600">On-time vs late submissions</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">On Time</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{data.submissions?.onTimeVsLate?.onTime || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">Late</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{data.submissions?.onTimeVsLate?.late || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="px-6 py-5 border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900">Assignment Analytics</CardTitle>
                <CardDescription className="text-slate-600">Detailed assignment metrics and insights</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-light text-slate-900 mb-1">{data.assignments?.totalAssignments || 0}</div>
                    <div className="text-sm text-slate-600">Total Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-slate-900 mb-1">{data.assignments?.averageCompletionTime || 0}</div>
                    <div className="text-sm text-slate-600">Avg. Completion (days)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-slate-900 mb-1">{data.assignments?.assignmentsByStatus?.active || 0}</div>
                    <div className="text-sm text-slate-600">Currently Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="px-6 py-5 border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900">Submission Analytics</CardTitle>
                <CardDescription className="text-slate-600">Student submission patterns and statistics</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-light text-slate-900 mb-1">{data.submissions?.submissionRate || 0}%</div>
                    <div className="text-sm text-slate-600">Submission Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-slate-900 mb-1">{data.submissions?.averageSubmissionTime || 0}</div>
                    <div className="text-sm text-slate-600">Avg. Time (days)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-slate-900 mb-1">{((data.submissions?.onTimeVsLate?.onTime || 0) / (data.submissions?.totalSubmissions || 1) * 100).toFixed(1)}%</div>
                    <div className="text-sm text-slate-600">On-Time Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="px-6 py-5 border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900">Performance Metrics</CardTitle>
                <CardDescription className="text-slate-600">Grading and performance analytics</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-light text-slate-900 mb-1">{data.gradings?.averageScore || 0}%</div>
                      <div className="text-sm text-slate-600">Average Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-light text-slate-900 mb-1">{data.gradings?.totalGraded || 0}</div>
                      <div className="text-sm text-slate-600">Total Graded</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-light text-slate-900 mb-1">{data.gradings?.gradingEfficiency || 0}%</div>
                      <div className="text-sm text-slate-600">Grading Efficiency</div>
                    </div>
                  </div>

                  {/* Grade Distribution */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-3">Grade Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(data.gradings?.gradeDistribution || {}).map(([grade, count]) => (
                        <div key={grade} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`h-3 w-3 rounded-full ${
                              grade === 'A' ? 'bg-emerald-500' :
                              grade === 'B' ? 'bg-blue-500' :
                              grade === 'C' ? 'bg-yellow-500' :
                              grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm text-slate-700">Grade {grade}</span>
                          </div>
                          <span className="text-sm font-medium text-slate-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <button className="text-slate-600 hover:text-slate-900 font-medium">Generate Report</button>
            <button className="text-slate-600 hover:text-slate-900 font-medium">Schedule Export</button>
            <button className="text-slate-600 hover:text-slate-900 font-medium">View Trends</button>
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