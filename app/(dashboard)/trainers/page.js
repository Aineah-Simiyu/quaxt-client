"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  UserPlus,
  Mail,
  Plus,
  Edit,
  Users,
  Settings,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Upload,
  Download,
  GraduationCap,
  BookOpen,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { ROLES, getRoleDisplayName } from "@/lib/constants";
import { withAuth } from "@/middleware/withAuth";
import { userService, cohortService } from "@/lib/api";

function TrainersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: ROLES.TRAINER,
  });

  const [createForm, setCreateForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
  });

  const [assignForm, setAssignForm] = useState({
    cohortIds: [],
  });

  // Bulk upload state
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploadCohort, setBulkUploadCohort] = useState("");
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);

  // React Query: trainers with assigned cohorts
  const trainersQuery = useQuery({
    queryKey: ["trainers", user?.school],
    enabled: !!user?.school,
    queryFn: async () => {
      const res = await userService.getUsersBySchoolAndRole(
        user.schoolId,
        ROLES.TRAINER,
      );
      const trainersData = Array.isArray(res) ? res : res?.data || [];
      const withCohorts = await Promise.all(
        trainersData.map(async (trainer) => {
          try {
            const cr = await cohortService.getCohortsByTrainer(trainer._id);
            const assigned = Array.isArray(cr) ? cr : cr?.data || [];
            return { ...trainer, assignedCohorts: assigned };
          } catch (e) {
            console.error(`Error fetching cohorts for trainer ${trainer._id}:`, e);
            return { ...trainer, assignedCohorts: [] };
          }
        }),
      );
      return withCohorts;
    },
  });

  // React Query: cohorts by school
  const cohortsQuery = useQuery({
    queryKey: ["cohorts", user?.school],
    enabled: !!user?.school,
    queryFn: async () => {
      const res = await cohortService.getCohortsBySchool(user.schoolId);
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // Handle invite trainer
  const inviteTrainerMutation = useMutation({
    mutationFn: (payload) => userService.inviteUser(payload),
    onSuccess: () => {
      toast.success("Team member invitation sent successfully");
      setIsInviteDialogOpen(false);
      setInviteForm({ email: "", firstName: "", lastName: "", role: ROLES.TRAINER });
      qc.invalidateQueries({ queryKey: ["trainers", user?.school] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to send invitation");
    },
  });

  const handleInviteTrainer = async (e) => {
    e.preventDefault();
    await inviteTrainerMutation.mutateAsync({ ...inviteForm, schoolId: user.schoolId });
  };

  // Handle create trainer
  const createTrainerMutation = useMutation({
    mutationFn: (payload) => userService.createTrainer(payload),
    onSuccess: () => {
      toast.success("Team member created successfully");
      setIsCreateDialogOpen(false);
      setCreateForm({ email: "", firstName: "", lastName: "", password: "" });
      qc.invalidateQueries({ queryKey: ["trainers", user?.school] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create team member");
    },
  });

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    await createTrainerMutation.mutateAsync({ ...createForm, schoolId: user.schoolId });
  };

  // Handle assign trainer to cohorts
  const handleAssignToCohorts = async (e) => {
    e.preventDefault();
    try {
      const currentCohortIds = selectedTrainer.assignedCohorts.map(
        (c) => c._id,
      );
      const newCohortIds = assignForm.cohortIds;

      // Find cohorts to add and remove
      const cohortsToAdd = newCohortIds.filter(
        (id) => !currentCohortIds.includes(id),
      );
      const cohortsToRemove = currentCohortIds.filter(
        (id) => !newCohortIds.includes(id),
      );

      // Add trainer to new cohorts
      const addPromises = cohortsToAdd.map((cohortId) =>
        cohortService.addTrainerToCohort(cohortId, selectedTrainer._id),
      );

      // Remove trainer from old cohorts
      const removePromises = cohortsToRemove.map((cohortId) =>
        cohortService.removeTrainerFromCohort(cohortId, selectedTrainer._id),
      );

      await Promise.all([...addPromises, ...removePromises]);
      toast.success("Team member assignments updated successfully");
      setIsAssignDialogOpen(false);
      setAssignForm({ cohortIds: [] });
      setSelectedTrainer(null);
      qc.invalidateQueries({ queryKey: ["trainers", user?.school] });
    } catch (error) {
      console.error("Error updating trainer assignments:", error);
      toast.error("Failed to update assignments");
    }
  };

  // Handle bulk upload of trainers
  const bulkUploadMutation = useMutation({
    mutationFn: ({ file, cohortId }) => userService.bulkUploadTrainers(file, cohortId),
    onSuccess: (response) => {
      const { successful, failed, total } = response.data || response || {};
      if (failed > 0) {
        toast.success(`Bulk upload completed: ${successful}/${total} trainers added successfully. ${failed} failed.`);
      } else {
        toast.success(`Successfully uploaded ${successful} trainers to the cohort!`);
      }
      setIsBulkUploadDialogOpen(false);
      setBulkUploadFile(null);
      setBulkUploadCohort("");
      qc.invalidateQueries({ queryKey: ["trainers", user?.school] });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Failed to upload trainers";
      toast.error(errorMessage);
    },
    onSettled: () => setBulkUploadLoading(false),
  });

  const handleBulkUpload = async () => {
    if (!bulkUploadFile || !bulkUploadCohort) {
      toast.error("Please select a CSV file and choose a cohort");
      return;
    }

    // Validate file type
    if (
      bulkUploadFile.type !== "text/csv" &&
      !bulkUploadFile.name.endsWith(".csv")
    ) {
      toast.error("Please upload a CSV file only");
      return;
    }

    // Validate file size (max 5MB)
    if (bulkUploadFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setBulkUploadLoading(true);
    await bulkUploadMutation.mutateAsync({ file: bulkUploadFile, cohortId: bulkUploadCohort });
  };

  // Handle file selection for bulk upload
  const handleBulkUploadFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setBulkUploadFile(file);
    }
  };

  // Handle delete trainer
  const deleteTrainerMutation = useMutation({
    mutationFn: (trainerId) => userService.deleteUser(trainerId),
    onSuccess: () => {
      toast.success("Team member removed successfully");
      qc.invalidateQueries({ queryKey: ["trainers", user?.school] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to remove team member");
    },
  });

  const handleDeleteTrainer = async (trainerId) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    await deleteTrainerMutation.mutateAsync(trainerId);
  };

  // Filter and search trainers
  const trainers = useMemo(() => trainersQuery.data ?? [], [trainersQuery.data]);
  const cohorts = useMemo(() => cohortsQuery.data ?? [], [cohortsQuery.data]);
  const loading = trainersQuery.isLoading || cohortsQuery.isLoading;

  const filteredTrainers = useMemo(() => {
    return trainers.filter((trainer) => {
      const matchesSearch =
        searchTerm === "" ||
        `${trainer.firstName} ${trainer.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        trainer.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && trainer.isActive) ||
        (statusFilter === "inactive" && !trainer.isActive) ||
        (statusFilter === "pending" && !trainer.emailVerified);

      return matchesSearch && matchesStatus;
    });
  }, [trainers, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTrainers = filteredTrainers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Stats
  const getStatusCounts = () => {
    return {
      total: trainers.length,
      active: trainers.filter((t) => t.isActive).length,
      pending: trainers.filter((t) => !t.emailVerified).length,
      assigned: trainers.filter(
        (t) => t.assignedCohorts && t.assignedCohorts.length > 0,
      ).length,
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-light text-slate-900 tracking-tight">
                    Trainer Management
                  </h1>
                  <p className="text-slate-600 mt-1 font-normal">
                    Manage trainers and instructors across your school
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Dialog
                open={isBulkUploadDialogOpen}
                onOpenChange={setIsBulkUploadDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900">
                      Bulk Upload Trainers
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                      Upload a CSV file to add multiple trainers to a cohort at
                      once
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="bulkCohort"
                        className="text-sm font-medium text-slate-700"
                      >
                        Select Cohort
                      </Label>
                      <Select
                        value={bulkUploadCohort}
                        onValueChange={setBulkUploadCohort}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose a cohort" />
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
                    <div>
                      <Label
                        htmlFor="csvFile"
                        className="text-sm font-medium text-slate-700"
                      >
                        CSV File
                      </Label>
                      <Input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={handleBulkUploadFileChange}
                        className="mt-1"
                      />
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500">
                            CSV format: email (header required)
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              const csvContent =
                                "email\njohn.doe@example.com\njane.smith@example.com";
                              const blob = new Blob([csvContent], {
                                type: "text/csv",
                              });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "trainer-template.csv";
                              a.click();
                              window.URL.revokeObjectURL(url);
                            }}
                          >
                            Download Template
                          </Button>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-800 font-medium mb-1">
                            CSV Format Example:
                          </p>
                          <code className="text-xs text-blue-700 block">
                            email
                            <br />
                            john.doe@example.com
                            <br />
                            jane.smith@example.com
                          </code>
                        </div>
                      </div>
                    </div>
                    {bulkUploadFile && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-slate-700">
                            {bulkUploadFile.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({Math.round(bulkUploadFile.size / 1024)} KB)
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsBulkUploadDialogOpen(false);
                          setBulkUploadFile(null);
                          setBulkUploadCohort("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBulkUpload}
                        disabled={bulkUploadLoading}
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        {bulkUploadLoading ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Trainers
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isInviteDialogOpen}
                onOpenChange={setIsInviteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Invite Trainer
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border border-slate-200">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-slate-900">
                      Invite Team Member
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                      Send an invitation email to a new team member
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInviteTrainer} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="firstName"
                          className="text-sm font-medium text-slate-900"
                        >
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={inviteForm.firstName}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              firstName: e.target.value,
                            })
                          }
                          className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="lastName"
                          className="text-sm font-medium text-slate-900"
                        >
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={inviteForm.lastName}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              lastName: e.target.value,
                            })
                          }
                          className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-slate-900"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) =>
                          setInviteForm({
                            ...inviteForm,
                            email: e.target.value,
                          })
                        }
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

              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Trainer
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border border-slate-200">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-slate-900">
                      Create Team Member
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                      Create a new team member account directly
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTrainer} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="createFirstName"
                          className="text-sm font-medium text-slate-900"
                        >
                          First Name
                        </Label>
                        <Input
                          id="createFirstName"
                          value={createForm.firstName}
                          onChange={(e) =>
                            setCreateForm({
                              ...createForm,
                              firstName: e.target.value,
                            })
                          }
                          className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="createLastName"
                          className="text-sm font-medium text-slate-900"
                        >
                          Last Name
                        </Label>
                        <Input
                          id="createLastName"
                          value={createForm.lastName}
                          onChange={(e) =>
                            setCreateForm({
                              ...createForm,
                              lastName: e.target.value,
                            })
                          }
                          className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="createEmail"
                        className="text-sm font-medium text-slate-900"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="createEmail"
                        type="email"
                        value={createForm.email}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            email: e.target.value,
                          })
                        }
                        className="border-slate-200 focus:border-slate-400 focus:ring-0 bg-white mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="createPassword"
                        className="text-sm font-medium text-slate-900"
                      >
                        Temporary Password
                      </Label>
                      <Input
                        id="createPassword"
                        type="password"
                        value={createForm.password}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            password: e.target.value,
                          })
                        }
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

          {/* Performance Indicators */}
          <div className="flex items-center space-x-4 text-sm mt-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
              <span className="text-slate-600">
                Active Trainers: {statusCounts.active}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-3 w-3 text-blue-500" />
              <span className="text-blue-600 font-medium">
                {statusCounts.assigned} assigned to cohorts
              </span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Trainers
              </CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-900">
                {statusCounts.total}
              </div>
              <p className="text-xs text-slate-500 mt-1">All team members</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Active Members
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-900">
                {statusCounts.active}
              </div>
              <p className="text-xs text-slate-500 mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Pending Verification
              </CardTitle>
              <Mail className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-900">
                {statusCounts.pending}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Awaiting email verification
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Assigned to Cohorts
              </CardTitle>
              <Target className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-900">
                {statusCounts.assigned}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                With active assignments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-slate-200 bg-white mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-medium text-slate-900">
                  Team Directory
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Manage trainers and their cohort assignments
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search trainers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTrainers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <UserPlus className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No trainers found
                </h3>
                <p className="text-slate-600 text-center mb-6 max-w-md">
                  {trainers.length === 0
                    ? "Start building your team by inviting or creating your first trainer account."
                    : "Try adjusting your search or filter criteria."}
                </p>
                {trainers.length === 0 && (
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => setIsInviteDialogOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-medium"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Invite Trainer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Trainer
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-medium text-slate-700">
                        Trainer
                      </TableHead>
                      <TableHead className="font-medium text-slate-700">
                        Email
                      </TableHead>
                      <TableHead className="font-medium text-slate-700">
                        Status
                      </TableHead>
                      <TableHead className="font-medium text-slate-700">
                        Assigned Cohorts
                      </TableHead>
                      <TableHead className="font-medium text-slate-700">
                        Joined Date
                      </TableHead>
                      <TableHead className="font-medium text-slate-700">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTrainers.map((trainer) => {
                      const fullName =
                        `${trainer.firstName || ""} ${trainer.lastName || ""}`.trim();
                      const initials =
                        trainer.firstName && trainer.lastName
                          ? `${trainer.firstName.charAt(0)}${trainer.lastName.charAt(0)}`.toUpperCase()
                          : fullName.charAt(0)?.toUpperCase() || "T";

                      return (
                        <TableRow
                          key={trainer._id}
                          className="hover:bg-slate-50"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={trainer.avatar}
                                  alt={fullName}
                                />
                                <AvatarFallback className="text-sm font-medium">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {fullName}
                                </p>
                                <p className="text-sm text-slate-500">
                                  ID: {trainer._id.slice(-6)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {trainer.email}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  trainer.isActive ? "default" : "secondary"
                                }
                                className={
                                  trainer.isActive
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-800 hover:bg-slate-100"
                                }
                              >
                                {trainer.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {!trainer.emailVerified && (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                                >
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {trainer.assignedCohorts &&
                            trainer.assignedCohorts.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {trainer.assignedCohorts
                                  .slice(0, 2)
                                  .map((cohort) => (
                                    <Badge
                                      key={cohort._id}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {cohort.name}
                                    </Badge>
                                  ))}
                                {trainer.assignedCohorts.length > 2 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    +{trainer.assignedCohorts.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">
                                No assignments
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {new Date(trainer.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTrainer(trainer);
                                    setAssignForm({
                                      cohortIds: trainer.assignedCohorts.map(
                                        (c) => c._id,
                                      ),
                                    });
                                    setIsAssignDialogOpen(true);
                                  }}
                                >
                                  <Settings className="mr-2 h-4 w-4" />
                                  Manage Trainer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    handleDeleteTrainer(trainer._id)
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove Trainer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2">
                  <div className="text-sm text-slate-600">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredTrainers.length,
                    )}{" "}
                    of {filteredTrainers.length} trainers
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={
                              page === currentPage ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`h-8 w-8 p-0 ${
                              page === currentPage
                                ? "bg-slate-900 text-white"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </Button>
                        ),
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign to Cohorts Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="bg-white border border-slate-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Manage Trainer Cohorts
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Assign cohorts for {selectedTrainer?.firstName}{" "}
                {selectedTrainer?.lastName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssignToCohorts} className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-900">
                  Available Cohorts
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 mt-2">
                  {cohorts.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No cohorts available
                    </p>
                  ) : (
                    cohorts.map((cohort) => (
                      <label
                        key={cohort._id}
                        className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={assignForm.cohortIds.includes(cohort._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignForm({
                                ...assignForm,
                                cohortIds: [
                                  ...assignForm.cohortIds,
                                  cohort._id,
                                ],
                              });
                            } else {
                              setAssignForm({
                                ...assignForm,
                                cohortIds: assignForm.cohortIds.filter(
                                  (id) => id !== cohort._id,
                                ),
                              });
                            }
                          }}
                          className="rounded border-slate-300"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-900">
                              {cohort.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {cohort.status || "Active"}
                            </Badge>
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
                  Update Trainer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-sm text-slate-600 pt-6 border-t border-slate-200">
          <div className="flex items-center space-x-6">
            <span>{filteredTrainers.length} trainers</span>
            <span>
              Updated{" "}
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900"
            >
              <Download className="h-4 w-4 mr-2" />
              Export List
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export with role-based protection - only ADMIN and SCHOOL_ADMIN can access
export default withAuth(TrainersPage, {
  roles: [ROLES.ADMIN, ROLES.SCHOOL_ADMIN],
});
