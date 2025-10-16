'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { assignmentService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Download, FileText, ExternalLink, MessageCircle, CheckCircle, AlertCircle, GraduationCap, Users, Clock, Edit3, Save, Calendar } from 'lucide-react';

export default function SubmissionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Queries
  const assignmentQuery = useQuery({
    queryKey: ['assignment', params.id],
    enabled: !!params.id,
    queryFn: () => assignmentService.getAssignment(params.id),
  });

  const submissionsQuery = useQuery({
    queryKey: ['assignment', params.id, 'submissions'],
    enabled: !!params.id,
    queryFn: () => assignmentService.getSubmissions(params.id),
  });

  // Sync into local state for minimal UI changes
  useEffect(() => {
    if (assignmentQuery.data) setAssignment(assignmentQuery.data);
  }, [assignmentQuery.data]);

  useEffect(() => {
    if (submissionsQuery.data) {
      const list = submissionsQuery.data || [];
      setSubmissions(list);
      if (!selectedSubmission && list.length > 0) {
        const first = list[0];
        setSelectedSubmission(first);
        setGrade(first.grade?.score || '');
        setFeedback(first.grade?.feedback || '');
        setIsEditMode(first.status !== 'graded');
      }
    }
  }, [submissionsQuery.data, selectedSubmission]);

  useEffect(() => {
    setLoading(assignmentQuery.isLoading || submissionsQuery.isLoading);
  }, [assignmentQuery.isLoading, submissionsQuery.isLoading]);

  const handleSubmissionSelect = (submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade?.score || '');
    setFeedback(submission.grade?.feedback || '');
    setIsEditMode(submission.status !== 'graded');
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission) return;
    
    try {
      setGrading(true);
      await gradeMutation.mutateAsync({
        submissionId: selectedSubmission._id,
        score: parseFloat(grade),
        feedback,
      });
      setIsEditMode(false);
    } finally {
      setGrading(false);
    }
  };

  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, score, feedback }) =>
      assignmentService.gradeSubmission(submissionId, { score, feedback }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Review submitted successfully',
      });
      qc.invalidateQueries({ queryKey: ['assignment', params.id, 'submissions'] });
      qc.invalidateQueries({ queryKey: ['assignment', params.id] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to submit review', variant: 'destructive' });
    },
  });

  const downloadFile = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const TimelineComponent = ({ history }) => {
    if (!history || history.length === 0) {
      return (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No timeline data available</p>
        </div>
      );
    }

    const formatDateTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const getActionIcon = (action) => {
      switch (action) {
        case 'created':
          return <FileText className="h-5 w-5 text-muted-foreground" />;
        case 'submitted':
          return <CheckCircle className="h-5 w-5 text-muted-foreground" />;
        case 'graded':
          return <GraduationCap className="h-5 w-5 text-muted-foreground" />;
        default:
          return <Clock className="h-5 w-5 text-muted-foreground" />;
      }
    };

    const getActionColor = (action) => {
      switch (action) {
        case 'created':
          return 'border-blue-500 bg-blue-50';
        case 'submitted':
          return 'border-yellow-500 bg-yellow-50';
        case 'graded':
          return 'border-green-500 bg-green-50';
        default:
          return 'border-gray-500 bg-gray-50';
      }
    };

    const getActionDescription = (action) => {
      switch (action) {
        case 'created':
          return 'Assignment was created and assigned to student';
        case 'submitted':
          return 'Student submitted their work for review';
        case 'graded':
          return 'Trainer completed the review and grading';
        default:
          return 'Action performed on submission';
      }
    };

    return (
      <div className="relative ml-4">
        {/* Timeline line */}
        <div className="absolute left-0 top-6 bottom-0 border-l-2 border-slate-200" />
        
        {history.map((item, index) => (
          <div key={item._id} className="relative pl-10 pb-8 last:pb-0">
            {/* Timeline dot */}
            <div className={`absolute h-4 w-4 -translate-x-1/2 left-px top-5 rounded-full border-2 border-primary bg-background ${getActionColor(item.action)}`} />
            
            {/* Content */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getActionColor(item.action)}`}>
                  {getActionIcon(item.action)}
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-medium capitalize text-slate-800">
                    {item.action}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {getActionDescription(item.action)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 ml-14">
                <Calendar className="h-4 w-4" />
                <span>{formatDateTime(item.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div  >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-light text-slate-900">
                  {assignment?.title || 'Assignment'}
                </h1>
                <p className="text-sm text-slate-600">
                  {(submissions || []).length} submission{(submissions || []).length !== 1 ? 's' : ''} to review
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-slate-600">
              <GraduationCap className="h-3 w-3 mr-1" />
              Trainer Review
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Left Sidebar - Timeline */}
          <div className="lg:col-span-2">
            {selectedSubmission && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-medium text-slate-900">
                    Submission Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TimelineComponent history={selectedSubmission.history} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {selectedSubmission ? (
              <div className="space-y-6">
                {/* Student Information */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-medium text-slate-900 mb-4">
                      Student Information
                    </CardTitle>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedSubmission.student?.avatar} />
                          <AvatarFallback className="bg-slate-100 text-slate-700 font-medium text-lg">
                             {selectedSubmission.student?.firstName?.[0] || 'S'}{selectedSubmission.student?.lastName?.[0] || 'T'}
                           </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h2 className="text-xl font-medium text-slate-900">
                               {selectedSubmission.student?.firstName || 'Student'} {selectedSubmission.student?.lastName || 'Name'}
                             </h2>
                            {selectedSubmission.student?.email && (
                              <p className="text-sm text-slate-600 mt-1">
                                {selectedSubmission.student.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
                          Status
                        </Label>
                        <Badge
                          variant={selectedSubmission.status === 'graded' ? 'default' : 'secondary'}
                          className="text-sm px-3 py-1"
                        >
                          {selectedSubmission.status === 'graded' ? (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <Clock className="h-4 w-4 mr-2" />
                          )}
                          {selectedSubmission.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Student ID
                            </Label>
                            <p className="text-slate-900 mt-1">
                              {selectedSubmission.student?.studentId || selectedSubmission.student?._id?.slice(-8) || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Cohort
                            </Label>
                            <p className="text-slate-900 mt-1">
                               {selectedSubmission.student?.cohorts?.[0]?.name || 'Not assigned'}
                             </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Submitted
                            </Label>
                            <p className="text-slate-900 mt-1">
                              {formatDate(selectedSubmission.submittedAt)}
                            </p>
                          </div>
                        </div>
                        {selectedSubmission.student?.cohorts?.[0]?.status && (
                          <div>
                            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Cohort Status
                            </Label>
                            <p className="text-slate-900 mt-1 capitalize">
                              {selectedSubmission.student.cohorts[0].status}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Rest of the code remains the same... */}
                {/* Submission Content */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-slate-900">
                      Submission Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Text Content */}
                    {selectedSubmission.content?.text && (
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">
                          Text Submission
                        </Label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {selectedSubmission.content.text}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Files */}
                    {selectedSubmission.content?.files && selectedSubmission.content.files.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">
                          Uploaded Files
                        </Label>
                        <div className="space-y-2">
                          {selectedSubmission.content.files.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">
                                  {file.name}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(file.url, file.name)}
                                className="text-slate-600 hover:text-slate-900"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    {selectedSubmission.content?.links && selectedSubmission.content.links.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">
                          Submitted Links
                        </Label>
                        <div className="space-y-2">
                          {selectedSubmission.content.links.map((link, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <ExternalLink className="h-5 w-5 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700 truncate">
                                  {link.title || link.url}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(link.url, '_blank')}
                                className="text-slate-600 hover:text-slate-900"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Open
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Review Form */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium text-slate-900">
                        <MessageCircle className="h-5 w-5 mr-2 inline" />
                        {selectedSubmission.status === 'graded' ? 'Review Details' : 'Submit Review'}
                      </CardTitle>
                      {selectedSubmission.status === 'graded' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditToggle}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          {isEditMode ? (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Cancel Edit
                            </>
                          ) : (
                            <>
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit Feedback and Grading
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="grade" className="text-sm font-medium text-slate-700">
                          Grade (out of {assignment?.points || 100})
                        </Label>
                        <Input
                          id="grade"
                          type="number"
                          min="0"
                          max={assignment?.points || 100}
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          placeholder="Enter grade"
                          readOnly={selectedSubmission.status === 'graded' && !isEditMode}
                          className={`mt-1 ${
                            selectedSubmission.status === 'graded' && !isEditMode
                              ? 'border-green-300 bg-green-50 text-green-800'
                              : ''
                          }`}
                        />
                      </div>
                      <div className="flex items-end">
                        {isEditMode || selectedSubmission.status !== 'graded' ? (
                          <Button
                            onClick={handleSubmitReview}
                            disabled={grading || !grade}
                            className="bg-slate-900 hover:bg-slate-800 text-white w-full"
                          >
                            {grading ? 'Submitting...' : selectedSubmission.status === 'graded' ? 'Submit Changes' : 'Submit Review'}
                          </Button>
                        ) : (
                          <div className="w-full p-2 text-center text-sm text-green-700 bg-green-50 border border-green-300 rounded-md">
                            ✓ Graded
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="feedback" className="text-sm font-medium text-slate-700">
                        Feedback
                      </Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide detailed feedback for the student..."
                        rows={4}
                        readOnly={selectedSubmission.status === 'graded' && !isEditMode}
                        className={`mt-1 ${
                          selectedSubmission.status === 'graded' && !isEditMode
                            ? 'border-green-300 bg-green-50 text-green-800'
                            : ''
                        }`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      No submissions available
                    </h3>
                    <p className="text-slate-600">
                      No submissions have been made for this assignment yet
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}