'use client';

import { useState, useEffect } from 'react';
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

function SchoolManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('school');
  const [loading, setLoading] = useState(false);
  
  // School state
  const [schoolName, setSchoolName] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schools, setSchools] = useState([
    { id: 1, name: 'Data Engineering Academy', email: 'info@dataacademy.edu', phone: '123-456-7890', address: '123 Data St, Analytics City' }
  ]);
  
  // Trainer state
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainers, setTrainers] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', school: 'Data Engineering Academy', status: 'Active' }
  ]);
  
  // Cohort state
  const [cohortName, setCohortName] = useState('');
  const [cohortDescription, setCohortDescription] = useState('');
  const [cohortStartDate, setCohortStartDate] = useState('');
  const [cohortEndDate, setCohortEndDate] = useState('');
  const [cohorts, setCohorts] = useState([
    { id: 1, name: 'Data Engineering 2023', description: 'Fundamentals of Data Engineering', startDate: '2023-09-01', endDate: '2023-12-15', school: 'Data Engineering Academy', students: 24 }
  ]);
  
  // Student invitation state
  const [invitationEmails, setInvitationEmails] = useState('');
  const [selectedCohort, setSelectedCohort] = useState('');
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    if (user && !isAdmin(user)) {
      router.push('/dashboard');
    }
  }, [user, router]);
  
  // Handle school registration
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
    
    // Simulate API call
    setTimeout(() => {
      const newSchool = {
        id: schools.length + 1,
        name: schoolName,
        email: schoolEmail,
        phone: schoolPhone,
        address: schoolAddress
      };
      
      setSchools([...schools, newSchool]);
      
      // Reset form
      setSchoolName('');
      setSchoolEmail('');
      setSchoolPhone('');
      setSchoolAddress('');
      
      toast({
        title: 'School registered',
        description: `${newSchool.name} has been successfully registered`,
      });
      
      setLoading(false);
    }, 1000);
  };
  
  // Handle trainer addition
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
    
    // Simulate API call
    setTimeout(() => {
      const newTrainer = {
        id: trainers.length + 1,
        name: trainerName,
        email: trainerEmail,
        school: 'Data Engineering Academy',
        status: 'Invited'
      };
      
      setTrainers([...trainers, newTrainer]);
      
      // Reset form
      setTrainerName('');
      setTrainerEmail('');
      
      toast({
        title: 'Trainer invited',
        description: `Invitation sent to ${newTrainer.email}`,
      });
      
      setLoading(false);
    }, 1000);
  };
  
  // Handle cohort creation
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
    
    // Simulate API call
    setTimeout(() => {
      const newCohort = {
        id: cohorts.length + 1,
        name: cohortName,
        description: cohortDescription,
        startDate: cohortStartDate,
        endDate: cohortEndDate,
        school: 'Data Engineering Academy',
        students: 0
      };
      
      setCohorts([...cohorts, newCohort]);
      
      // Reset form
      setCohortName('');
      setCohortDescription('');
      setCohortStartDate('');
      setCohortEndDate('');
      
      toast({
        title: 'Cohort created',
        description: `${newCohort.name} has been successfully created`,
      });
      
      setLoading(false);
    }, 1000);
  };
  
  // Handle student invitation
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
    
    // Simulate API call
    setTimeout(() => {
      const emails = invitationEmails.split(',').map(email => email.trim());
      
      toast({
        title: 'Invitations sent',
        description: `${emails.length} invitation(s) sent to students for ${selectedCohort}`,
      });
      
      // Reset form
      setInvitationEmails('');
      setSelectedCohort('');
      setInvitationDialogOpen(false);
      
      setLoading(false);
    }, 1000);
  };
  
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
                    <option key={cohort.id} value={cohort.name}>{cohort.name}</option>
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
            <DialogTitle>Invite Students to {selectedCohort}</DialogTitle>
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