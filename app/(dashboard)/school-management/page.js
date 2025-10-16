'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Mail, UserPlus, Users, School, Trash, Edit, Send } from 'lucide-react';
import { ROLES, isAdmin } from '@/lib/constants';
import { withAuth } from '@/middleware/withAuth';
import { userService, cohortService, authService } from '@/lib/api';

function SchoolManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('school');
  const [loading, setLoading] = useState(false);
  
  // School state
  const [schoolName, setSchoolName] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schools, setSchools] = useState([]);
  
  // Trainer state
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainers, setTrainers] = useState([]);
  
  // Cohort state
  const [cohortName, setCohortName] = useState('');
  const [cohortDescription, setCohortDescription] = useState('');
  const [cohortStartDate, setCohortStartDate] = useState('');
  const [cohortEndDate, setCohortEndDate] = useState('');
  const [cohorts, setCohorts] = useState([]);
  
  // Student invitation state
  const [invitationEmails, setInvitationEmails] = useState('');
  const [selectedCohort, setSelectedCohort] = useState('');
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);

  // Data queries
  const trainersQuery = useQuery({
    queryKey: ['school-management', 'trainers', user?.school],
    enabled: !!user,
    queryFn: async () => {
      // Platform admin: fetch all trainers; school admin: trainers by school
      if (user?.role === ROLES.ADMIN) {
        return await userService.getUsers({ role: 'trainer' });
      }
      if (user?.school) {
        return await userService.getUsersBySchoolAndRole(user.school, 'trainer');
      }
      return { data: [] };
    },
  });

  const cohortsQuery = useQuery({
    queryKey: ['school-management', 'cohorts', user?.school],
    enabled: !!user,
    queryFn: async () => {
      if (user?.role === ROLES.ADMIN) return await cohortService.getCohorts();
      if (user?.school) return await cohortService.getCohortsBySchool(user.school);
      return { data: [] };
    },
  });

  useEffect(() => {
    const t = trainersQuery.data;
    const list = t?.data || t || [];
    if (Array.isArray(list)) setTrainers(list);
  }, [trainersQuery.data]);

  useEffect(() => {
    const c = cohortsQuery.data;
    const list = c?.data || c || [];
    if (Array.isArray(list)) setCohorts(list);
  }, [cohortsQuery.data]);
  
  // Check if user is admin
  useEffect(() => {
    if (user && !isAdmin(user)) {
      router.push('/dashboard');
    }
  }, [user, router]);
  
  // Handle school registration
  const registerSchoolMutation = useMutation({
    mutationFn: (payload) => authService.registerSchool(payload),
    onSuccess: (data) => {
      const school = data?.school || data;
      const newSchool = school || {
        id: Math.random().toString(36).slice(2),
        name: schoolName,
        email: schoolEmail,
        phone: schoolPhone,
        address: schoolAddress,
      };
      setSchools((prev) => [...prev, newSchool]);
      toast({ title: 'School registered', description: `${newSchool.name} has been successfully registered` });
      setSchoolName('');
      setSchoolEmail('');
      setSchoolPhone('');
      setSchoolAddress('');
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || 'Failed to register school';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
    onSettled: () => setLoading(false),
  });

  const handleSchoolRegistration = () => {
    if (!schoolName || !schoolEmail) {
      toast({
        title: 'Missing information',
        description: 'Please provide school name and email',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    registerSchoolMutation.mutate({
      name: schoolName,
      email: schoolEmail,
      phone: schoolPhone,
      address: schoolAddress,
    });
  };
  
  // Handle trainer addition
  const createTrainerMutation = useMutation({
    mutationFn: (payload) => userService.createTrainer(payload),
    onSuccess: () => {
      toast({ title: 'Trainer invited', description: 'Invitation sent successfully' });
      qc.invalidateQueries({ queryKey: ['school-management', 'trainers'] });
      setTrainerName('');
      setTrainerEmail('');
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || 'Failed to invite trainer';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
    onSettled: () => setLoading(false),
  });

  const handleAddTrainer = () => {
    if (!trainerName || !trainerEmail) {
      toast({
        title: 'Missing information',
        description: 'Please provide trainer name and email',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    createTrainerMutation.mutate({
      name: trainerName,
      email: trainerEmail,
      ...(user?.school ? { school: user.school } : {}),
      role: 'trainer',
    });
  };
  
  // Handle cohort creation
  const createCohortMutation = useMutation({
    mutationFn: (payload) => cohortService.createCohort(payload),
    onSuccess: () => {
      toast({ title: 'Cohort created', description: 'Cohort has been successfully created' });
      qc.invalidateQueries({ queryKey: ['school-management', 'cohorts'] });
      setCohortName('');
      setCohortDescription('');
      setCohortStartDate('');
      setCohortEndDate('');
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || 'Failed to create cohort';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
    onSettled: () => setLoading(false),
  });

  const handleCreateCohort = () => {
    if (!cohortName || !cohortStartDate || !cohortEndDate) {
      toast({
        title: 'Missing information',
        description: 'Please provide cohort name, start date, and end date',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    createCohortMutation.mutate({
      name: cohortName,
      description: cohortDescription,
      startDate: cohortStartDate,
      endDate: cohortEndDate,
      ...(user?.school ? { school: user.school } : {}),
    });
  };
  
  // Handle student invitation
  const inviteStudentsMutation = useMutation({
    mutationFn: ({ cohortId, emails }) => cohortService.inviteStudentsToCohort(cohortId, emails),
    onSuccess: (data, variables) => {
      toast({
        title: 'Invitations sent',
        description: `${variables.emails.length} invitation(s) sent to students`,
      });
      setInvitationEmails('');
      setSelectedCohort('');
      setInvitationDialogOpen(false);
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || 'Failed to send invitations';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
    onSettled: () => setLoading(false),
  });

  const handleInviteStudents = () => {
    if (!invitationEmails || !selectedCohort) {
      toast({
        title: 'Missing information',
        description: 'Please provide student emails and select a cohort',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    const emails = invitationEmails.split(',').map(email => email.trim()).filter(Boolean);
    inviteStudentsMutation.mutate({ cohortId: selectedCohort, emails });
  };

  const selectedCohortName = cohorts.find((c) => String(c._id || c.id) === String(selectedCohort))?.name || '';
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">School Management</h2>
      
      <Tabs defaultValue="school" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="school">
            <School className="mr-2 h-4 w-4" />
            Schools
          </TabsTrigger>
          <TabsTrigger value="trainers">
            <UserPlus className="mr-2 h-4 w-4" />
            Trainers
          </TabsTrigger>
          <TabsTrigger value="cohorts">
            <Users className="mr-2 h-4 w-4" />
            Cohorts
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="mr-2 h-4 w-4" />
            Student Invitations
          </TabsTrigger>
        </TabsList>
        
        {/* Schools Tab */}
        <TabsContent value="school" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Register New School</CardTitle>
              <CardDescription>
                Add a new school to the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input 
                    id="schoolName" 
                    value={schoolName} 
                    onChange={(e) => setSchoolName(e.target.value)} 
                    placeholder="Enter school name" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">Email</Label>
                  <Input 
                    id="schoolEmail" 
                    type="email" 
                    value={schoolEmail} 
                    onChange={(e) => setSchoolEmail(e.target.value)} 
                    placeholder="Enter school email" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolPhone">Phone</Label>
                  <Input 
                    id="schoolPhone" 
                    value={schoolPhone} 
                    onChange={(e) => setSchoolPhone(e.target.value)} 
                    placeholder="Enter phone number" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">Address</Label>
                  <Input 
                    id="schoolAddress" 
                    value={schoolAddress} 
                    onChange={(e) => setSchoolAddress(e.target.value)} 
                    placeholder="Enter school address" 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSchoolRegistration} disabled={loading}>
                {loading ? 'Registering...' : 'Register School'}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Registered Schools</CardTitle>
              <CardDescription>
                Manage all registered schools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>{school.email}</TableCell>
                      <TableCell>{school.phone}</TableCell>
                      <TableCell>{school.address}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Trainers Tab */}
        <TabsContent value="trainers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Trainer</CardTitle>
              <CardDescription>
                Invite trainers to join the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trainerName">Trainer Name</Label>
                  <Input 
                    id="trainerName" 
                    value={trainerName} 
                    onChange={(e) => setTrainerName(e.target.value)} 
                    placeholder="Enter trainer name" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trainerEmail">Email</Label>
                  <Input 
                    id="trainerEmail" 
                    type="email" 
                    value={trainerEmail} 
                    onChange={(e) => setTrainerEmail(e.target.value)} 
                    placeholder="Enter trainer email" 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddTrainer} disabled={loading}>
                {loading ? 'Inviting...' : 'Invite Trainer'}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Trainers</CardTitle>
              <CardDescription>
                Manage all trainers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainers.map((trainer) => (
                    <TableRow key={trainer.id}>
                      <TableCell className="font-medium">{trainer.name}</TableCell>
                      <TableCell>{trainer.email}</TableCell>
                      <TableCell>{trainer.school}</TableCell>
                      <TableCell>{trainer.status}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Cohorts Tab */}
        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Cohort</CardTitle>
              <CardDescription>
                Create a new cohort for your school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cohortName">Cohort Name</Label>
                  <Input 
                    id="cohortName" 
                    value={cohortName} 
                    onChange={(e) => setCohortName(e.target.value)} 
                    placeholder="Enter cohort name" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cohortDescription">Description</Label>
                  <Input 
                    id="cohortDescription" 
                    value={cohortDescription} 
                    onChange={(e) => setCohortDescription(e.target.value)} 
                    placeholder="Enter cohort description" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cohortStartDate">Start Date</Label>
                  <Input 
                    id="cohortStartDate" 
                    type="date" 
                    value={cohortStartDate} 
                    onChange={(e) => setCohortStartDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cohortEndDate">End Date</Label>
                  <Input 
                    id="cohortEndDate" 
                    type="date" 
                    value={cohortEndDate} 
                    onChange={(e) => setCohortEndDate(e.target.value)} 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreateCohort} disabled={loading}>
                {loading ? 'Creating...' : 'Create Cohort'}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cohorts</CardTitle>
              <CardDescription>
                Manage all cohorts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohorts.map((cohort) => (
                    <TableRow key={cohort.id}>
                      <TableCell className="font-medium">{cohort.name}</TableCell>
                      <TableCell>{cohort.description}</TableCell>
                      <TableCell>{cohort.startDate}</TableCell>
                      <TableCell>{cohort.endDate}</TableCell>
                      <TableCell>{cohort.school}</TableCell>
                      <TableCell>{cohort.students}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon" onClick={() => {
                            setSelectedCohort(cohort.name);
                            setInvitationDialogOpen(true);
                          }}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Student Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite Students</CardTitle>
              <CardDescription>
                Send invitation links to students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="selectedCohort">Select Cohort</Label>
                <select 
                  id="selectedCohort"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedCohort}
                  onChange={(e) => setSelectedCohort(e.target.value)}
                >
                  <option value="">Select a cohort</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort._id || cohort.id} value={cohort._id || cohort.id}>{cohort.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invitationEmails">Student Emails</Label>
                <Input 
                  id="invitationEmails" 
                  value={invitationEmails} 
                  onChange={(e) => setInvitationEmails(e.target.value)} 
                  placeholder="Enter student emails (comma separated)" 
                />
                <p className="text-xs text-muted-foreground">
                  Enter multiple emails separated by commas
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleInviteStudents} disabled={loading}>
                {loading ? 'Sending...' : 'Send Invitations'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Student Invitation Dialog */}
      <Dialog open={invitationDialogOpen} onOpenChange={setInvitationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Students to {selectedCohortName}</DialogTitle>
            <DialogDescription>
              Enter the email addresses of students you want to invite to this cohort.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialogInvitationEmails">Student Emails</Label>
              <Input 
                id="dialogInvitationEmails" 
                value={invitationEmails} 
                onChange={(e) => setInvitationEmails(e.target.value)} 
                placeholder="Enter student emails (comma separated)" 
              />
              <p className="text-xs text-muted-foreground">
                Enter multiple emails separated by commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvitationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteStudents} disabled={loading}>
              {loading ? 'Sending...' : 'Send Invitations'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export with role-based protection - only ADMIN can access
export default withAuth(SchoolManagementPage, { roles: [ROLES.ADMIN] });