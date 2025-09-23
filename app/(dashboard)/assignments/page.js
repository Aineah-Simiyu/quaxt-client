'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { assignmentService, userService } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, FileText, Calendar, Clock, CheckCircle2, AlertCircle, Users, XCircle } from 'lucide-react';
import { ROLES, isInstructorOrAdmin } from '@/lib/constants';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submittedAssignments, setSubmittedAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Current user:', user);
        console.log('User role:', user?.role);
        
        // Don't fetch if user is not loaded yet
        if (!user) {
          console.log('User not loaded yet, skipping fetch');
          setLoading(false);
          return;
        }
        
        // Fetch assignments
        const assignmentsResponse = await assignmentService.getAssignments();
        const assignmentsData = assignmentsResponse?.data?.data?.assignments?.docs || [];
        setAssignments(assignmentsData);
        
        // Fetch current user's submitted assignments (only for students)
        if (user?.role === 'student') {
          try {
            const userProfile = await userService.getCurrentProfile();
            console.log('Full user profile response:', userProfile);
            console.log('User profile data path:', userProfile?.data);
            console.log('User object:', userProfile?.data?.user); // Fixed: removed extra .data
            console.log('Submitted assignments from API:', userProfile?.data?.user?.submittedAssignments); // Fixed path
            
            const userSubmittedAssignments = userProfile?.data?.user?.submittedAssignments || []; // Fixed path
            console.log('Setting submitted assignments to:', userSubmittedAssignments);
            setSubmittedAssignments(userSubmittedAssignments);
          } catch (userError) {
            console.error('User profile fetch error:', userError);
            setSubmittedAssignments([]);
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load assignments"
        });
        console.error('Assignments fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]); // Added toast to dependencies

  // Use only real data from the API
  const assignmentData = assignments;
  
  // Helper function to check if assignment is submitted (for students)
  const isAssignmentSubmitted = (assignmentId) => {
    console.log('Checking submission for:', assignmentId);
    console.log('Submitted assignments:', submittedAssignments);
    console.log('Is submitted:', submittedAssignments.includes(assignmentId));
    return submittedAssignments.includes(assignmentId);
  };

  // Helper function to check if assignment is overdue
  const isAssignmentOverdue = (dueDateString) => {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    return today > dueDate;
  };

  // Helper function to get assignment status
  const getAssignmentStatus = (assignment) => {
    const assignmentId = assignment._id || assignment.id;
    const isSubmitted = user?.role === 'student' && isAssignmentSubmitted(assignmentId);
    const isOverdue = isAssignmentOverdue(assignment.dueDate);
    
    if (isSubmitted) return 'submitted';
    if (isOverdue) return 'overdue';
    return 'active';
  };

  // Filter assignments based on search query and active tab
  const filteredAssignments = assignmentData.filter((assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assignment.instructions && assignment.instructions.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'all') return true;
    
    // For students, filter based on submission status and overdue status
    if (user?.role === 'student') {
      const status = getAssignmentStatus(assignment);
      
      if (activeTab === 'completed') return status === 'submitted';
      if (activeTab === 'overdue') return status === 'overdue';
      if (activeTab === 'active' || activeTab === 'pending') return status === 'active';
    }
    
    // For instructors/admins, show all assignments in all tabs for now
    return true;
  });

  const getStatusCounts = () => {
    if (user?.role === 'student') {
      const submittedCount = assignmentData.filter(assignment => 
        getAssignmentStatus(assignment) === 'submitted'
      ).length;
      const overdueCount = assignmentData.filter(assignment => 
        getAssignmentStatus(assignment) === 'overdue'
      ).length;
      const activeCount = assignmentData.filter(assignment => 
        getAssignmentStatus(assignment) === 'active'
      ).length;
      
      return {
        all: assignmentData.length,
        active: activeCount,
        pending: activeCount,
        completed: submittedCount,
        overdue: overdueCount
      };
    }
    
    return {
      all: assignmentData.length,
      active: assignmentData.length,
      pending: 0,
      completed: 0,
      overdue: 0
    };
  };

  const statusCounts = getStatusCounts();

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">
              Assignments
            </h1>
            <p className="text-slate-600 mt-1 font-normal">
              {assignmentData.length} active assignments • Manage deliverables and timelines
            </p>
          </div>
          {isInstructorOrAdmin(user) && (
            <Button 
              asChild 
              className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-4 py-2 h-9"
            >
              <Link href="/assignments/create">
                <Plus className="mr-2 h-4 w-4" /> New Assignment
              </Link>
            </Button>
          )}
        </div>

        {/* Search and Controls */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search Assignments..."
                className="pl-9 h-9 border-slate-200 focus:border-slate-400 focus:ring-0 bg-slate-50 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-200 hover:bg-slate-50 text-slate-600 font-medium h-9"
              >
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-200 hover:bg-slate-50 text-slate-600 font-medium h-9"
              >
                <Calendar className="mr-2 h-4 w-4" /> Sort by Date
              </Button>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-slate-200 mb-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'all'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                All Assignments
                <span className="ml-2 px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full">
                  {statusCounts.all}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'active'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                Active
                <span className="ml-2 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                  {statusCounts.active}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'pending'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                Pending
                <span className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                  {statusCounts.pending}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'completed'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                Completed
                <span className="ml-2 px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full">
                  {statusCounts.completed}
                </span>
              </button>
              {/* Add Overdue tab for students */}
              {user?.role === 'student' && (
                <button
                  onClick={() => setActiveTab('overdue')}
                  className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === 'overdue'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  Overdue
                  <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                    {statusCounts.overdue}
                  </span>
                </button>
              )}
            </nav>
          </div>

          <TabsContent value={activeTab}>
            {filteredAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg p-12 text-center">
                <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Assignments found</h3>
                <p className="text-slate-600 text-sm max-w-md">
                  {searchQuery
                    ? "No Assignments match your search criteria. Try adjusting your filters."
                    : "You don't have any Assignments in this category yet. New Assignments will appear here."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAssignments.map((assignment) => {
                  const status = getAssignmentStatus(assignment);
                  const isSubmitted = status === 'submitted';
                  const isOverdue = status === 'overdue';
                  const isClickable = !isSubmitted && !isOverdue;
                  
                  const cardContent = (
                    <Card className={`h-full transition-all duration-200 border ${
                      isSubmitted 
                        ? 'opacity-75 cursor-default border-emerald-200 bg-emerald-50/30' 
                        : isOverdue
                        ? 'opacity-75 cursor-not-allowed border-red-200 bg-red-50/30'
                        : 'cursor-pointer hover:shadow-md hover:border-slate-300 bg-white border-slate-200 group'
                    }`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className={`line-clamp-2 text-base font-semibold ${
                            isOverdue ? 'text-red-900' : 'text-slate-900'
                          } ${isClickable ? 'group-hover:text-slate-700' : ''}`}>
                            {assignment.title}
                          </CardTitle>
                          <div className="flex items-center">
                            {isSubmitted ? (
                              <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 font-medium">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Submitted
                              </Badge>
                            ) : isOverdue ? (
                              <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 font-medium">
                                <XCircle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 font-medium">
                                <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center space-x-4 text-sm ${
                          isOverdue ? 'text-red-500' : 'text-slate-500'
                        }`}>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(assignment.dueDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {isOverdue 
                                ? `${Math.abs(calculateDaysLeft(assignment.dueDate))} days overdue`
                                : `${calculateDaysLeft(assignment.dueDate)} days left`
                              }
                            </span>
                          </div>
                        </div>
                        {assignment.cohorts && assignment.cohorts.length > 0 && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <div className="flex flex-wrap gap-1">
                              {assignment.cohorts.slice(0, 2).map((cohort, index) => (
                                <span key={cohort._id || index} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                                  {cohort.name || `Cohort ${index + 1}`}
                                </span>
                              ))}
                              {assignment.cohorts.length > 2 && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">
                                  +{assignment.cohorts.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className={`line-clamp-3 text-sm leading-relaxed ${
                          isOverdue ? 'text-slate-500' : 'text-slate-600'
                        }`}>
                          {assignment.description}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">
                              {assignment.points} pts
                            </div>
                            <div className="px-2 py-1 bg-blue-50 rounded text-xs font-medium text-blue-700">
                              Assignment
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            {isSubmitted 
                              ? 'Submitted ✓' 
                              : isOverdue 
                              ? 'Overdue ⚠️'
                              : 'View Details →'
                            }
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                  
                  return (
                    <div key={assignment._id || assignment.id}>
                      {isClickable ? (
                        <Link href={`/assignments/${assignment._id || assignment.id}`}>
                          {cardContent}
                        </Link>
                      ) : (
                        cardContent
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Stats */}
        <div className="mt-8 flex items-center justify-between text-sm text-slate-600 pt-6 border-t border-slate-200">
          <div className="flex items-center space-x-6">
            <span>{filteredAssignments.length} Assignments displayed</span>
            <span>Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="hover:text-slate-900 font-medium">Export List</button>
            <button className="hover:text-slate-900 font-medium">Print View</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getStatusVariant(status) {
  switch (status) {
    case 'submitted':
    case 'completed':
      return 'success';
    case 'active':
    case 'in-progress':
      return 'default';
    case 'not-started':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function formatStatus(status) {
  switch (status) {
    case 'submitted':
      return 'Submitted';
    case 'completed':
      return 'Completed';
    case 'in-progress':
      return 'In Progress';
    case 'not-started':
      return 'Not Started';
    case 'overdue':
      return 'Overdue';
    case 'active':
      return 'Active';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');
  }
}

function formatDate(dateString) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function calculateDaysLeft(dueDateString) {
  const dueDate = new Date(dueDateString);
  const today = new Date();
  const timeDiff = dueDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysDiff; // Return actual difference (can be negative for overdue)
}