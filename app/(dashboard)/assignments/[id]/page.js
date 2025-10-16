'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { assignmentService } from '@/lib/api';
import fileService from '@/lib/api/fileService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Calendar, Clock, Download, Upload, CheckCircle, AlertCircle, Users, FileText, Star, Edit, Trash2, MoreHorizontal, TrendingUp, Award, Target, BookOpen, Eye, MessageSquare, BarChart3, GraduationCap, Settings, Shield, Filter, ExternalLink, X } from 'lucide-react';
import {FILE_UPLOAD, isInstructor} from '@/lib/constants';

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);

  const [submissionText, setSubmissionText] = useState('');
  const [submissionLinks, setSubmissionLinks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);
  const { toast } = useToast();

  // Role-based access control
  const isStudent = user?.role === 'student';
  const isTrainer = user?.role === 'trainer';
  const isSchoolAdmin = user?.role === 'school_admin';
  const isInstructorOrAdmin = isTrainer || isSchoolAdmin;

  // Get role-specific styling and icons
  const getRoleConfig = () => {
    if (isSchoolAdmin) {
      return {
        icon: Shield,
        color: 'bg-purple-600',
        accent: 'purple',
        title: 'School Administrator View'
      };
    }
    if (isTrainer) {
      return {
        icon: GraduationCap,
        color: 'bg-blue-600',
        accent: 'blue',
        title: 'Trainer View'
      };
    }
    return {
      icon: BookOpen,
      color: 'bg-emerald-600',
      accent: 'emerald',
      title: 'Student View'
    };
  };
  
  const roleConfig = getRoleConfig();

  // Helper function to check if assignment is overdue
  const isAssignmentOverdue = (dueDateString) => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    return today > dueDate;
  };

  // Check if current assignment is overdue
  const isOverdue = assignment ? isAssignmentOverdue(assignment.dueDate) : false;

  // React Query: assignment data
  const assignmentQuery = useQuery({
    queryKey: ['assignment', id],
    enabled: !!id,
    queryFn: () => assignmentService.getAssignment(id),
  });

  // React Query: instructor/admin submissions and analytics
  const submissionsQuery = useQuery({
    queryKey: ['assignment', id, 'submissions'],
    enabled: !!id && isInstructorOrAdmin,
    queryFn: () => assignmentService.getSubmissions(id),
  });

  const analyticsQuery = useQuery({
    queryKey: ['assignment', id, 'analytics'],
    enabled: !!id && isInstructorOrAdmin,
    queryFn: () => assignmentService.getAssignmentAnalytics(id),
  });

  // React Query: student submission
  const mySubmissionQuery = useQuery({
    queryKey: ['assignment', id, 'mySubmission', user?.id],
    enabled: !!id && isStudent && !!user?.id,
    queryFn: () => assignmentService.getSubmissions(id, { studentId: user.id }),
  });

  // Sync query data into local state as before (minimal UI changes)
  useEffect(() => {
    if (assignmentQuery.data) setAssignment(assignmentQuery.data);
  }, [assignmentQuery.data]);

  useEffect(() => {
    if (isInstructorOrAdmin) {
      if (submissionsQuery.data) setSubmissions(submissionsQuery.data || []);
      if (analyticsQuery.data) setAnalytics(analyticsQuery.data || null);
    }
  }, [isInstructorOrAdmin, submissionsQuery.data, analyticsQuery.data]);

  useEffect(() => {
    if (isStudent && assignment) {
      if (assignment.submission) {
        setSubmission(assignment.submission);
        return;
      }
      if (assignment.gradedSubmissions && assignment.gradedSubmissions.length > 0) {
        const gradedSubmission = assignment.gradedSubmissions.find(sub => sub.student === user.id);
        if (gradedSubmission) {
          setSubmission(gradedSubmission);
          return;
        }
      }
      if (mySubmissionQuery.data) {
        const arr = mySubmissionQuery.data || [];
        if (arr.length > 0) setSubmission(arr[0]);
        else setSubmission({ status: 'draft', submittedAt: null, grade: null, feedback: null, files: [] });
      }
    }
  }, [isStudent, assignment, mySubmissionQuery.data, user]);

  useEffect(() => {
    const l = assignmentQuery.isLoading || (isInstructorOrAdmin && (submissionsQuery.isLoading || analyticsQuery.isLoading)) || (isStudent && mySubmissionQuery.isLoading);
    setLoading(!!l);
  }, [assignmentQuery.isLoading, submissionsQuery.isLoading, analyticsQuery.isLoading, mySubmissionQuery.isLoading, isInstructorOrAdmin, isStudent]);

  // Prefill form fields when submission data is loaded or when entering edit mode
  useEffect(() => {
    if (submission && submission.content && isStudent && (submission.status !== 'submitted' || isEditingSubmission)) {
      // Prefill text content
      if (submission.content.text) {
        setSubmissionText(submission.content.text);
      }
      
      // Prefill links
      if (submission.content.links && submission.content.links.length > 0) {
        setSubmissionLinks(submission.content.links);
      }
      
      // Note: Files are handled differently since they're already uploaded
      // They will be displayed in the submitted files section
    }
  }, [submission, isStudent, isEditingSubmission]);

  const handleEditSubmission = () => {
    setIsEditingSubmission(true);
  };

  const handleCancelEdit = () => {
    setIsEditingSubmission(false);
    // Reset form fields to original submission content
    if (submission && submission.content) {
      setSubmissionText(submission.content.text || '');
      setSubmissionLinks(submission.content.links || []);
      setSelectedFiles([]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleMultipleFileSelection(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleMultipleFileSelection(files);
    }
  };

  const handleMultipleFileSelection = (files) => {
    const validFiles = [];
    for (const file of files) {
      if (validateFile(file)) {
        validFiles.push(file);
      }
    }
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const validateFile = (file) => {
    const maxSize = FILE_UPLOAD.MAX_SIZE;
    
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `File size should be less than ${maxSize / (1024 * 1024)}MB`
      });
      return false;
    }
    
    if (assignment?.allowedFileTypes && assignment.allowedFileTypes.length > 0) {
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (!assignment.allowedFileTypes.includes(fileExt)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: `Allowed file types: ${assignment.allowedFileTypes.join(', ')}`
        });
        return false;
      }
    }
    
    return true;
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    setSubmissionLinks(prev => [...prev, { url: '', title: '' }]);
  };

  const updateLink = (index, field, value) => {
    setSubmissionLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const removeLink = (index) => {
    setSubmissionLinks(prev => prev.filter((_, i) => i !== index));
  };

  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, grade, feedback }) => assignmentService.gradeSubmission(submissionId, { grade, feedback }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignment', id, 'submissions'] });
      setGradingSubmission(null);
      toast({ title: 'Success', description: 'Submission graded successfully' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to grade submission' });
    },
  });

  const handleGradeSubmission = async (submissionId, grade, feedback) => {
    await gradeMutation.mutateAsync({ submissionId, grade, feedback });
  };

  const deleteAssignmentMutation = useMutation({
    mutationFn: () => assignmentService.deleteAssignment(id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Assignment deleted successfully' });
      qc.invalidateQueries({ queryKey: ['assignments'] });
      router.push('/assignments');
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete assignment' });
    },
  });

  const handleDeleteAssignment = async () => {
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) return;
    await deleteAssignmentMutation.mutateAsync();
  };

  const hasSubmissionContent = () => {
    return submissionText.trim().length > 0 || selectedFiles.length > 0 || submissionLinks.some(link => link.url.trim().length > 0);
  };

  const submitMutation = useMutation({
    mutationFn: ({ isEdit, submissionId, submissionData }) => {
      return isEdit && submissionId
        ? assignmentService.updateSubmission(submissionId, submissionData)
        : assignmentService.submitAssignment(id, submissionData);
    },
    onSuccess: (result) => {
      setSubmission(result);
      setSelectedFiles([]);
      setSubmissionText('');
      setSubmissionLinks([]);
      setIsEditingSubmission(false);
      qc.invalidateQueries({ queryKey: ['assignment', id] });
      qc.invalidateQueries({ queryKey: ['assignment', id, 'mySubmission', user?.id] });
      qc.invalidateQueries({ queryKey: ['assignment', id, 'submissions'] });
      toast({ title: 'Success', description: isEditingSubmission ? 'Assignment updated successfully' : 'Assignment submitted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Submission failed', description: error?.message || 'Failed to submit assignment' });
    },
    onSettled: () => setSubmitting(false),
  });

  const handleSubmit = async () => {
    if (!hasSubmissionContent()) {
      toast({
        variant: "destructive",
        title: "Missing content",
        description: "Please add some content to submit"
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare submission data
      const submissionData = {
        content: {}
      };
      
      // Add text content
      if (submissionText.trim()) {
        submissionData.content.text = submissionText.trim();
      }
      
      // Add links
      if (submissionLinks.length > 0) {
        submissionData.content.links = submissionLinks.filter(link => link.url.trim().length > 0);
      }
      
      // Upload files first if any
      if (selectedFiles.length > 0) {
        try {
          const uploadResponses = await fileService.uploadFiles(selectedFiles);
          submissionData.content.files = uploadResponses.map(response => response.data.file);
          // 
          // 
        } catch (uploadError) {
          toast({
            variant: "destructive",
            title: "File upload failed",
            description: "Failed to upload files. Please try again."
          });
          console.error('File upload error:', uploadError);
          return;
        }
      }
      await submitMutation.mutateAsync({ isEdit: isEditingSubmission, submissionId: submission?._id, submissionData });
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      // handled in onSettled
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Assignment Not Found</h2>
        <p className="text-muted-foreground">The assignment you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Button onClick={() => router.push('/assignments')}>Back to Assignments</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center flex-wrap gap-4 justify-between mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/assignments')}
              className="text-slate-600 hover:text-slate-900 border-slate-300 hover:border-slate-400 bg-white shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className={`h-8 w-8 ${roleConfig.color} rounded-full flex items-center justify-center`}>
                  <roleConfig.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">{roleConfig.title}</span>
              </div>
              
              {isInstructor(user) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-slate-600 hover:text-slate-900 border-slate-300 bg-white shadow-sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => router.push(`/assignments/${id}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Assignment
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDeleteAssignment}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Assignment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Assignment Header Card */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-light text-slate-900 tracking-tight">{assignment.title}</h1>
                    <p className="text-slate-600 max-w-2xl">{assignment.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isOverdue ? (
                      <Badge className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 font-medium">
                        {assignment.status || 'Published'}
                      </Badge>
                    )}
                    {assignment.priority && (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 font-medium flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {assignment.priority}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{assignment.course || 'General'}</p>
                      <p className="text-xs text-slate-500">Course</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{assignment.points} points</p>
                      <p className="text-xs text-slate-500">Total Points</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{formatDate(assignment.dueDate)}</p>
                      <p className="text-xs text-slate-500">Due Date</p>
                    </div>
                  </div>
                  
                  {isInstructorOrAdmin && (
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{submissions.length}</p>
                        <p className="text-xs text-slate-500">Submissions</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Main Content */}
        {isInstructorOrAdmin ? (
          <Tabs defaultValue="overview" className="space-y-8 w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white border-0 shadow-sm rounded-xl p-1.5 h-14">
              <TabsTrigger 
                value="overview" 
                className="text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-slate-50 data-[state=active]:shadow-sm rounded-lg font-medium transition-all duration-200"
              >
                <Eye className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="submissions" 
                className="text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-slate-50 data-[state=active]:shadow-sm rounded-lg font-medium transition-all duration-200"
              >
                <Users className="h-4 w-4 mr-2" />
                Submissions
              </TabsTrigger>
              {/* <TabsTrigger 
                value="analytics" 
                className="text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-slate-50 data-[state=active]:shadow-sm rounded-lg font-medium transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger> */}
              {/* <TabsTrigger 
                value="grading" 
                className="text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-slate-50 data-[state=active]:shadow-sm rounded-lg font-medium transition-all duration-200"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Grading
              </TabsTrigger> */}
            </TabsList>
          
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assignment Details */}
                <div className="lg:col-span-2 space-y-8">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                      <CardTitle className="text-xl font-light text-slate-900 flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-slate-700" />
                        </div>
                        Assignment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="prose max-w-none">
                        <p className="text-slate-700 leading-relaxed text-base">
                          {assignment.description || 'No description provided.'}
                        </p>
                      </div>
                      
                      {assignment.attachments && assignment.attachments.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-slate-100">
                          <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-3">
                            <div className="h-6 w-6 bg-blue-50 rounded-md flex items-center justify-center">
                              <Download className="h-3 w-3 text-blue-600" />
                            </div>
                            Attachments
                          </h4>
                          <div className="space-y-3">
                            {assignment.attachments.map((attachment, index) => (
                        <div key={attachment.id || `attachment-${index}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <FileText className="h-4 w-4 text-slate-600" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-slate-900">{attachment.name}</span>
                                    <p className="text-xs text-slate-500">{attachment.size}</p>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDownloadAttachment(attachment)}
                                  className="text-slate-600 hover:text-slate-900 border-slate-200 bg-white shadow-sm"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Rubric Section */}
                  {/* {assignment.rubric && (
                    <Card className="border-0 shadow-sm bg-white">
                      <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                        <CardTitle className="text-xl font-light text-slate-900 flex items-center gap-3">
                          <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center">
                            <Star className="h-4 w-4 text-amber-600" />
                          </div>
                          Grading Rubric
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8">
                        <div className="space-y-4">
                          {assignment.rubric.criteria?.map((criterion, index) => (
                            <div key={criterion.id || `criterion-${index}`} className="border border-slate-100 rounded-xl p-6 bg-slate-50/30">
                              <div className="flex justify-between items-start mb-3">
                                <h5 className="font-medium text-slate-900 text-base">{criterion.name}</h5>
                                <span className="text-sm font-semibold text-slate-700 bg-white px-3 py-1 rounded-full">{criterion.points} pts</span>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed">{criterion.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )} */}
                </div>
                
                {/* Sidebar */}
                <div className="space-y-6">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                      <CardTitle className="text-lg font-medium text-slate-900">Assignment Info</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Due Date</span>
                        <span className="text-sm font-medium text-slate-900">{formatDate(assignment.dueDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Points</span>
                        <span className="text-sm font-medium text-slate-900">{assignment.points} pts</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Status</span>
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {assignment.status || 'Published'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          
          <TabsContent value="submissions" className="space-y-6">
            {isInstructorOrAdmin ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                  <CardTitle className="text-xl font-light text-slate-900 flex items-center gap-3">
                    <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-emerald-600" />
                    </div>
                    Student Submissions ({submissions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {submissions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-lg">No submissions yet</p>
                      <p className="text-slate-400 text-sm mt-1">Students haven&apos;t submitted their work for this assignment</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map((sub) => (
                        <div key={sub._id} className="border border-slate-100 rounded-xl p-6 hover:bg-slate-50/50 transition-all duration-200">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                <AvatarImage src={sub.student?.avatar} />
                                <AvatarFallback className="bg-slate-100 text-slate-700 font-medium">
                                  {sub.student?.firstName?.charAt(0) || sub.student?.name?.charAt(0) || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900 text-base">
                                  {sub.student?.firstName && sub.student?.lastName 
                                    ? `${sub.student.firstName} ${sub.student.lastName}` 
                                    : sub.student?.name || 'Unknown Student'
                                  }
                                </p>
                                <div className="space-y-1">
                                  <p className="text-sm text-slate-500">
                                    {sub.student?.email && (
                                      <span className="flex items-center gap-1">
                                        <span>{sub.student.email}</span>
                                      </span>
                                    )}
                                  </p>
                                  {sub.student?.cohorts && sub.student.cohorts.length > 0 && (
                                    <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                                      {sub.student.cohorts[0]?.name || 'Unknown Cohort'}
                                    </p>
                                  )}
                                  <p className="text-sm text-slate-500">Submitted {sub.submittedAt ? formatDate(sub.submittedAt) : 'Not submitted'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 flex-wrap gap-4">
                              {sub.grade !== null && sub.grade.score !== undefined ? (
                                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 font-medium">
                                  {sub.grade.score}/{assignment.points} pts
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 font-medium">
                                  Pending Review
                                </Badge>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => router.push(`/assignments/${id}/submissions`)}
                                className="text-slate-600 hover:text-slate-900 border-slate-200 bg-white shadow-sm"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Student Review
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Student View */
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                  <CardTitle className="text-xl font-light text-slate-900 flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    My Submission
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {submission && submission.status === 'submitted' ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-emerald-900">Submission Completed</p>
                            <p className="text-sm text-emerald-700">Submitted on {formatDate(submission.submittedAt)}</p>
                          </div>
                        </div>
                        {submission.grade !== null && (
                          <Badge className="bg-white text-emerald-700 border border-emerald-200 px-4 py-2 font-medium">
                            {submission.grade}/{assignment.points} pts
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex justify-center">
                        <Button 
                          onClick={() => router.push(`/assignments/${id}/submission`)}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View My Submission
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-slate-900 text-lg font-medium mb-2">Ready to Submit?</p>
                      <p className="text-slate-500 mb-6">Upload your assignment files to get started</p>
                      <Button 
                        onClick={() => router.push(`/assignments/${id}/submit`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Assignment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Key Metrics */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                    <CardTitle className="text-xl font-light text-slate-900 flex items-center gap-3">
                      <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      Assignment Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    {analytics ? (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Total</span>
                          </div>
                          <p className="text-2xl font-light text-slate-900 mb-1">{submissions.length}</p>
                          <p className="text-sm text-blue-600 font-medium">Submissions</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-xl border border-emerald-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Avg</span>
                          </div>
                          <p className="text-2xl font-light text-slate-900 mb-1">
                            {analytics.averageGrade ? `${Math.round(analytics.averageGrade)}%` : 'N/A'}
                          </p>
                          <p className="text-sm text-emerald-600 font-medium">Average Grade</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-xl border border-amber-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 bg-amber-500 rounded-lg flex items-center justify-center">
                              <Target className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Rate</span>
                          </div>
                          <p className="text-2xl font-light text-slate-900 mb-1">
                            {analytics.completionRate ? `${Math.round(analytics.completionRate)}%` : 'N/A'}
                          </p>
                          <p className="text-sm text-amber-600 font-medium">Completion Rate</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-xl border border-red-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 bg-red-500 rounded-lg flex items-center justify-center">
                              <Clock className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">Late</span>
                          </div>
                          <p className="text-2xl font-light text-slate-900 mb-1">
                            {analytics.onTimeRate ? `${100 - Math.round(analytics.onTimeRate)}%` : 'N/A'}
                          </p>
                          <p className="text-sm text-red-600 font-medium">Late Submissions</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-lg">No analytics data</p>
                        <p className="text-slate-400 text-sm mt-1">Analytics will be available once students start submitting</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Grade Distribution */}
                {analytics?.gradeDistribution && (
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                      <CardTitle className="text-xl font-light text-slate-900 flex items-center gap-3">
                        <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <Star className="h-4 w-4 text-indigo-600" />
                        </div>
                        Grade Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-4">
                        {Object.entries(analytics.gradeDistribution).map(([range, count], index) => (
                          <div key={range} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                            <span className="text-sm font-medium text-slate-900">{range}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 bg-slate-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    index === 0 ? 'bg-red-500' :
                                    index === 1 ? 'bg-orange-500' :
                                    index === 2 ? 'bg-yellow-500' :
                                    index === 3 ? 'bg-blue-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${(count / submissions.length) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Performance Insights
              <div className="space-y-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                    <CardTitle className="text-lg font-medium text-slate-900">Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {analytics ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Highest Score</span>
                          <span className="text-sm font-medium text-slate-900">{analytics.highestScore || 'N/A'}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Lowest Score</span>
                          <span className="text-sm font-medium text-slate-900">{analytics.lowestScore || 'N/A'}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">On Time</span>
                          <span className="text-sm font-medium text-slate-900">{analytics.onTimeSubmissions || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Pending Review</span>
                          <span className="text-sm font-medium text-slate-900">{analytics.pendingReview || 0}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">No data available</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                    <CardTitle className="text-lg font-medium text-slate-900">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-slate-600 hover:text-slate-900 border-slate-200 bg-white shadow-sm"
                      onClick={() => router.push(`/assignments/${id}/export`)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Results
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-slate-600 hover:text-slate-900 border-slate-200 bg-white shadow-sm"
                      onClick={() => router.push(`/assignments/${id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Assignment
                    </Button>
                  </CardContent>
                </Card>
              </div> */}
            </div>
          </TabsContent>
          
          {/* Grading Tab */}
          <TabsContent value="grading" className="space-y-6">
            {/* Role-specific grading view */}
            {isInstructorOrAdmin ? (
              <div className="space-y-6">
                {/* Grading Header */}
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-light text-slate-900">Grading & Feedback</CardTitle>
                          <CardDescription className="text-slate-500">Review submissions and provide feedback</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:text-slate-900">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                
                {/* Submissions List */}
                {submissions.length > 0 ? (
                  <div className="grid gap-4">
                    {submissions.map((submission) => (
                      <Card key={submission._id} className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center border border-blue-100">
                                <Users className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900 mb-1">
                                  {submission.student?.firstName && submission.student?.lastName 
                                    ? `${submission.student.firstName} ${submission.student.lastName}` 
                                    : submission.studentName || 'Unknown Student'
                                  }
                                </h4>
                                <div className="space-y-1 mb-2">
                                  {submission.student?.email && (
                                    <p className="text-xs text-slate-500">{submission.student.email}</p>
                                  )}
                                  {submission.student?.cohorts && submission.student.cohorts.length > 0 && (
                                    <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                                      {submission.student.cohorts[0]?.name || 'Unknown Cohort'}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(submission.submittedAt).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {submission.grade ? (
                                <div className="text-right">
                                  <div className="text-lg font-medium text-slate-900">{submission.grade}%</div>
                                  <div className="text-xs text-slate-500">Graded</div>
                                </div>
                              ) : (
                                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                                  Pending Review
                                </Badge>
                              )}
                              
                              <Button 
                                size="sm" 
                                className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                                onClick={() => router.push(`/assignments/${id}/submissions`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Student Review
                              </Button>
                            </div>
                          </div>
                          
                          {submission.feedback && (
                            <div className="mt-4 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-slate-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-slate-700 mb-1">Feedback</p>
                                  <p className="text-sm text-slate-600">{submission.feedback}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-12 text-center">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-lg mb-2">No submissions to grade</p>
                      <p className="text-slate-400 text-sm">Students haven&apos;t submitted their work yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Student view */
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                  <CardTitle className="text-xl font-light text-slate-900 flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Star className="h-4 w-4 text-blue-600" />
                    </div>
                    Your Grade & Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {userSubmission ? (
                    <div className="space-y-6">
                      {userSubmission.grade ? (
                        <div className="text-center p-8 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-100">
                          <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-light text-slate-900 mb-2">Your Grade</h3>
                          <p className="text-4xl font-light text-emerald-600 mb-2">{userSubmission.grade}%</p>
                          <p className="text-sm text-emerald-600">Assignment completed</p>
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-100">
                          <div className="h-16 w-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-xl font-medium text-slate-900 mb-2">Under Review</h3>
                          <p className="text-slate-600">Your submission is being reviewed</p>
                        </div>
                      )}
                      
                      {userSubmission.feedback && (
                        <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900 mb-2">Instructor Feedback</h4>
                              <p className="text-slate-600 leading-relaxed">{userSubmission.feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-lg mb-2">No submission found</p>
                      <p className="text-slate-400 text-sm">Submit your work to see grades and feedback</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // Student view
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Assignment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">{assignment.description}</p>
              </div>
              {assignment.instructions && (
                <div>
                  <h3 className="font-medium mb-2">Instructions</h3>
                  <p className="text-muted-foreground">{assignment.instructions}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Due Date</h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(assignment.dueDate)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Points</h3>
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span>{assignment.points} points</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student submission section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Your Submission</span>
              </CardTitle>
              <CardDescription>
                {isOverdue 
                  ? 'This assignment is overdue and no longer accepts submissions'
                  : submission?.status === 'graded' 
                  ? 'Your assignment has been graded'
                  : submission?.status === 'submitted' 
                  ? 'You have submitted this assignment'
                  : 'Submit your assignment before the due date'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isOverdue && !submission ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Assignment Overdue</h3>
                  <p className="text-slate-600">This assignment is past its due date and no longer accepts submissions.</p>
                  <p className="text-sm text-slate-500 mt-2">Due date was: {formatDate(assignment.dueDate)}</p>
                </div>
              ) : (submission?.status === 'submitted' || submission?.status === 'graded') && !isEditingSubmission ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {submission?.status === 'graded' ? (
                        <Star className="h-5 w-5 text-blue-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {submission?.status === 'graded' ? 'Assignment Graded' : 'Assignment Submitted'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {formatDate(submission.submittedAt)}
                          {submission?.status === 'graded' && submission.grade?.gradedAt && (
                            <span> • Graded on {formatDate(submission.grade.gradedAt)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {submission?.status === 'graded' ? (
                        <>
                          <div className="text-right mr-2">
                            <div className="text-lg font-bold text-blue-600">
                              {submission.grade?.score}/{assignment.points}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round((submission.grade?.score / assignment.points) * 100)}%
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Graded
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="bg-green-50">
                          Submitted
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Display feedback for graded submissions */}
                  {submission?.status === 'graded' && submission.grade?.feedback && (
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 mb-2">Instructor Feedback</h4>
                          <p className="text-slate-700 leading-relaxed">{submission.grade.feedback}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Display submitted text content */}
                  {submission.content?.text && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Submitted Text</h4>
                      <div className="p-4 border rounded-lg bg-slate-50">
                        <p className="text-sm whitespace-pre-wrap">{submission.content.text}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Display submitted links */}
                  {submission.content?.links && submission.content.links.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Submitted Links</h4>
                      {submission.content.links.map((link, index) => (
                        <div key={link.id || `link-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{link.title || 'Link'}</span>
                              <p className="text-xs text-muted-foreground">{link.url}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              Open
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Display submitted files */}
                  {submission.content?.files && submission.content.files.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Submitted Files</h4>
                      {submission.content.files.map((file, index) => (
                        <div key={file.id || `file-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{file.name}</span>
                              <p className="text-xs text-muted-foreground">{file.size ? formatFileSize(file.size) : ''}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/*/!* Edit button for submitted (but not graded) assignments *!/*/}
                  {/*{submission?.status === 'submitted' && !isOverdue && (*/}
                  {/*  <div className="pt-4 border-t">*/}
                  {/*    <Button */}
                  {/*      variant="outline" */}
                  {/*      onClick={handleEditSubmission}*/}
                  {/*      className="w-full"*/}
                  {/*    >*/}
                  {/*      <Edit className="h-4 w-4 mr-2" />*/}
                  {/*      Edit Submission*/}
                  {/*    </Button>*/}
                  {/*  </div>*/}
                  {/*)}*/}
                </div>
              ) : !isOverdue ? (
                <div className="space-y-6">
                  {/* Single Unified Submission Interface */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                          {isEditingSubmission ? 'Edit Your Submission' : 'Submit Your Assignment'}
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                          {isEditingSubmission 
                            ? 'Update your assignment submission with new content' 
                            : 'Add text, links, and upload files for your submission'
                          }
                        </p>
                      </div>
                      {isEditingSubmission && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          Cancel Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Text Submission */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Assignment Text</label>
                      <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Enter your assignment text here..."
                        className="w-full min-h-[200px] p-3 border border-input rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    
                    {/* Links section */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Links (optional)</label>
                      {submissionLinks.map((link, index) => (
                        <div key={`form-link-${index}`} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Link title"
                            value={link.title}
                            onChange={(e) => {
                              const newLinks = [...submissionLinks];
                              newLinks[index].title = e.target.value;
                              setSubmissionLinks(newLinks);
                            }}
                            className="flex-1 p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...submissionLinks];
                              newLinks[index].url = e.target.value;
                              setSubmissionLinks(newLinks);
                            }}
                            className="flex-1 p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newLinks = submissionLinks.filter((_, i) => i !== index);
                              setSubmissionLinks(newLinks);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSubmissionLinks([...submissionLinks, { title: '', url: '' }])}
                      >
                        Add Link
                      </Button>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-4">
                    <div 
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Upload your files</p>
                        <p className="text-muted-foreground">
                          Drag and drop files here, or click to browse
                        </p>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                          multiple
                          accept={assignment?.allowedFileTypes?.map(type => `.${type}`).join(',')}
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Choose Files
                        </Button>
                      </div>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Selected Files</h4>
                        {selectedFiles.map((file, index) => (
                          <div key={`selected-file-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const newFiles = selectedFiles.filter((_, i) => i !== index);
                                setSelectedFiles(newFiles);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Due: {formatDate(assignment.dueDate)}
                      {getTimeRemaining(assignment.dueDate) && (
                        <span className="ml-2 text-orange-600">
                          ({getTimeRemaining(assignment.dueDate)})
                        </span>
                      )}
                    </div>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitting || (!hasSubmissionContent())}
                    >
                      {submitting 
                        ? (isEditingSubmission ? 'Updating...' : 'Submitting...') 
                        : (isEditingSubmission ? 'Update Assignment' : 'Submit Assignment')
                      }
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}

// Helper functions
function getStatusVariant(status) {
  switch (status) {
    case 'submitted':
      return 'default';
    case 'graded':
      return 'secondary';
    case 'late':
      return 'destructive';
    case 'draft':
      return 'outline';
    default:
      return 'outline';
  }
}

function getAssignmentStatusVariant(status) {
  switch (status) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'closed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getSubmissionStatusVariant(status) {
  switch (status) {
    case 'submitted':
      return 'default';
    case 'graded':
      return 'secondary';
    case 'late':
      return 'destructive';
    case 'draft':
      return 'outline';
    default:
      return 'outline';
  }
}

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getTimeRemaining(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  
  if (diff <= 0) {
    return 'Overdue';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  } else {
    return 'Due soon';
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}