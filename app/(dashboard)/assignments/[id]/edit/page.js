'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { assignmentService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash, FileText, Calendar, Target, Shield, GraduationCap, Settings, Edit3 } from 'lucide-react';
import { ROLES, isInstructorOrAdmin } from '@/lib/constants';

// Form validation schema
const assignmentSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  instructions: z.string().min(10, { message: 'Instructions must be at least 10 characters' }),
  dueDate: z.string().min(1, { message: 'Due date is required' }),
  points: z.coerce.number().min(1, { message: 'Points must be at least 1' }).max(100, { message: 'Points cannot exceed 100' }),
  course: z.string().min(1, { message: 'Course is required' }),
});

export default function EditAssignmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const [resources, setResources] = useState([{ name: '', url: '' }]);
  const { toast } = useToast();

  // Role-based access control
  const isStudent = user?.role === 'student';
  const isTrainer = user?.role === 'trainer';
  const isSchoolAdmin = user?.role === 'school_admin';
  const isInstructorOrAdminRole = isTrainer || isSchoolAdmin;
  
  // Get role-specific styling and configuration
  const getRoleConfig = () => {
    if (isSchoolAdmin) {
      return {
        icon: Shield,
        color: 'bg-purple-600',
        accent: 'purple',
        title: 'School Administrator',
        description: 'Full assignment management and oversight'
      };
    }
    if (isTrainer) {
      return {
        icon: GraduationCap,
        color: 'bg-blue-600',
        accent: 'blue',
        title: 'Trainer',
        description: 'Assignment creation and student guidance'
      };
    }
    return {
      icon: Settings,
      color: 'bg-slate-600',
      accent: 'slate',
      title: 'User',
      description: 'Limited access'
    };
  };
  
  const roleConfig = getRoleConfig();

  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      dueDate: '',
      points: 100,
      course: '',
    },
  });

  // Check if user is instructor or admin
  useEffect(() => {
    if (user && !isInstructorOrAdminRole) {
      router.push('/dashboard');
    }
  }, [user, router, isInstructorOrAdminRole]);

  // Fetch assignment data and populate form (React Query)
  const assignmentQuery = useQuery({
    queryKey: ['assignment', id],
    enabled: !!id && !!user && isInstructorOrAdminRole,
    queryFn: () => assignmentService.getAssignment(id),
  });

  useEffect(() => {
    const assignment = assignmentQuery.data;
    if (!assignment) return;
    const formattedDate = assignment.dueDate
      ? new Date(assignment.dueDate).toISOString().split('T')[0]
      : '';
    form.reset({
      title: assignment.title || '',
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      dueDate: formattedDate,
      points: assignment.points || 100,
      course: assignment.course || '',
    });
    if (assignment.resources && assignment.resources.length > 0) {
      setResources(assignment.resources);
    }
  }, [assignmentQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => assignmentService.updateAssignment(id, payload),
    onSuccess: () => {
      toast({ title: 'Assignment updated', description: 'Your assignment has been updated successfully.' });
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['assignment', id] });
      router.push(`/assignments/${id}`);
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Failed to update assignment';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    },
    onSettled: () => setLoading(false),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const payload = {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        dueDate: new Date(data.dueDate).toISOString(),
        points: Number(data.points),
      };
      await updateMutation.mutateAsync({ id, payload });
    } catch (e) {
      // handled in mutation onError
    }
  };

  // Early return if user doesn't have permission
  if (user && !isInstructorOrAdminRole) {
    return null;
  }

  // Handle resource fields
  const addResource = () => {
    setResources([...resources, { name: '', url: '' }]);
  };

  const removeResource = (index) => {
    const newResources = [...resources];
    newResources.splice(index, 1);
    setResources(newResources);
  };

  const updateResource = (index, field, value) => {
    const newResources = [...resources];
    newResources[index][field] = value;
    setResources(newResources);
  };

  if (assignmentQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-border"></div>
          <div className="absolute inset-1 rounded-full bg-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push(`/assignments/${id}`)} 
              className="bg-white border-slate-200 hover:bg-slate-50 h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">
                Edit Assignment
              </h1>
              <p className="text-slate-600 mt-1 font-normal">
                Update assignment details and requirements
              </p>
            </div>
          </div>
          
          {/* Role Badge */}
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 ${roleConfig.color} rounded-lg flex items-center justify-center`}>
              <roleConfig.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{roleConfig.title}</p>
              <p className="text-xs text-slate-500">{roleConfig.description}</p>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Details & Resources */}
            <div className="lg:col-span-1 space-y-6">
              {/* Assignment Details */}
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Edit3 className="h-4 w-4 text-slate-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Assignment Details</CardTitle>
                  </div>
                  <CardDescription className="text-slate-600">
                    Update the basic assignment information and parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-slate-900">Assignment Title</Label>
                    <Input
                      id="title"
                      {...form.register('title')}
                      placeholder="Enter assignment title"
                      className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white"
                    />
                    {form.formState.errors.title && (
                      <p className="text-xs text-red-600">
                        {form.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course" className="text-sm font-medium text-slate-900">Course/Category</Label>
                    <Input
                      id="course"
                      {...form.register('course')}
                      placeholder="Course or assignment category"
                      className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white"
                    />
                    {form.formState.errors.course && (
                      <p className="text-xs text-red-600">
                        {form.formState.errors.course.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dueDate" className="text-sm font-medium text-slate-900">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        {...form.register('dueDate')}
                        className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white"
                      />
                      {form.formState.errors.dueDate && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.dueDate.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="points" className="text-sm font-medium text-slate-900">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        min="1"
                        max="100"
                        {...form.register('points')}
                        className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white"
                      />
                      {form.formState.errors.points && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.points.message}
                        </p>
                      )}
                    </div>
                  </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-slate-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Resources & Materials</CardTitle>
                </div>
                <CardDescription className="text-slate-600">
                  Update helpful resources for students to complete the assignment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resources.map((resource, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Resource {index + 1}</h4>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeResource(index)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`resource-name-${index}`} className="text-sm font-medium text-slate-900">Name</Label>
                      <Input
                        id={`resource-name-${index}`}
                        value={resource.name}
                        onChange={(e) => updateResource(index, 'name', e.target.value)}
                        placeholder="Resource name"
                        className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`resource-url-${index}`} className="text-sm font-medium text-slate-900">URL</Label>
                      <Input
                        id={`resource-url-${index}`}
                        value={resource.url}
                        onChange={(e) => updateResource(index, 'url', e.target.value)}
                        placeholder="https://example.com"
                        className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addResource}
                  className="mt-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white border border-slate-200 shadow-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-slate-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Content</CardTitle>
                </div>
                <CardDescription className="text-slate-600">
                  Update detailed information about the assignment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-slate-900">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Provide detailed instructions and requirements for this assignment..."
                    className="min-h-32 border-slate-200 focus:border-slate-400 focus:ring-0 bg-white resize-none"
                  />
                  {form.formState.errors.description && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-sm font-medium text-slate-900">Instructions</Label>
                  <Textarea
                    id="instructions"
                    {...form.register('instructions')}
                    placeholder="Provide detailed instructions for completing the assignment"
                    className="min-h-64 border-slate-200 focus:border-slate-400 focus:ring-0 bg-white resize-none"
                  />
                  {form.formState.errors.instructions && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.instructions.message}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-6 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/assignments/${id}`)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {loading ? 'Updating...' : 'Update Assignment'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}