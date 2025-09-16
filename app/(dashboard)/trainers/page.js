'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Mail, Plus, Edit, Users, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { ROLES, getRoleDisplayName } from '@/lib/constants';
import { withAuth } from '@/middleware/withAuth';
import { userService, cohortService } from '@/lib/api';

function TrainersPage() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: ROLES.TRAINER
  });

  const [createForm, setCreateForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  });

  const [assignForm, setAssignForm] = useState({
    cohortIds: []
  });

  // Fetch trainers with their cohorts
  const fetchTrainers = async () => {
    try {
      const response = await userService.getUsersBySchoolAndRole(user.school, ROLES.TRAINER);
      const trainersData = response.data || [];
      
      // Fetch cohorts for each trainer
      const trainersWithCohorts = await Promise.all(
        trainersData.map(async (trainer) => {
          try {
            const cohortResponse = await cohortService.getCohortsByTrainer(trainer._id);
            return { ...trainer, assignedCohorts: cohortResponse.data || [] };
          } catch (error) {
            console.error(`Error fetching cohorts for trainer ${trainer._id}:`, error);
            return { ...trainer, assignedCohorts: [] };
          }
        })
      );
      
      setTrainers(trainersWithCohorts);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      toast.error('Failed to fetch team members');
    }
  };

  // Fetch cohorts
  const fetchCohorts = async () => {
    try {
      const response = await cohortService.getCohortsBySchool(user.school);
      setCohorts(response.data || []);
    } catch (error) {
      console.error('Error fetching cohorts:', error);
      toast.error('Failed to fetch cohorts');
    }
  };

  useEffect(() => {
    if (user?.school) {
      Promise.all([fetchTrainers(), fetchCohorts()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  // Handle invite trainer
  const handleInviteTrainer = async (e) => {
    e.preventDefault();
    try {
      await userService.inviteUser({
        ...inviteForm,
        schoolId: user.school
      });
      
      toast.success('Team member invitation sent successfully');
      setIsInviteDialogOpen(false);
      setInviteForm({ email: '', firstName: '', lastName: '', role: ROLES.TRAINER });
      fetchTrainers();
    } catch (error) {
      console.error('Error inviting trainer:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  // Handle create trainer
  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    try {
      await userService.createTrainer({
        ...createForm,
        schoolId: user.school
      });
      
      toast.success('Team member created successfully');
      setIsCreateDialogOpen(false);
      setCreateForm({ email: '', firstName: '', lastName: '', password: '' });
      fetchTrainers();
    } catch (error) {
      console.error('Error creating trainer:', error);
      toast.error(error.response?.data?.message || 'Failed to create team member');
    }
  };

  // Handle assign trainer to cohorts
  const handleAssignToCohorts = async (e) => {
    e.preventDefault();
    try {
      const currentCohortIds = selectedTrainer.assignedCohorts.map(c => c._id);
      const newCohortIds = assignForm.cohortIds;
      
      // Find cohorts to add and remove
      const cohortsToAdd = newCohortIds.filter(id => !currentCohortIds.includes(id));
      const cohortsToRemove = currentCohortIds.filter(id => !newCohortIds.includes(id));
      
      // Add trainer to new cohorts
      const addPromises = cohortsToAdd.map(cohortId => 
        cohortService.addTrainerToCohort(cohortId, selectedTrainer._id)
      );
      
      // Remove trainer from old cohorts
      const removePromises = cohortsToRemove.map(cohortId => 
        cohortService.removeTrainerFromCohort(cohortId, selectedTrainer._id)
      );

      await Promise.all([...addPromises, ...removePromises]);
      toast.success('Team member assignments updated successfully');
      setIsAssignDialogOpen(false);
      setAssignForm({ cohortIds: [] });
      setSelectedTrainer(null);
      fetchTrainers(); // Refresh to show updated assignments
    } catch (error) {
      console.error('Error updating trainer assignments:', error);
      toast.error('Failed to update assignments');
    }
  };

  // Handle delete trainer
  const handleDeleteTrainer = async (trainerId) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await userService.deleteUser(trainerId);
      toast.success('Team member removed successfully');
      fetchTrainers();
    } catch (error) {
      console.error('Error deleting trainer:', error);
      toast.error(error.response?.data?.message || 'Failed to remove team member');
    }
  };

  const getStatusCounts = () => {
    return {
      total: trainers.length,
      active: trainers.filter(t => t.isActive).length,
      pending: trainers.filter(t => !t.emailVerified).length,
      assigned: trainers.filter(t => t.assignedCohorts && t.assignedCohorts.length > 0).length
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">
              Team Management
            </h1>
            <p className="text-slate-600 mt-1 font-normal">
              {statusCounts.total} team members • {statusCounts.active} active • {statusCounts.assigned} assigned
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-4 py-2 h-9">
                  <Mail className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border border-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-slate-900">Invite Team Member</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Send an invitation email to a new team member
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInviteTrainer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-slate-900">First Name</Label>
                      <Input
                        id="firstName"
                        value={inviteForm.firstName}
                        onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                        className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-slate-900">Last Name</Label>
                      <Input
                        id="lastName"
                        value={inviteForm.lastName}
                        onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                        className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-slate-900">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsInviteDialogOpen(false)}
                      className="border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-medium"
                    >
                      Send Invitation
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 text-slate-600 font-medium h-9"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border border-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-slate-900">Create Team Member</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Create a new team member account directly
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTrainer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="createFirstName" className="text-sm font-medium text-slate-900">First Name</Label>
                      <Input
                        id="createFirstName"
                        value={createForm.firstName}
                        onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                        className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="createLastName" className="text-sm font-medium text-slate-900">Last Name</Label>
                      <Input
                        id="createLastName"
                        value={createForm.lastName}
                        onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                        className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="createEmail" className="text-sm font-medium text-slate-900">Email Address</Label>
                    <Input
                      id="createEmail"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="createPassword" className="text-sm font-medium text-slate-900">Temporary Password</Label>
                    <Input
                      id="createPassword"
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-medium"
                    >
                      Create Account
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-slate-600" />
                </div>
                <span className="text-2xl font-light text-slate-900">{statusCounts.total}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Total Members</p>
                <p className="text-xs text-slate-500">All team members</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                </div>
                <span className="text-2xl font-light text-slate-900">{statusCounts.active}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Active</p>
                <p className="text-xs text-slate-500">Currently active</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                </div>
                <span className="text-2xl font-light text-slate-900">{statusCounts.pending}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Pending</p>
                <p className="text-xs text-slate-500">Awaiting verification</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Settings className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-2xl font-light text-slate-900">{statusCounts.assigned}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Assigned</p>
                <p className="text-xs text-slate-500">With cohorts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <div className="space-y-4">
          {trainers.length === 0 ? (
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <UserPlus className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No team members found</h3>
                <p className="text-slate-600 text-center mb-6 max-w-md">
                  Start building your team by inviting or creating your first team member account.
                </p>
                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={() => setIsInviteDialogOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            trainers.map((trainer) => (
              <Card key={trainer._id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-slate-600 font-medium">
                          {trainer.firstName?.[0]}{trainer.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {trainer.firstName} {trainer.lastName}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <div className={`h-2 w-2 rounded-full ${trainer.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                            <span className="text-xs text-slate-600 font-medium">
                              {trainer.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {!trainer.emailVerified && (
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">
                              Pending Verification
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm mb-3">{trainer.email}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-slate-500">
                          <span>Joined {new Date(trainer.createdAt).toLocaleDateString()}</span>
                          {trainer.invitedAt && (
                            <span>Invited {new Date(trainer.invitedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        
                        {trainer.assignedCohorts && trainer.assignedCohorts.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-slate-700 mb-2">Assigned Cohorts:</p>
                            <div className="flex flex-wrap gap-2">
                              {trainer.assignedCohorts.map((cohort) => (
                                <span 
                                  key={cohort._id} 
                                  className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                                >
                                  {cohort.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic mt-3">
                            No cohorts assigned
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTrainer(trainer);
                          setAssignForm({ cohortIds: trainer.assignedCohorts.map(c => c._id) });
                          setIsAssignDialogOpen(true);
                        }}
                        className="border-slate-200 hover:bg-slate-50 text-slate-600 font-medium h-8"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTrainer(trainer._id)}
                        className="border-red-200 hover:bg-red-50 text-red-600 font-medium h-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Assign to Cohorts Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="bg-white border border-slate-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900">Manage Assignments</DialogTitle>
              <DialogDescription className="text-slate-600">
                Assign cohorts for {selectedTrainer?.firstName} {selectedTrainer?.lastName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssignToCohorts} className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-900">Available Cohorts</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 mt-2">
                  {cohorts.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No cohorts available
                    </p>
                  ) : (
                    cohorts.map((cohort) => (
                      <label key={cohort._id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignForm.cohortIds.includes(cohort._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignForm({
                                ...assignForm,
                                cohortIds: [...assignForm.cohortIds, cohort._id]
                              });
                            } else {
                              setAssignForm({
                                ...assignForm,
                                cohortIds: assignForm.cohortIds.filter(id => id !== cohort._id)
                              });
                            }
                          }}
                          className="rounded border-slate-300"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-900">{cohort.name}</span>
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                              {cohort.status || 'Active'}
                            </span>
                          </div>
                          {cohort.description && (
                            <p className="text-xs text-slate-500 mt-1">
                              {cohort.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAssignDialogOpen(false)}
                  className="border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  Update Assignments
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-sm text-slate-600 pt-6 border-t border-slate-200">
          <div className="flex items-center space-x-6">
            <span>{trainers.length} team members</span>
            <span>Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="hover:text-slate-900 font-medium">Export List</button>
            <button className="hover:text-slate-900 font-medium">Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export with role-based protection - only ADMIN and SCHOOL_ADMIN can access
export default withAuth(TrainersPage, { roles: [ROLES.ADMIN, ROLES.SCHOOL_ADMIN] });