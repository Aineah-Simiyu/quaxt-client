'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Edit, Users, Calendar, TrendingUp, Target } from 'lucide-react';
import { toast } from 'sonner';
import { ROLES } from '@/lib/constants';
import { withAuth } from '@/middleware/withAuth';
import { userService, cohortService } from '@/lib/api';

function CohortsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cohorts, setCohorts] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(null);

  // Form states
  const [cohortForm, setCohortForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE'
  });

  // Queries
  const cohortsQuery = useQuery({
    queryKey: ['cohorts', user?.school],
    enabled: !!user?.school,
    queryFn: () => cohortService.getCohortsBySchool(user.school),
  });

  const trainersQuery = useQuery({
    queryKey: ['users', 'school', user?.school, 'trainers'],
    enabled: !!user?.school,
    queryFn: () => userService.getUsersBySchoolAndRole(user.school, ROLES.TRAINER),
  });

  const studentsQuery = useQuery({
    queryKey: ['users', 'school', user?.school, 'students'],
    enabled: !!user?.school,
    queryFn: () => userService.getUsersBySchoolAndRole(user.school, ROLES.STUDENT),
  });

  // Sync query data into local state to minimize UI changes
  useEffect(() => {
    if (Array.isArray(cohortsQuery.data)) setCohorts(cohortsQuery.data);
    else if (cohortsQuery.data?.data) setCohorts(cohortsQuery.data.data);
  }, [cohortsQuery.data]);

  useEffect(() => {
    if (Array.isArray(trainersQuery.data)) setTrainers(trainersQuery.data);
    else if (trainersQuery.data?.data) setTrainers(trainersQuery.data.data);
  }, [trainersQuery.data]);

  useEffect(() => {
    if (Array.isArray(studentsQuery.data)) setStudents(studentsQuery.data);
    else if (studentsQuery.data?.data) setStudents(studentsQuery.data.data);
  }, [studentsQuery.data]);

  useEffect(() => {
    const l = cohortsQuery.isLoading || trainersQuery.isLoading || studentsQuery.isLoading;
    setLoading(!!l);
  }, [cohortsQuery.isLoading, trainersQuery.isLoading, studentsQuery.isLoading]);

  // Handle create cohort
  const createCohortMutation = useMutation({
    mutationFn: (payload) => cohortService.createCohort(payload),
    onSuccess: () => {
      toast.success('Cohort created successfully');
      qc.invalidateQueries({ queryKey: ['cohorts', user?.school] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create cohort');
    }
  });

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    await createCohortMutation.mutateAsync({
      ...cohortForm,
      school: user.school,
    });
    setIsCreateDialogOpen(false);
    setCohortForm({ name: '', description: '', startDate: '', endDate: '', status: 'ACTIVE' });
  };

  // Handle update cohort
  const updateCohortMutation = useMutation({
    mutationFn: ({ id, payload }) => cohortService.updateCohort(id, payload),
    onSuccess: () => {
      toast.success('Cohort updated successfully');
      qc.invalidateQueries({ queryKey: ['cohorts', user?.school] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update cohort');
    }
  });

  const handleUpdateCohort = async (e) => {
    e.preventDefault();
    await updateCohortMutation.mutateAsync({ id: selectedCohort._id, payload: cohortForm });
    setIsEditDialogOpen(false);
    setSelectedCohort(null);
    setCohortForm({ name: '', description: '', startDate: '', endDate: '', status: 'ACTIVE' });
  };

  // Handle delete cohort
  const deleteCohortMutation = useMutation({
    mutationFn: (id) => cohortService.deleteCohort(id),
    onSuccess: () => {
      toast.success('Cohort deleted successfully');
      qc.invalidateQueries({ queryKey: ['cohorts', user?.school] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete cohort');
    }
  });

  const handleDeleteCohort = async (cohortId) => {
    if (!confirm('Are you sure you want to delete this cohort?')) return;
    await deleteCohortMutation.mutateAsync(cohortId);
  };

  // Handle edit cohort
  const handleEditCohort = (cohort) => {
    setSelectedCohort(cohort);
    setCohortForm({
      name: cohort.name,
      description: cohort.description || '',
      startDate: cohort.startDate ? new Date(cohort.startDate).toISOString().split('T')[0] : '',
      endDate: cohort.endDate ? new Date(cohort.endDate).toISOString().split('T')[0] : '',
      status: cohort.isActive ? "Active" : "False"
    });
    setIsEditDialogOpen(true);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 font-medium';
      case 'INACTIVE':
        return 'bg-slate-500/20 text-slate-700 border-slate-500/30 font-medium';
      case 'COMPLETED':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30 font-medium';
      default:
        return 'bg-slate-500/20 text-slate-700 border-slate-500/30 font-medium';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-slate-800 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">
              Training Cohorts
            </h1>
            <p className="text-slate-600 mt-1 font-normal">
              {cohorts.length} active cohorts • Manage programs and track progress
            </p>
          </div>
        
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-4 py-2 h-9">
                <Plus className="mr-2 h-4 w-4" /> New Cohort
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Create Cohort</DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Set up a new training cohort
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCohort} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  value={cohortForm.name}
                  onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
                  placeholder="e.g., Full Stack Dev Q1 2025"
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={cohortForm.description}
                  onChange={(e) => setCohortForm({ ...cohortForm, description: e.target.value })}
                  placeholder="Brief description of the program"
                  className="min-h-20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={cohortForm.startDate}
                    onChange={(e) => setCohortForm({ ...cohortForm, startDate: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={cohortForm.endDate}
                    onChange={(e) => setCohortForm({ ...cohortForm, endDate: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select value={cohortForm.isActive} onValueChange={(value) => setCohortForm({ ...cohortForm, status: value })}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="h-10 px-4">
                  Cancel
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 h-10 px-4">
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

        {/* Cohorts Grid */}
        {cohorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg p-12 text-center">
            <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No cohorts found</h3>
            <p className="text-slate-600 text-sm max-w-md mb-6">
              Create your first training cohort to start organizing students and tracking progress.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-4 py-2 h-9">
              <Plus className="h-4 w-4 mr-2" />
              Create First Cohort
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {cohorts.map((cohort) => (
              <Card key={cohort._id} className="cursor-pointer transition-all duration-200 hover:shadow-md bg-white border border-slate-200 hover:border-slate-300 group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-slate-700 truncate">
                          {cohort.name}
                        </CardTitle>
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full ${
                            cohort.status === 'ACTIVE' ? 'bg-emerald-500' :
                            cohort.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-slate-400'
                          }`}></div>
                          <span className="ml-2 text-xs text-slate-600 font-medium">{cohort.status}</span>
                        </div>
                      </div>
                      {cohort.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {cohort.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCohort(cohort)}
                        className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCohort(cohort._id)}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 text-slate-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-slate-600">Trainers</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{cohort.trainers?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-medium text-slate-600">Students</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{cohort.students?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600">Start</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {cohort.startDate ? new Date(cohort.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600">End</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {cohort.endDate ? new Date(cohort.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Created {new Date(cohort.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span onClick={() => handleEditCohort(cohort)} className="font-medium">View Details →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-8 flex items-center justify-between text-sm text-slate-600 pt-6 border-t border-slate-200">
          <div className="flex items-center space-x-6">
            <span>{cohorts.length} cohorts displayed</span>
            <span>Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="hover:text-slate-900 font-medium">Export List</button>
            <button className="hover:text-slate-900 font-medium">Print View</button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Cohort</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Update cohort information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCohort} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="editName" className="text-sm font-medium">Name</Label>
              <Input
                id="editName"
                value={cohortForm.name}
                onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
                className="h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription" className="text-sm font-medium">Description</Label>
              <Textarea
                id="editDescription"
                value={cohortForm.description}
                onChange={(e) => setCohortForm({ ...cohortForm, description: e.target.value })}
                className="min-h-20 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartDate" className="text-sm font-medium">Start Date</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={cohortForm.startDate}
                  onChange={(e) => setCohortForm({ ...cohortForm, startDate: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndDate" className="text-sm font-medium">End Date</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={cohortForm.endDate}
                  onChange={(e) => setCohortForm({ ...cohortForm, endDate: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus" className="text-sm font-medium">Status</Label>
              <Select value={cohortForm.status} onValueChange={(value) => setCohortForm({ ...cohortForm, status: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="h-10 px-4">
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 h-10 px-4">
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(CohortsPage, { roles: [ROLES.ADMIN, ROLES.SCHOOL_ADMIN] });