'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  TrendingUp,
  Calendar,
  Target,
  BarChart3,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { ROLES, isSchoolAdmin, isInstructorOrAdmin } from '@/lib/constants';
import { withAuth } from '@/middleware/withAuth';
import { userService, cohortService, analyticsService } from '@/lib/api';

function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCohort, setSelectedCohort] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteCohort, setInviteCohort] = useState('');
  
  // Manual student creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createStudentData, setCreateStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cohort: 'none'
  });

  // Student management modal state
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editStudentData, setEditStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    isActive: true
  });
  const [studentCohorts, setStudentCohorts] = useState([]);
  const [availableCohorts, setAvailableCohorts] = useState([]);

  // Student view modal state (for trainers)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  // Stats for dashboard cards
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    completionRate: 0,
    averageProgress: 0
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      let analyticsResponse;
      
      if (isSchoolAdmin(user)) {
        // School admin gets school-wide analytics
        analyticsResponse = await analyticsService.getSchoolAnalytics(user.school);
      } else {
        // Trainer gets their specific analytics
        analyticsResponse = await analyticsService.getTrainerAnalytics(user._id);
      }
      
      setAnalyticsData(analyticsResponse);
      return analyticsResponse;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
      return null;
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Calculate student progress based on cohort duration and joining date
  const calculateStudentProgress = (cohort, studentJoinDate) => {
    if (!cohort.startDate || !cohort.endDate) return 0;
    
    const startDate = new Date(cohort.startDate);
    const endDate = new Date(cohort.endDate);
    const joinDate = studentJoinDate ? new Date(studentJoinDate) : startDate;
    const currentDate = new Date();
    
    // Use the later of start date or join date as the effective start
    const effectiveStart = joinDate > startDate ? joinDate : startDate;
    
    // Calculate total duration and elapsed time
    const totalDuration = endDate.getTime() - effectiveStart.getTime();
    const elapsedTime = currentDate.getTime() - effectiveStart.getTime();
    
    // Calculate progress percentage
    const progress = Math.min(Math.max((elapsedTime / totalDuration) * 100, 0), 100);
    
    return Math.round(progress);
  };

  // Helper function to enrich student data with cohort information
  const enrichStudentWithCohorts = async (students, allCohorts) => {
    const studentMap = new Map();
    
    // Initialize all students in the map
    students.forEach(student => {
      studentMap.set(student._id, {
        ...student,
        cohorts: [],
        overallProgress: 0,
        status: student.isActive === false ? 'inactive' : 'active',
        joinedDate: student.createdAt
      });
    });
    
    // Enrich with cohort data
    for (const cohort of allCohorts) {
      if (cohort.students && Array.isArray(cohort.students)) {
        for (const studentRef of cohort.students) {
          const studentId = typeof studentRef === 'string' ? studentRef : studentRef._id;
          
          if (studentMap.has(studentId)) {
            const student = studentMap.get(studentId);
            const progress = calculateStudentProgress(cohort, student.createdAt);
            
            // Add cohort information
            const cohortInfo = {
              _id: cohort._id,
              name: cohort.name,
              progress: progress,
              status: cohort.status,
              startDate: cohort.startDate,
              endDate: cohort.endDate
            };
            
            student.cohorts.push(cohortInfo);
            
            // Update overall progress (average of all cohorts)
            const totalProgress = student.cohorts.reduce((sum, c) => sum + c.progress, 0);
            student.overallProgress = Math.round(totalProgress / student.cohorts.length);
          }
        }
      }
    }
    
    return Array.from(studentMap.values());
  };

  // Fetch students data
  const fetchStudents = async () => {
    try {
      let studentsData = [];
      
      if (isSchoolAdmin(user)) {
        // For school admins, get all students and enrich with cohort data
        const [studentsResponse, cohortsResponse] = await Promise.all([
          userService.getUsersBySchoolAndRole(user.school, ROLES.STUDENT),
          cohortService.getCohortsBySchool(user.school)
        ]);
        
        const rawStudents = studentsResponse.data || [];
        const allCohorts = cohortsResponse.data || [];
        
        // Enrich students with cohort information
        studentsData = await enrichStudentWithCohorts(rawStudents, allCohorts);
      } else {
        // For trainers, get students from their cohorts with complete information
        const cohortResponse = await cohortService.getCohortsByTrainer(user._id);
        const trainerCohorts = cohortResponse.data || [];
        
        // Extract and enrich students from all trainer's cohorts
        const studentMap = new Map();
        
        for (const cohort of trainerCohorts) {
          if (cohort.students && Array.isArray(cohort.students)) {
            for (const student of cohort.students) {
              // Skip if student data is not populated (just an ID)
              if (typeof student === 'string' || !student._id) {
                console.warn(`Student data not populated for cohort ${cohort.name}`);
                continue;
              }
              
              // Calculate progress for this cohort
              const progress = calculateStudentProgress(cohort, student.createdAt);
              
              // Enrich student data with cohort information
              const enrichedStudent = {
                ...student,
                cohorts: studentMap.has(student._id) 
                  ? [...(studentMap.get(student._id).cohorts || []), {
                      _id: cohort._id,
                      name: cohort.name,
                      progress: progress,
                      status: cohort.status,
                      startDate: cohort.startDate,
                      endDate: cohort.endDate
                    }]
                  : [{
                      _id: cohort._id,
                      name: cohort.name,
                      progress: progress,
                      status: cohort.status,
                      startDate: cohort.startDate,
                      endDate: cohort.endDate
                    }],
                // Calculate overall progress (average across cohorts)
                overallProgress: studentMap.has(student._id)
                  ? Math.round(((studentMap.get(student._id).overallProgress || 0) + progress) / 2)
                  : progress,
                // Set status based on cohort activity and user status
                status: student.isActive === false ? 'inactive' : 'active',
                // Add joining date (use earliest cohort join or user creation)
                joinedDate: student.createdAt
              };
              
              studentMap.set(student._id, enrichedStudent);
            }
          }
        }
        
        studentsData = Array.from(studentMap.values());
      }
      
      setStudents(studentsData);
      
      // Calculate basic stats from student data
      const totalStudents = studentsData.length;
      const activeStudents = studentsData.filter(s => s.status === 'active').length;
      
      setStats(prevStats => ({
        ...prevStats,
        totalStudents,
        activeStudents
      }));
      
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    }
  };

  // Calculate analytics-based stats
  const calculateAnalyticsStats = (analytics, studentsCount) => {
    if (!analytics) return;
    
    try {
      // Extract completion rate from submissions analytics
      const submissionData = analytics.submissions;
      let completionRate = 0;
      let averageProgress = 0;
      
      if (submissionData && submissionData.data) {
        // Calculate completion rate from submission statistics
        const stats = submissionData.data.statistics;
        if (stats && stats.total > 0) {
          completionRate = Math.round((stats.completed / stats.total) * 100);
        }
        
        // Calculate average progress from performance data
        const performance = submissionData.data.performance;
        if (performance && performance.averageScore !== undefined) {
          averageProgress = Math.round(performance.averageScore);
        }
      }
      
      // Update stats with analytics data
      setStats(prevStats => ({
        ...prevStats,
        completionRate,
        averageProgress
      }));
    } catch (error) {
      console.error('Error calculating analytics stats:', error);
      // Fallback to basic calculations
      setStats(prevStats => ({
        ...prevStats,
        completionRate: studentsCount > 0 ? Math.round((prevStats.activeStudents / studentsCount) * 100) : 0,
        averageProgress: 0
      }));
    }
  };

  // Fetch cohorts data
  const fetchCohorts = async () => {
    try {
      let response;
      if (isSchoolAdmin(user)) {
        response = await cohortService.getCohortsBySchool(user.school);
      } else {
        response = await cohortService.getCohortsByTrainer(user._id);
      }
      setCohorts(response.data || []);
    } catch (error) {
      console.error('Error fetching cohorts:', error);
    }
  };

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          // Fetch students and cohorts first
          await Promise.all([fetchStudents(), fetchCohorts()]);
          
          // Then fetch analytics and calculate stats
          const analytics = await fetchAnalytics();
          if (analytics) {
            calculateAnalyticsStats(analytics, students.length);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [user]);
  
  // Update analytics stats when students data changes
  useEffect(() => {
    if (analyticsData && students.length > 0) {
      calculateAnalyticsStats(analyticsData, students.length);
    }
  }, [analyticsData, students]);

  // Handle student invitation
  const handleInviteStudents = async () => {
    if (!inviteEmails.trim() || !inviteCohort) {
      toast.error('Please provide email addresses and select a cohort');
      return;
    }

    try {
      const emails = inviteEmails.split(',').map(email => email.trim()).filter(email => email);
      await cohortService.inviteStudentsToCohort(inviteCohort, emails);
      
      toast.success(`Invited ${emails.length} student(s) successfully`);
      setIsInviteDialogOpen(false);
      setInviteEmails('');
      setInviteCohort('');
      fetchStudents();
    } catch (error) {
      console.error('Error inviting students:', error);
      toast.error('Failed to invite students');
    }
  };

  // Handle opening student management modal
  const handleManageStudent = (student) => {
    setSelectedStudent(student);
    setEditStudentData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      isActive: student.isActive !== false
    });
    setStudentCohorts(student.cohorts || []);
    setAvailableCohorts(cohorts.filter(cohort => 
      !student.cohorts?.some(sc => sc._id === cohort._id)
    ));
    setIsManageDialogOpen(true);
  };

  const handleViewStudent = (student) => {
    setViewStudent(student);
    setIsViewDialogOpen(true);
  };

  // Handle updating student information
  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    const { firstName, lastName, email, isActive } = editStudentData;
    
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await userService.updateUser(selectedStudent._id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        isActive
      });
      
      toast.success('Student updated successfully');
      setIsManageDialogOpen(false);
      fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    }
  };

  // Handle adding student to cohort
  const handleAddToCohort = async (cohortId) => {
    if (!selectedStudent) return;

    try {
      await cohortService.addStudentToCohort(cohortId, selectedStudent._id);
      toast.success('Student added to cohort successfully');
      
      // Update local state
      const cohort = cohorts.find(c => c._id === cohortId);
      if (cohort) {
        setStudentCohorts(prev => [...prev, cohort]);
        setAvailableCohorts(prev => prev.filter(c => c._id !== cohortId));
      }
    } catch (error) {
      console.error('Error adding student to cohort:', error);
      toast.error('Failed to add student to cohort');
    }
  };

  // Handle removing student from cohort
  const handleRemoveFromCohort = async (cohortId) => {
    if (!selectedStudent) return;

    try {
      await cohortService.removeStudentFromCohort(cohortId, selectedStudent._id);
      toast.success('Student removed from cohort successfully');
      
      // Update local state
      const cohort = studentCohorts.find(c => c._id === cohortId);
      if (cohort) {
        setStudentCohorts(prev => prev.filter(c => c._id !== cohortId));
        setAvailableCohorts(prev => [...prev, cohort]);
      }
    } catch (error) {
      console.error('Error removing student from cohort:', error);
      toast.error('Failed to remove student from cohort');
    }
  };

  // Handle deleting student
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      await userService.deleteUser(selectedStudent._id);
      toast.success('Student deleted successfully');
      setIsManageDialogOpen(false);
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  // Handle manual student creation
  const handleCreateStudent = async () => {
    const { firstName, lastName, email, cohort } = createStudentData;
    
    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('Please fill in all required fields (First Name, Last Name, and Email)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      // Create student using invite API with student role
      const inviteData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: 'student',
        schoolId: user.school
      };
      
      // Create the user first
      const response = await userService.inviteUser(inviteData);
      const createdUser = response.data;
      
      // Add student to cohort if selected
      if (cohort && cohort !== 'none' && createdUser._id) {
        try {
          await cohortService.addStudentToCohort(cohort, createdUser._id);
          toast.success(`Student invitation sent to ${email.trim()} and added to cohort`);
        } catch (cohortError) {
          console.error('Error adding student to cohort:', cohortError);
          toast.success(`Student invitation sent to ${email.trim()}, but failed to add to cohort`);
        }
      } else {
        toast.success(`Student invitation sent to ${email.trim()}`);
      }
      
      setIsCreateDialogOpen(false);
      setCreateStudentData({
        firstName: '',
        lastName: '',
        email: '',
        cohort: 'none'
      });
      fetchStudents();
    } catch (error) {
      console.error('Error creating student:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create student';
      toast.error(errorMessage);
    }
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    // Improved search to handle firstName, lastName, and email
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    const matchesSearch = searchTerm === '' || 
                         fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Improved cohort filtering
    const matchesCohort = selectedCohort === 'all' || 
                         (student.cohorts && Array.isArray(student.cohorts) && 
                          student.cohorts.some(cohort => 
                            (typeof cohort === 'string' ? cohort : cohort._id) === selectedCohort
                          ));
    
    // Improved status filtering with fallback
    const studentStatus = student.status || student.isActive === false ? 'inactive' : 'active';
    const matchesStatus = selectedStatus === 'all' || studentStatus === selectedStatus;
    
    return matchesSearch && matchesCohort && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="relative">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">
                Students
              </h1>
              <p className="text-slate-600 mt-1 font-normal">
                {isSchoolAdmin(user) ? 'Manage all students in your school' : 'View and manage your students'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-slate-900 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700">Student Management</span>
            </div>
          </div>
          
          {/* Performance Indicators */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
              <span className="text-slate-600">Active Students: {stats.activeStudents}</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600 font-medium">{stats.completionRate}% completion rate</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Students</CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-900">{stats.totalStudents}</div>
              <p className="text-xs text-slate-500 mt-1">Across all cohorts</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-900">{stats.activeStudents}</div>
              <p className="text-xs text-slate-500 mt-1">Currently enrolled</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                  <div className="text-2xl font-light text-slate-400">--</div>
                </div>
              ) : (
                <div className="text-2xl font-light text-slate-900">{stats.completionRate}%</div>
              )}
              <p className="text-xs text-slate-500 mt-1">Assignment completion</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Average Progress</CardTitle>
              <BarChart3 className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                  <div className="text-2xl font-light text-slate-400">--</div>
                </div>
              ) : (
                <div className="text-2xl font-light text-slate-900">{stats.averageProgress}%</div>
              )}
              <p className="text-xs text-slate-500 mt-1">Course progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-medium text-slate-900">Student Directory</CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  View and manage student information and progress
                </CardDescription>
              </div>
              {isSchoolAdmin(user) && (
                <div className="flex items-center space-x-3">
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-slate-900">Add New Student</DialogTitle>
                        <DialogDescription className="text-slate-600">
                          Create a new student account manually
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                              First Name
                            </Label>
                            <Input
                              id="firstName"
                              placeholder="John"
                              value={createStudentData.firstName}
                              onChange={(e) => setCreateStudentData(prev => ({ ...prev, firstName: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                              Last Name
                            </Label>
                            <Input
                              id="lastName"
                              placeholder="Doe"
                              value={createStudentData.lastName}
                              onChange={(e) => setCreateStudentData(prev => ({ ...prev, lastName: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john.doe@email.com"
                            value={createStudentData.email}
                            onChange={(e) => setCreateStudentData(prev => ({ ...prev, email: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="createCohort" className="text-sm font-medium text-slate-700">
                            Assign to Cohort (Optional)
                          </Label>
                          <Select value={createStudentData.cohort} onValueChange={(value) => setCreateStudentData(prev => ({ ...prev, cohort: value }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select a cohort" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No cohort assignment</SelectItem>
                              {cohorts.map((cohort) => (
                                <SelectItem key={cohort._id} value={cohort._id}>
                                  {cohort.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateStudent}
                            className="bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create Student
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                     <DialogTrigger asChild>
                       <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                         <Mail className="h-4 w-4 mr-2" />
                         Invite Students
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900">Invite Students</DialogTitle>
                      <DialogDescription className="text-slate-600">
                        Send invitations to new students to join a cohort
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="emails" className="text-sm font-medium text-slate-700">
                          Email Addresses
                        </Label>
                        <Input
                          id="emails"
                          placeholder="student1@email.com, student2@email.com"
                          value={inviteEmails}
                          onChange={(e) => setInviteEmails(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-500 mt-1">Separate multiple emails with commas</p>
                      </div>
                      <div>
                        <Label htmlFor="cohort" className="text-sm font-medium text-slate-700">
                          Assign to Cohort
                        </Label>
                        <Select value={inviteCohort} onValueChange={setInviteCohort}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select a cohort" />
                          </SelectTrigger>
                          <SelectContent>
                            {cohorts.map((cohort) => (
                              <SelectItem key={cohort._id} value={cohort._id}>
                                {cohort.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsInviteDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleInviteStudents}
                          className="bg-slate-900 hover:bg-slate-800 text-white"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invitations
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              )}
            </div>
          </CardHeader>

          {/* Student Management Modal */}
          <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-900">
                  Manage Student: {selectedStudent?.firstName} {selectedStudent?.lastName}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Edit student information, manage cohort assignments, and more
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editFirstName" className="text-sm font-medium text-slate-700">
                        First Name
                      </Label>
                      <Input
                        id="editFirstName"
                        value={editStudentData.firstName}
                        onChange={(e) => setEditStudentData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editLastName" className="text-sm font-medium text-slate-700">
                        Last Name
                      </Label>
                      <Input
                        id="editLastName"
                        value={editStudentData.lastName}
                        onChange={(e) => setEditStudentData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editEmail" className="text-sm font-medium text-slate-700">
                      Email Address
                    </Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editStudentData.email}
                      onChange={(e) => setEditStudentData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="editIsActive"
                      checked={editStudentData.isActive}
                      onChange={(e) => setEditStudentData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="editIsActive" className="text-sm font-medium text-slate-700">
                      Active Student
                    </Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsManageDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateStudent}
                      className="bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Update Student
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="cohorts" className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Current Cohorts</h4>
                    {studentCohorts.length > 0 ? (
                      <div className="space-y-2">
                        {studentCohorts.map((cohort) => (
                          <div key={cohort._id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900">{cohort.name}</p>
                              <p className="text-sm text-slate-500">
                                {new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveFromCohort(cohort._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">No cohorts assigned</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Available Cohorts</h4>
                    {availableCohorts.length > 0 ? (
                      <div className="space-y-2">
                        {availableCohorts.map((cohort) => (
                          <div key={cohort._id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900">{cohort.name}</p>
                              <p className="text-sm text-slate-500">
                                {new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddToCohort(cohort._id)}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">No available cohorts</p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="actions" className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Danger Zone</h4>
                      <p className="text-sm text-red-600 mb-3">
                        Deleting a student will permanently remove their account and all associated data. This action cannot be undone.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleDeleteStudent}
                        className="text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Student
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          <CardContent>
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCohort} onValueChange={setSelectedCohort}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by cohort" />
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Students Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-medium text-slate-700">Student</TableHead>
                    <TableHead className="font-medium text-slate-700">Email</TableHead>
                    <TableHead className="font-medium text-slate-700">Cohort</TableHead>
                    <TableHead className="font-medium text-slate-700">Status</TableHead>
                    <TableHead className="font-medium text-slate-700">Progress</TableHead>
                    <TableHead className="font-medium text-slate-700">Joined</TableHead>
                    {isSchoolAdmin(user) && (
                      <TableHead className="font-medium text-slate-700">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSchoolAdmin(user) ? 7 : 6} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="h-8 w-8 text-slate-400" />
                          <p className="text-slate-500">No students found</p>
                          <p className="text-sm text-slate-400">
                            {searchTerm || selectedCohort !== 'all' || selectedStatus !== 'all'
                              ? 'Try adjusting your filters'
                              : 'Invite students to get started'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      // Use enriched student data
                      const progress = student.overallProgress || 0;
                      const joinedDate = new Date(student.joinedDate || student.createdAt || Date.now()).toLocaleDateString();
                      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Unknown';
                      const initials = student.firstName && student.lastName 
                        ? `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase()
                        : (student.name?.charAt(0)?.toUpperCase() || 'S');
                      
                      return (
                        <TableRow 
                          key={student._id} 
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => !isSchoolAdmin(user) ? handleViewStudent(student) : handleManageStudent(student)}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.avatar} alt={fullName} />
                                <AvatarFallback className="text-sm font-medium">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900">{fullName}</p>
                                <p className="text-sm text-slate-500">{student.studentId || `ID: ${student._id.slice(-6)}`}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">{student.email}</TableCell>
                          <TableCell>
                            {student.cohorts && student.cohorts.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {student.cohorts.slice(0, 2).map((cohort) => (
                                  <Badge key={cohort._id} variant="secondary" className="text-xs">
                                    {cohort.name}
                                  </Badge>
                                ))}
                                {student.cohorts.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{student.cohorts.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">No cohort</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={student.status === 'active' ? 'default' : 'secondary'}
                              className={`${
                                student.status === 'active' 
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' 
                                  : student.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                  : 'bg-slate-100 text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              {student.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-slate-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    progress >= 80 ? 'bg-emerald-500' :
                                    progress >= 60 ? 'bg-blue-500' :
                                    progress >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-slate-600">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">{joinedDate}</TableCell>
                          {isSchoolAdmin(user) && (
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManageStudent(student);
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Results Summary */}
            {filteredStudents.length > 0 && (
              <div className="mt-4 text-sm text-slate-600">
                Showing {filteredStudents.length} of {students.length} students
              </div>
            )}
          </CardContent>
        </Card>

        {/* View-Only Student Details Modal for Trainers */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={viewStudent?.avatar} 
                    alt={`${viewStudent?.firstName || ''} ${viewStudent?.lastName || ''}`}
                  />
                  <AvatarFallback className="text-lg font-medium">
                    {viewStudent?.firstName?.charAt(0) || ''}{viewStudent?.lastName?.charAt(0) || ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {viewStudent?.firstName} {viewStudent?.lastName}
                  </h3>
                  <p className="text-sm text-slate-500">{viewStudent?.email}</p>
                </div>
              </DialogTitle>
              <DialogDescription>
                Student Details - View Only
              </DialogDescription>
            </DialogHeader>

            {viewStudent && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Student ID</Label>
                    <p className="text-sm text-slate-900 mt-1">
                      {viewStudent.studentId || `ID: ${viewStudent._id?.slice(-6)}`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={viewStudent.status === 'active' ? 'default' : 'secondary'}
                        className={`${
                          viewStudent.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : viewStudent.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {viewStudent.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Joined Date</Label>
                    <p className="text-sm text-slate-900 mt-1">
                      {new Date(viewStudent.joinedDate || viewStudent.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Overall Progress</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-20 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (viewStudent.overallProgress || 0) >= 80 ? 'bg-emerald-500' :
                            (viewStudent.overallProgress || 0) >= 60 ? 'bg-blue-500' :
                            (viewStudent.overallProgress || 0) >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.min(viewStudent.overallProgress || 0, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-600">{viewStudent.overallProgress || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Cohort Information */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">Enrolled Cohorts</Label>
                  {viewStudent.cohorts && viewStudent.cohorts.length > 0 ? (
                    <div className="space-y-3">
                      {viewStudent.cohorts.map((cohort) => (
                        <div key={cohort._id} className="border rounded-lg p-4 bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-slate-900">{cohort.name}</h4>
                              <p className="text-sm text-slate-500">
                                {new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {cohort.status || 'active'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs text-slate-600">Progress:</Label>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-slate-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    (cohort.progress || 0) >= 80 ? 'bg-emerald-500' :
                                    (cohort.progress || 0) >= 60 ? 'bg-blue-500' :
                                    (cohort.progress || 0) >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${Math.min(cohort.progress || 0, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-600">{cohort.progress || 0}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No cohorts assigned</p>
                  )}
                </div>

                {/* Contact Information */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">Contact Information</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-900">{viewStudent.email}</span>
                    </div>
                    {viewStudent.phone && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-900">{viewStudent.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default withAuth(StudentsPage, { 
  roles: [ROLES.ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TRAINER] 
});