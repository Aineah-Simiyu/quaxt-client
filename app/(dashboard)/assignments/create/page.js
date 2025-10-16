'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { assignmentService, cohortService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash, FileText, Calendar, Target, Users } from 'lucide-react';
import { ROLES, isInstructorOrAdmin } from '@/lib/constants';

// Form validation schema
const assignmentSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  instructions: z.string().min(10, { message: 'Instructions must be at least 10 characters' }),
  dueDate: z.string().min(1, { message: 'Due date is required' }),
  points: z.coerce.number().min(1, { message: 'Points must be at least 1' }).max(100, { message: 'Points cannot exceed 100' }),
  course: z.string().min(1, { message: 'Course is required' }),
  cohorts: z.array(z.string()).min(1, { message: 'At least one cohort must be selected' }),
});

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([{ name: '', url: '' }]);
  const [cohorts, setCohorts] = useState([]);
  const [loadingCohorts, setLoadingCohorts] = useState(true);
  const qc = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      dueDate: '',
      points: 100,
      course: '',
      cohorts: [],
    },
  });

  // Check access
  useEffect(() => {
    if (user && !isInstructorOrAdmin(user)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch cohorts via React Query (role-based)
  const cohortsQuery = useQuery({
    queryKey: ['assignment-create', 'cohorts', user?._id, user?.role, user?.school],
    enabled: !!user,
    queryFn: async () => {
      if (user?.role === ROLES.SCHOOL_ADMIN && user?.school) {
        return await cohortService.getCohortsBySchool(user.school);
      }
      if (user?._id) {
        return await cohortService.getCohortsByTrainer(user._id);
      }
      return { data: [] };
    },
  });

  useEffect(() => {
    const resp = cohortsQuery.data;
    const list = resp?.data || resp || [];
    if (Array.isArray(list)) {
      setCohorts(list);
      // Pre-select all cohorts
      const cohortIds = list.map((c) => c._id || c.id).filter(Boolean);
      form.setValue('cohorts', cohortIds);
    }
    setLoadingCohorts(cohortsQuery.isLoading);
  }, [cohortsQuery.data, cohortsQuery.isLoading, form]);

  const createMutation = useMutation({
    mutationFn: (payload) => assignmentService.createAssignment(payload),
    onSuccess: () => {
      toast({ title: 'Project created', description: 'Your project has been created successfully.' });
      qc.invalidateQueries({ queryKey: ['assignments'] });
      router.push('/assignments');
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Failed to create project';
      toast({ title: 'Creation failed', description: message, variant: 'destructive' });
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
        cohorts: data.cohorts,
      };
      await createMutation.mutateAsync(payload);
    } catch (e) {
      // handled by mutation onError
    }
  };

  // Early return if user doesn't have permission
  if (user && !isInstructorOrAdmin(user)) {
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

  // Handle cohort selection
  const toggleCohort = (cohortId) => {
    const currentCohorts = form.getValues('cohorts');
    const updatedCohorts = currentCohorts.includes(cohortId)
      ? currentCohorts.filter(id => id !== cohortId)
      : [...currentCohorts, cohortId];
    form.setValue('cohorts', updatedCohorts);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/assignments')} 
            className="bg-white border-slate-200 hover:bg-slate-50 h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">
              New Project
            </h1>
            <p className="text-slate-600 mt-1 font-normal">
              Create a new project with deliverables and timeline
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Details & Resources */}
            <div className="lg:col-span-1 space-y-6">
              {/* Project Details */}
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-slate-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Project Details</CardTitle>
                  </div>
                  <CardDescription className="text-slate-600">
                    Basic project information and parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-slate-900">Project Title</Label>
                    <Input
                      id="title"
                      {...form.register('title')}
                      placeholder="Enter project title"
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
                      placeholder="Course or project category"
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

              {/* Cohort Selection */}
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-slate-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Cohorts</CardTitle>
                  </div>
                  <CardDescription className="text-slate-600">
                    Select which cohorts can access this assignment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingCohorts ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
                    </div>
                  ) : cohorts.length === 0 ? (
                    <div className="text-center py-4 text-slate-500">
                      No cohorts found. You need to be assigned to cohorts to create assignments.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cohorts.map((cohort) => {
                        const isSelected = form.watch('cohorts').includes(cohort._id);
                        return (
                          <div key={cohort._id} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`cohort-${cohort._id}`}
                              checked={isSelected}
                              onChange={() => toggleCohort(cohort._id)}
                              className="h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500"
                            />
                            <label
                              htmlFor={`cohort-${cohort._id}`}
                              className="flex-1 text-sm font-medium text-slate-900 cursor-pointer"
                            >
                              {cohort.name}
                              {cohort.description && (
                                <span className="block text-xs text-slate-500 mt-1">
                                  {cohort.description}
                                </span>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {form.formState.errors.cohorts && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.cohorts.message}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Resources */}
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Target className="h-4 w-4 text-slate-600" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-slate-900">Resources</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-slate-600">
                    Add reference materials and helpful links
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resources.map((resource, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">Resource {index + 1}</span>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeResource(index)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`resource-name-${index}`} className="text-xs font-medium text-slate-700">Name</Label>
                        <Input
                          id={`resource-name-${index}`}
                          value={resource.name}
                          onChange={(e) => updateResource(index, 'name', e.target.value)}
                          placeholder="Resource name"
                          className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`resource-url-${index}`} className="text-xs font-medium text-slate-700">URL</Label>
                        <Input
                          id={`resource-url-${index}`}
                          value={resource.url}
                          onChange={(e) => updateResource(index, 'url', e.target.value)}
                          placeholder="https://example.com"
                          className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white text-sm"
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addResource}
                    className="w-full border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-2">
              <Card className="h-full bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-slate-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Project Content</CardTitle>
                  </div>
                  <CardDescription className="text-slate-600">
                    Detailed project description and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-slate-900">Project Overview</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      placeholder="Provide a comprehensive overview of the project objectives and expected outcomes"
                      className="min-h-32 border-slate-200 focus:border-slate-400 focus:ring-0 bg-white resize-none"
                    />
                    {form.formState.errors.description && (
                      <p className="text-xs text-red-600">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions" className="text-sm font-medium text-slate-900">Detailed Requirements</Label>
                    <Textarea
                      id="instructions"
                      {...form.register('instructions')}
                      placeholder="Provide step-by-step instructions, deliverable specifications, and evaluation criteria"
                      className="min-h-80 border-slate-200 focus:border-slate-400 focus:ring-0 bg-white resize-none"
                    />
                    {form.formState.errors.instructions && (
                      <p className="text-xs text-red-600">
                        {form.formState.errors.instructions.message}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/assignments')}
                    className="border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 disabled:opacity-50"
                  >
                    {loading ? 'Creating Project...' : 'Create Project'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Projects will be automatically distributed to enrolled participants upon creation
          </p>
        </div>
      </div>
    </div>
  );
}