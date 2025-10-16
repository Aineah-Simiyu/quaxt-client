"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, setHours, setMinutes, subDays } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Video,
	Plus,
	Search,
	Filter,
	Calendar,
	Clock,
	Users,
	Link as LinkIcon,
	Play,
	Pause,
	Edit,
	Trash2,
	MoreHorizontal,
	Grid,
	List,
	CalendarPlus,
	VideoIcon,
	ExternalLink,
	Copy,
	Settings,
	Download,
	Upload,
	Bell,
	CheckCircle,
	XCircle,
	AlertCircle,
	TrendingUp,
	BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { ROLES, isSchoolAdmin, isInstructorOrAdmin } from "@/lib/constants";
import { withAuth } from "@/middleware/withAuth";
import { sessionService, cohortService, userService } from "@/lib/api";
import { EventCalendar } from "@/components/event-calendar";

const studentSampleEvents = [
	{
		id: "1",
		title: "Annual Planning",
		description: "Strategic planning for next year",
		start: subDays(new Date(), 24),
		end: subDays(new Date(), 23),
		allDay: true,
		color: "sky",
		location: "Main Conference Hall",
	},
	{
		id: "2",
		title: "Project Deadline",
		description: "Submit final deliverables",
		start: setMinutes(setHours(subDays(new Date(), 9), 13), 0),
		end: setMinutes(setHours(subDays(new Date(), 9), 15), 30),
		color: "amber",
		location: "Office",
	},
	{
		id: "3",
		title: "Quarterly Budget Review",
		description: "Strategic planning for next year",
		start: subDays(new Date(), 13),
		end: subDays(new Date(), 13),
		allDay: true,
		color: "orange",
		location: "Main Conference Hall",
	},
	{
		id: "4",
		title: "Team Meeting",
		description: "Weekly team sync",
		start: setMinutes(setHours(new Date(), 10), 0),
		end: setMinutes(setHours(new Date(), 11), 0),
		color: "sky",
		location: "Conference Room A",
	},
	{
		id: "5",
		title: "Lunch with Client",
		description: "Discuss new project requirements",
		start: setMinutes(setHours(addDays(new Date(), 1), 12), 0),
		end: setMinutes(setHours(addDays(new Date(), 1), 13), 15),
		color: "emerald",
		location: "Downtown Cafe",
	},
	{
		id: "6",
		title: "Product Launch",
		description: "New product release",
		start: addDays(new Date(), 3),
		end: addDays(new Date(), 6),
		allDay: true,
		color: "violet",
	},
	{
		id: "7",
		title: "Sales Conference",
		description: "Discuss about new clients",
		start: setMinutes(setHours(addDays(new Date(), 4), 14), 30),
		end: setMinutes(setHours(addDays(new Date(), 5), 14), 45),
		color: "rose",
		location: "Downtown Cafe",
	},
	{
		id: "8",
		title: "Team Meeting",
		description: "Weekly team sync",
		start: setMinutes(setHours(addDays(new Date(), 5), 9), 0),
		end: setMinutes(setHours(addDays(new Date(), 5), 10), 30),
		color: "orange",
		location: "Conference Room A",
	},
	{
		id: "9",
		title: "Review contracts",
		description: "Weekly team sync",
		start: setMinutes(setHours(addDays(new Date(), 5), 14), 0),
		end: setMinutes(setHours(addDays(new Date(), 5), 15), 30),
		color: "sky",
		location: "Conference Room A",
	},
	{
		id: "10",
		title: "Team Meeting",
		description: "Weekly team sync",
		start: setMinutes(setHours(addDays(new Date(), 5), 9), 45),
		end: setMinutes(setHours(addDays(new Date(), 5), 11), 0),
		color: "amber",
		location: "Conference Room A",
	},
	{
		id: "11",
		title: "Marketing Strategy Session",
		description: "Quarterly marketing planning",
		start: setMinutes(setHours(addDays(new Date(), 9), 10), 0),
		end: setMinutes(setHours(addDays(new Date(), 9), 15), 30),
		color: "emerald",
		location: "Marketing Department",
	},
	{
		id: "12",
		title: "Annual Shareholders Meeting",
		description: "Presentation of yearly results",
		start: addDays(new Date(), 17),
		end: addDays(new Date(), 17),
		allDay: true,
		color: "sky",
		location: "Grand Conference Center",
	},
	{
		id: "13",
		title: "Product Development Workshop",
		description: "Brainstorming for new features",
		start: setMinutes(setHours(addDays(new Date(), 26), 9), 0),
		end: setMinutes(setHours(addDays(new Date(), 27), 17), 0),
		color: "rose",
		location: "Innovation Lab",
	},
];


function SessionsPage() {
	const { user } = useAuth();
	const qc = useQueryClient();
	const [sessions, setSessions] = useState([]);
	const [cohorts, setCohorts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCohort, setSelectedCohort] = useState("all");
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'
	const [activeTab, setActiveTab] = useState("active"); // 'active', 'previous', 'upcoming'
	const [studentEvents, setStudentEvents] = useState(studentSampleEvents);

	const handleStudentEventAdd = useCallback(
		(event) => {
			setStudentEvents((prev) => [...prev, event]);
		},
		[],
	);

	const handleStudentEventUpdate = useCallback(
		(updatedEvent) => {
			setStudentEvents((prev) =>
				prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)),
			);
		},
		[],
	);

	const handleStudentEventDelete = useCallback(
		(eventId) => {
			setStudentEvents((prev) => prev.filter((event) => event.id !== eventId));
		},
		[],
	);
	
	// Create session modal state
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [createSessionData, setCreateSessionData] = useState({
		name: "",
		description: "",
		startDateTime: "",
		endDateTime: "",
		cohorts: [],
		meetingLink: "",
		type: "live", // 'live', 'recorded', 'hybrid'
		isRecurring: false,
		recurringPattern: "weekly",
	});
	
	// Manage session modal state
	const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
	const [selectedSession, setSelectedSession] = useState(null);
	const [editSessionData, setEditSessionData] = useState({
		name: "",
		description: "",
		startDateTime: "",
		endDateTime: "",
		meetingLink: "",
		status: "scheduled",
	});
	
	// Stats for dashboard cards
	const [stats, setStats] = useState({
		totalSessions: 0,
		activeSessions: 0,
		upcomingSessions: 0,
		completedSessions: 0,
		attendanceRate: 0,
	});
	
	// Permission helpers
	const canCreateSessions = isInstructorOrAdmin(user);
	const canManageSessions = isSchoolAdmin(user) || user?.role === ROLES.TRAINER;
	
	// React Query: sessions list by role and tab
	const sessionsQuery = useQuery({
		queryKey: [
			"sessions",
			user?.role,
			user?.school,
			user?._id,
			activeTab,
		],
		enabled: !!user,
		queryFn: async () => {
			if (!user) return { data: [] };
			if (isSchoolAdmin(user)) {
				switch (activeTab) {
					case "active":
						return await sessionService.getActiveSessions();
					case "previous":
						return await sessionService.getPreviousSessions(user._id);
					case "upcoming":
						return await sessionService.getUpcomingSessions(user._id);
					default:
						return await sessionService.getSessionsBySchool(user.school);
				}
			} else if (user?.role === ROLES.TRAINER) {
				switch (activeTab) {
					case "active":
						return await sessionService.getActiveSessions();
					case "previous":
						return await sessionService.getPreviousSessions(user._id);
					case "upcoming":
						return await sessionService.getUpcomingSessions(user._id);
					default:
						return await sessionService.getSessionsByTrainer(user._id);
				}
			} else {
				switch (activeTab) {
					case "active":
						return await sessionService.getActiveSessions();
					case "previous":
						return await sessionService.getPreviousSessions(user._id);
					case "upcoming":
						return await sessionService.getUpcomingSessions(user._id);
					default:
						return await sessionService.getSessions();
				}
			}
		},
	});

	useEffect(() => {
		const resp = sessionsQuery.data;
		const arr = resp?.data || resp || [];
		const list = Array.isArray(arr) ? arr : [];
		setSessions(list);
		// stats
		const now = new Date();
		const activeCount = list.filter((s) => s.status === "live" || s.status === "ongoing").length;
		const upcomingCount = list.filter((s) => new Date(s.startDateTime) > now && s.status !== "cancelled").length;
		const completedCount = list.filter((s) => s.status === "completed").length;
		setStats({
			totalSessions: list.length,
			activeSessions: activeCount,
			upcomingSessions: upcomingCount,
			completedSessions: completedCount,
			attendanceRate: 85,
		});
	}, [sessionsQuery.data]);
	
	// React Query: cohorts (for admins/trainers)
	const cohortsQuery = useQuery({
		queryKey: ["cohorts", user?.role, user?.school, user?._id],
		enabled: !!user && (isSchoolAdmin(user) || user?.role === ROLES.TRAINER),
		queryFn: async () => {
			if (isSchoolAdmin(user)) return await cohortService.getCohortsBySchool(user.school);
			if (user?.role === ROLES.TRAINER) return await cohortService.getCohortsByTrainer(user._id);
			return { data: [] };
		},
	});

	useEffect(() => {
		const resp = cohortsQuery.data;
		const arr = resp?.data || resp || [];
		if (Array.isArray(arr)) setCohorts(arr);
	}, [cohortsQuery.data]);
	
	useEffect(() => {
		setLoading(sessionsQuery.isLoading || cohortsQuery.isLoading);
	}, [sessionsQuery.isLoading, cohortsQuery.isLoading]);
	
	// Handle creating new session
	const createSessionMutation = useMutation({
		mutationFn: (payload) => sessionService.createSession(payload),
		onSuccess: () => {
			toast.success("Session created successfully");
			qc.invalidateQueries({ queryKey: ["sessions"] });
		},
		onError: (error) => {
			const errorMessage = error?.response?.data?.message || "Failed to create session";
			toast.error(errorMessage);
		},
	});

	const handleCreateSession = async () => {
		const {
			name,
			description,
			startDateTime,
			endDateTime,
			cohorts,
			meetingLink,
			type,
		} = createSessionData;
		
		if (
			!name.trim() ||
			!startDateTime ||
			!endDateTime ||
			cohorts.length === 0
		) {
			toast.error(
				"Please fill in all required fields (Name, Start Time, End Time, and select at least one cohort)",
			);
			return;
		}
		
		if (new Date(startDateTime) >= new Date(endDateTime)) {
			toast.error("End time must be after start time");
			return;
		}
		
		try {
			const sessionData = {
				name: name.trim(),
				description: description.trim(),
				startDateTime,
				endDateTime,
				cohorts,
				meetingLink: meetingLink.trim(),
				type,
				createdBy: user._id,
				school: user.school,
				status: "scheduled",
			};
			await createSessionMutation.mutateAsync(sessionData);
			setIsCreateDialogOpen(false);
			setCreateSessionData({
				name: "",
				description: "",
				startDateTime: "",
				endDateTime: "",
				cohorts: [],
				meetingLink: "",
				type: "live",
				isRecurring: false,
				recurringPattern: "weekly",
			});
		} catch (error) {
			console.error("Error creating session:", error);
		}
	};
	
	// Handle editing session
	const handleManageSession = (session) => {
		setSelectedSession(session);
		setEditSessionData({
			name: session.name,
			description: session.description || "",
			startDateTime: session.startDateTime,
			endDateTime: session.endDateTime,
			meetingLink: session.meetingLink || "",
			status: session.status,
		});
		setIsManageDialogOpen(true);
	};
	
	// Handle updating session
	const updateSessionMutation = useMutation({
		mutationFn: ({ id, payload }) => sessionService.updateSession(id, payload),
		onSuccess: () => {
			toast.success("Session updated successfully");
			qc.invalidateQueries({ queryKey: ["sessions"] });
		},
		onError: () => toast.error("Failed to update session"),
	});

	const handleUpdateSession = async () => {
		if (!selectedSession) return;
		
		const { name, description, startDateTime, endDateTime, meetingLink } =
			editSessionData;
		
		if (!name.trim() || !startDateTime || !endDateTime) {
			toast.error("Please fill in all required fields");
			return;
		}
		
		if (new Date(startDateTime) >= new Date(endDateTime)) {
			toast.error("End time must be after start time");
			return;
		}
		
		try {
			await updateSessionMutation.mutateAsync({ id: selectedSession._id, payload: {
				name: name.trim(),
				description: description.trim(),
				startDateTime,
				endDateTime,
				meetingLink: meetingLink.trim(),
			}});
			setIsManageDialogOpen(false);
		} catch (error) {
			console.error("Error updating session:", error);
		}
	};
	
	// Handle session status changes
	const startMutation = useMutation({
		mutationFn: (id) => sessionService.startSession(id),
		onSuccess: () => { toast.success("Session started"); qc.invalidateQueries({ queryKey: ["sessions"] }); },
	});
	const endMutation = useMutation({
		mutationFn: (id) => sessionService.endSession(id),
		onSuccess: () => { toast.success("Session ended"); qc.invalidateQueries({ queryKey: ["sessions"] }); },
	});
	const cancelMutation = useMutation({
		mutationFn: ({ id, reason }) => sessionService.cancelSession(id, reason),
		onSuccess: () => { toast.success("Session cancelled"); qc.invalidateQueries({ queryKey: ["sessions"] }); },
	});
	const deleteMutation = useMutation({
		mutationFn: (id) => sessionService.deleteSession(id),
		onSuccess: () => { toast.success("Session deleted"); qc.invalidateQueries({ queryKey: ["sessions"] }); },
	});

	const handleSessionAction = async (sessionId, action) => {
		try {
			switch (action) {
				case "start":
					await startMutation.mutateAsync(sessionId);
					break;
				case "end":
					await endMutation.mutateAsync(sessionId);
					break;
				case "cancel":
					const reason = prompt("Please provide a reason for cancellation:");
					if (reason) {
						await cancelMutation.mutateAsync({ id: sessionId, reason });
					}
					break;
				case "delete":
					if (
						confirm(
							"Are you sure you want to delete this session? This action cannot be undone.",
						)
					) {
						await deleteMutation.mutateAsync(sessionId);
					}
					break;
			}
		} catch (error) {
			console.error(`Error performing ${action} on session:`, error);
			toast.error(`Failed to ${action} session`);
		}
	};
	
	// Copy meeting link to clipboard
	const handleCopyLink = async (link) => {
		try {
			await navigator.clipboard.writeText(link);
			toast.success("Meeting link copied to clipboard");
		} catch (error) {
			toast.error("Failed to copy link");
		}
	};
	
	// Filter sessions based on search and filters
	const filteredSessions = sessions.filter((session) => {
		const matchesSearch =
			searchTerm === "" ||
			session.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			session.description?.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesCohort =
			selectedCohort === "all" ||
			(session.cohorts &&
				Array.isArray(session.cohorts) &&
				session.cohorts.some(
					(cohort) =>
						(typeof cohort === "string" ? cohort : cohort._id) ===
						selectedCohort,
				));
		
		const matchesStatus =
			selectedStatus === "all" || session.status === selectedStatus;
		
		return matchesSearch && matchesCohort && matchesStatus;
	});
	
	// Format date and time
	const formatDateTime = (dateTime) => {
		return new Date(dateTime).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};
	
	// Get session status badge color
	const getStatusBadgeColor = (status) => {
		switch (status) {
			case "live":
			case "ongoing":
				return "bg-red-100 text-red-800 border-red-200";
			case "scheduled":
			case "upcoming":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "completed":
				return "bg-green-100 text-green-800 border-green-200";
			case "cancelled":
				return "bg-gray-100 text-gray-800 border-gray-200";
			default:
				return "bg-slate-100 text-slate-800 border-slate-200";
		}
	};
	
	// Get session type icon
	const getSessionTypeIcon = (type) => {
		switch (type) {
			case "live":
				return <Video className="h-4 w-4" />;
			case "recorded":
				return <VideoIcon className="h-4 w-4" />;
			case "hybrid":
				return <Play className="h-4 w-4" />;
			default:
				return <Video className="h-4 w-4" />;
		}
	};
	
	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<div className="relative">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
				</div>
			</div>
		);
	}
	
	if (user?.role === ROLES.STUDENT) {
		return (
			<div className="min-h-screen">
				<div className="max-w-7xl mx-auto px-6 py-8">
					<div className="flex items-center justify-between mb-2">
						<div>
							<h1 className="text-3xl font-light text-slate-900 tracking-tight">
								Student - Sessions
							</h1>
							<p className="text-slate-600 mt-1 font-normal">
								{canCreateSessions
									? "Create and manage training sessions"
									: "View your training sessions"}
							</p>
						</div>
						<div className="flex items-center space-x-3">
							<div className="h-8 w-8 bg-slate-900 rounded-full flex items-center justify-center">
								<Video className="h-4 w-4 text-white" />
							</div>
							<span className="text-sm font-medium text-slate-700">Session View</span>
						</div>
					</div>
					<EventCalendar
						className="bg-white"
						events={studentEvents}
						onEventAdd={handleStudentEventAdd}
						onEventUpdate={handleStudentEventUpdate}
						onEventDelete={handleStudentEventDelete}
						readOnly
					/>
				</div>
			</div>
		);
	}
	
	return (
		<div className="min-h-screen">
			<div className="max-w-7xl mx-auto px-6 py-8">
				{/* Header Section */}
				<div className="mb-8">
					<div className="flex items-center justify-between mb-2">
						<div>
							<h1 className="text-3xl font-light text-slate-900 tracking-tight">
								Sessions
							</h1>
							<p className="text-slate-600 mt-1 font-normal">
								{canCreateSessions
									? "Create and manage training sessions"
									: "View your training sessions"}
							</p>
						</div>
						<div className="flex items-center space-x-3">
							<div className="h-8 w-8 bg-slate-900 rounded-full flex items-center justify-center">
								<Video className="h-4 w-4 text-white" />
							</div>
							<span className="text-sm font-medium text-slate-700">Session Management</span>
						</div>
					</div>
					
					{/* Performance Indicators */}
					<div className="flex items-center space-x-4 text-sm">
						<div className="flex items-center space-x-2">
							<div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
							<span className="text-slate-600">
                Active Sessions: {stats.activeSessions}
              </span>
						</div>
						<div className="flex items-center space-x-2">
							<TrendingUp className="h-3 w-3 text-emerald-500" />
							<span className="text-emerald-600 font-medium">
                {stats.attendanceRate}% attendance rate
              </span>
						</div>
					</div>
				</div>
				
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<Card className="border-slate-200 bg-white">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-600">
								Total Sessions
							</CardTitle>
							<Video className="h-4 w-4 text-slate-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-light text-slate-900">
								{stats.totalSessions}
							</div>
							<p className="text-xs text-slate-500 mt-1">All time</p>
						</CardContent>
					</Card>
					
					<Card className="border-slate-200 bg-white">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-600">
								Active Sessions
							</CardTitle>
							<Play className="h-4 w-4 text-slate-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-light text-slate-900">
								{stats.activeSessions}
							</div>
							<p className="text-xs text-slate-500 mt-1">Currently live</p>
						</CardContent>
					</Card>
					
					<Card className="border-slate-200 bg-white">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-600">
								Upcoming
							</CardTitle>
							<Calendar className="h-4 w-4 text-slate-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-light text-slate-900">
								{stats.upcomingSessions}
							</div>
							<p className="text-xs text-slate-500 mt-1">Next 7 days</p>
						</CardContent>
					</Card>
					
					<Card className="border-slate-200 bg-white">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-600">
								Attendance Rate
							</CardTitle>
							<BarChart3 className="h-4 w-4 text-slate-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-light text-slate-900">
								{stats.attendanceRate}%
							</div>
							<p className="text-xs text-slate-500 mt-1">Average attendance</p>
						</CardContent>
					</Card>
				</div>
				
				{/* Main Content */}
				<Card className="border-slate-200 bg-white">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-xl font-medium text-slate-900">
									Training Sessions
								</CardTitle>
								<CardDescription className="text-slate-600 mt-1">
									Manage your training sessions and view attendance
								</CardDescription>
							</div>
							<div className="flex items-center space-x-3">
								{/* View Mode Toggle */}
								<div className="flex items-center border border-slate-200 rounded-lg p-1">
									<Button
										variant={viewMode === "table" ? "default" : "ghost"}
										size="sm"
										onClick={() => setViewMode("table")}
										className="h-7 px-2"
									>
										<List className="h-3 w-3" />
									</Button>
									<Button
										variant={viewMode === "grid" ? "default" : "ghost"}
										size="sm"
										onClick={() => setViewMode("grid")}
										className="h-7 px-2"
									>
										<Grid className="h-3 w-3" />
									</Button>
								</div>
								
								{canCreateSessions && (
									<Dialog
										open={isCreateDialogOpen}
										onOpenChange={setIsCreateDialogOpen}
									>
										<DialogTrigger asChild>
											<Button className="bg-slate-900 hover:bg-slate-800 text-white">
												<Plus className="h-4 w-4 mr-2" />
												Create Session
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
											<DialogHeader>
												<DialogTitle className="text-slate-900">
													Create New Session
												</DialogTitle>
												<DialogDescription className="text-slate-600">
													Set up a new training session for your cohorts
												</DialogDescription>
											</DialogHeader>
											<div className="space-y-4">
												<div>
													<Label
														htmlFor="sessionName"
														className="text-sm font-medium text-slate-700"
													>
														Session Name *
													</Label>
													<Input
														id="sessionName"
														placeholder="Introduction to React"
														value={createSessionData.name}
														onChange={(e) =>
															setCreateSessionData((prev) => ({
																...prev,
																name: e.target.value,
															}))
														}
														className="mt-1"
													/>
												</div>
												
												<div>
													<Label
														htmlFor="sessionDescription"
														className="text-sm font-medium text-slate-700"
													>
														Description
													</Label>
													<Textarea
														id="sessionDescription"
														placeholder="Brief description of the session content..."
														value={createSessionData.description}
														onChange={(e) =>
															setCreateSessionData((prev) => ({
																...prev,
																description: e.target.value,
															}))
														}
														className="mt-1"
														rows={3}
													/>
												</div>
												
												<div className="grid grid-cols-2 gap-4">
													<div>
														<Label
															htmlFor="startDateTime"
															className="text-sm font-medium text-slate-700"
														>
															Start Date & Time *
														</Label>
														<Input
															id="startDateTime"
															type="datetime-local"
															value={createSessionData.startDateTime}
															onChange={(e) =>
																setCreateSessionData((prev) => ({
																	...prev,
																	startDateTime: e.target.value,
																}))
															}
															className="mt-1"
														/>
													</div>
													<div>
														<Label
															htmlFor="endDateTime"
															className="text-sm font-medium text-slate-700"
														>
															End Date & Time *
														</Label>
														<Input
															id="endDateTime"
															type="datetime-local"
															value={createSessionData.endDateTime}
															onChange={(e) =>
																setCreateSessionData((prev) => ({
																	...prev,
																	endDateTime: e.target.value,
																}))
															}
															className="mt-1"
														/>
													</div>
												</div>
												
												<div>
													<Label
														htmlFor="cohorts"
														className="text-sm font-medium text-slate-700"
													>
														Select Cohorts *
													</Label>
													<Select
														value={createSessionData.cohorts[0] || ""}
														onValueChange={(value) => {
															if (
																value &&
																!createSessionData.cohorts.includes(value)
															) {
																setCreateSessionData((prev) => ({
																	...prev,
																	cohorts: [...prev.cohorts, value],
																}));
															}
														}}
													>
														<SelectTrigger className="mt-1">
															<SelectValue placeholder="Select cohorts" />
														</SelectTrigger>
														<SelectContent>
															{cohorts.map((cohort) => (
																<SelectItem key={cohort._id} value={cohort._id}>
																	{cohort.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													{createSessionData.cohorts.length > 0 && (
														<div className="mt-2 flex flex-wrap gap-1">
															{createSessionData.cohorts.map((cohortId) => {
																const cohort = cohorts.find(
																	(c) => c._id === cohortId,
																);
																return cohort ? (
																	<Badge
																		key={cohortId}
																		variant="secondary"
																		className="text-xs"
																	>
																		{cohort.name}
																		<button
																			onClick={() =>
																				setCreateSessionData((prev) => ({
																					...prev,
																					cohorts: prev.cohorts.filter(
																						(id) => id !== cohortId,
																					),
																				}))
																			}
																			className="ml-1 hover:text-red-600"
																		>
																			×
																		</button>
																	</Badge>
																) : null;
															})}
														</div>
													)}
												</div>
												
												<div>
													<Label
														htmlFor="meetingLink"
														className="text-sm font-medium text-slate-700"
													>
														Meeting Link
													</Label>
													<Input
														id="meetingLink"
														placeholder="https://meet.google.com/abc-defg-hij"
														value={createSessionData.meetingLink}
														onChange={(e) =>
															setCreateSessionData((prev) => ({
																...prev,
																meetingLink: e.target.value,
															}))
														}
														className="mt-1"
													/>
												</div>
												
												<div>
													<Label
														htmlFor="sessionType"
														className="text-sm font-medium text-slate-700"
													>
														Session Type
													</Label>
													<Select
														value={createSessionData.type}
														onValueChange={(value) =>
															setCreateSessionData((prev) => ({
																...prev,
																type: value,
															}))
														}
													>
														<SelectTrigger className="mt-1">
															<SelectValue placeholder="Select session type" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="live">Live Session</SelectItem>
															<SelectItem value="recorded">
																Pre-recorded
															</SelectItem>
															<SelectItem value="hybrid">Hybrid</SelectItem>
														</SelectContent>
													</Select>
												</div>
												
												<div className="flex justify-end space-x-2">
													<Button
														variant="outline"
														onClick={() => setIsCreateDialogOpen(false)}
													>
														Cancel
													</Button>
													<Button
														onClick={handleCreateSession}
														className="bg-slate-900 hover:bg-slate-800 text-white"
													>
														<Plus className="h-4 w-4 mr-2" />
														Create Session
													</Button>
												</div>
											</div>
										</DialogContent>
									</Dialog>
								)}
							</div>
						</div>
					</CardHeader>
					
					<CardContent>
						{/* Session Management Modal */}
						<Dialog
							open={isManageDialogOpen}
							onOpenChange={setIsManageDialogOpen}
						>
							<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
								<DialogHeader>
									<DialogTitle className="text-slate-900">
										Manage Session: {selectedSession?.name}
									</DialogTitle>
									<DialogDescription className="text-slate-600">
										Edit session details and manage settings
									</DialogDescription>
								</DialogHeader>
								
								<Tabs defaultValue="details" className="w-full">
									<TabsList className="grid w-full grid-cols-3">
										<TabsTrigger value="details">Details</TabsTrigger>
										<TabsTrigger value="attendance">Attendance</TabsTrigger>
										<TabsTrigger value="actions">Actions</TabsTrigger>
									</TabsList>
									
									<TabsContent value="details" className="space-y-4 mt-4">
										<div>
											<Label
												htmlFor="editSessionName"
												className="text-sm font-medium text-slate-700"
											>
												Session Name
											</Label>
											<Input
												id="editSessionName"
												value={editSessionData.name}
												onChange={(e) =>
													setEditSessionData((prev) => ({
														...prev,
														name: e.target.value,
													}))
												}
												className="mt-1"
											/>
										</div>
										
										<div>
											<Label
												htmlFor="editSessionDescription"
												className="text-sm font-medium text-slate-700"
											>
												Description
											</Label>
											<Textarea
												id="editSessionDescription"
												value={editSessionData.description}
												onChange={(e) =>
													setEditSessionData((prev) => ({
														...prev,
														description: e.target.value,
													}))
												}
												className="mt-1"
												rows={3}
											/>
										</div>
										
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label
													htmlFor="editStartDateTime"
													className="text-sm font-medium text-slate-700"
												>
													Start Date & Time
												</Label>
												<Input
													id="editStartDateTime"
													type="datetime-local"
													value={editSessionData.startDateTime}
													onChange={(e) =>
														setEditSessionData((prev) => ({
															...prev,
															startDateTime: e.target.value,
														}))
													}
													className="mt-1"
												/>
											</div>
											<div>
												<Label
													htmlFor="editEndDateTime"
													className="text-sm font-medium text-slate-700"
												>
													End Date & Time
												</Label>
												<Input
													id="editEndDateTime"
													type="datetime-local"
													value={editSessionData.endDateTime}
													onChange={(e) =>
														setEditSessionData((prev) => ({
															...prev,
															endDateTime: e.target.value,
														}))
													}
													className="mt-1"
												/>
											</div>
										</div>
										
										<div>
											<Label
												htmlFor="editMeetingLink"
												className="text-sm font-medium text-slate-700"
											>
												Meeting Link
											</Label>
											<div className="flex mt-1">
												<Input
													id="editMeetingLink"
													value={editSessionData.meetingLink}
													onChange={(e) =>
														setEditSessionData((prev) => ({
															...prev,
															meetingLink: e.target.value,
														}))
													}
													className="flex-1"
												/>
												{editSessionData.meetingLink && (
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															handleCopyLink(editSessionData.meetingLink)
														}
														className="ml-2"
													>
														<Copy className="h-4 w-4" />
													</Button>
												)}
											</div>
										</div>
										
										<div className="flex justify-end space-x-2">
											<Button
												variant="outline"
												onClick={() => setIsManageDialogOpen(false)}
											>
												Cancel
											</Button>
											<Button
												onClick={handleUpdateSession}
												className="bg-slate-900 hover:bg-slate-800 text-white"
											>
												<Edit className="h-4 w-4 mr-2" />
												Update Session
											</Button>
										</div>
									</TabsContent>
									
									<TabsContent value="attendance" className="space-y-4 mt-4">
										<div className="text-center py-8">
											<Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
											<p className="text-slate-500">Attendance tracking</p>
											<p className="text-sm text-slate-400">
												Feature coming soon
											</p>
										</div>
									</TabsContent>
									
									<TabsContent value="actions" className="space-y-4 mt-4">
										<div className="space-y-3">
											{selectedSession?.status === "scheduled" && (
												<Button
													onClick={() =>
														handleSessionAction(selectedSession._id, "start")
													}
													className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
												>
													<Play className="h-4 w-4 mr-2" />
													Start Session
												</Button>
											)}
											
											{(selectedSession?.status === "live" ||
												selectedSession?.status === "ongoing") && (
												<Button
													onClick={() =>
														handleSessionAction(selectedSession._id, "end")
													}
													className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white"
												>
													<Pause className="h-4 w-4 mr-2" />
													End Session
												</Button>
											)}
											
											<Button
												onClick={() =>
													handleSessionAction(selectedSession._id, "cancel")
												}
												variant="outline"
												className="w-full justify-start text-amber-600 border-amber-300 hover:bg-amber-50"
											>
												<XCircle className="h-4 w-4 mr-2" />
												Cancel Session
											</Button>
											
											{selectedSession?.meetingLink && (
												<Button
													onClick={() =>
														window.open(selectedSession.meetingLink, "_blank")
													}
													variant="outline"
													className="w-full justify-start text-blue-600 border-blue-300 hover:bg-blue-50"
												>
													<ExternalLink className="h-4 w-4 mr-2" />
													Join Meeting
												</Button>
											)}
											
											<hr className="my-3" />
											
											<Button
												onClick={() =>
													handleSessionAction(selectedSession._id, "delete")
												}
												variant="outline"
												className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50"
											>
												<Trash2 className="h-4 w-4 mr-2" />
												Delete Session
											</Button>
										</div>
									</TabsContent>
								</Tabs>
							</DialogContent>
						</Dialog>
						
						{/* Tabs for Active/Previous/Upcoming Sessions */}
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="w-full mb-6"
						>
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="active">Active Sessions</TabsTrigger>
								<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
								<TabsTrigger value="previous">Previous</TabsTrigger>
							</TabsList>
							
							<TabsContent value={activeTab} className="mt-6">
								{/* Filters and Search */}
								<div className="flex flex-col sm:flex-row gap-4 mb-6">
									<div className="relative flex-1">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
										<Input
											placeholder="Search sessions by name or description..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-10"
										/>
									</div>
									{canCreateSessions && (
										<Select
											value={selectedCohort}
											onValueChange={setSelectedCohort}
										>
											<SelectTrigger className="w-full sm:w-48">
												<SelectValue placeholder="Filter by cohort" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">All Cohorts</SelectItem>
												{cohorts.map((cohort) => (
													<SelectItem key={cohort._id} value={cohort._id}>
														{cohort.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
									<Select
										value={selectedStatus}
										onValueChange={setSelectedStatus}
									>
										<SelectTrigger className="w-full sm:w-48">
											<SelectValue placeholder="Filter by status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Status</SelectItem>
											<SelectItem value="scheduled">Scheduled</SelectItem>
											<SelectItem value="live">Live</SelectItem>
											<SelectItem value="completed">Completed</SelectItem>
											<SelectItem value="cancelled">Cancelled</SelectItem>
										</SelectContent>
									</Select>
								</div>
								
								{/* Table View */}
								{viewMode === "table" && (
									<div className="border border-slate-200 rounded-lg overflow-hidden">
										<Table>
											<TableHeader>
												<TableRow className="bg-slate-50">
													<TableHead className="font-medium text-slate-700">
														Session
													</TableHead>
													<TableHead className="font-medium text-slate-700">
														Schedule
													</TableHead>
													<TableHead className="font-medium text-slate-700">
														Cohorts
													</TableHead>
													<TableHead className="font-medium text-slate-700">
														Status
													</TableHead>
													<TableHead className="font-medium text-slate-700">
														Type
													</TableHead>
													<TableHead className="font-medium text-slate-700">
														Link
													</TableHead>
													{canManageSessions && (
														<TableHead className="font-medium text-slate-700">
															Actions
														</TableHead>
													)}
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredSessions.length === 0 ? (
													<TableRow>
														<TableCell
															colSpan={canManageSessions ? 7 : 6}
															className="text-center py-8"
														>
															<div className="flex flex-col items-center space-y-2">
																<Video className="h-8 w-8 text-slate-400" />
																<p className="text-slate-500">
																	No sessions found
																</p>
																<p className="text-sm text-slate-400">
																	{searchTerm ||
																	selectedCohort !== "all" ||
																	selectedStatus !== "all"
																		? "Try adjusting your filters"
																		: canCreateSessions
																			? "Create your first session to get started"
																			: "No sessions available"}
																</p>
															</div>
														</TableCell>
													</TableRow>
												) : (
													filteredSessions.map((session) => (
														<TableRow
															key={session._id}
															className="hover:bg-slate-50 cursor-pointer"
															onClick={() =>
																canManageSessions
																	? handleManageSession(session)
																	: null
															}
														>
															<TableCell>
																<div className="space-y-1">
																	<p className="font-medium text-slate-900">
																		{session.name}
																	</p>
																	{session.description && (
																		<p className="text-sm text-slate-500 truncate max-w-xs">
																			{session.description}
																		</p>
																	)}
																</div>
															</TableCell>
															<TableCell>
																<div className="space-y-1">
																	<p className="text-sm text-slate-900">
																		{formatDateTime(session.startDateTime)}
																	</p>
																	<p className="text-xs text-slate-500">
																		to {formatDateTime(session.endDateTime)}
																	</p>
																</div>
															</TableCell>
															<TableCell>
																{session.cohorts &&
																session.cohorts.length > 0 ? (
																	<div className="flex flex-wrap gap-1">
																		{session.cohorts
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
																		{session.cohorts.length > 2 && (
																			<Badge
																				variant="secondary"
																				className="text-xs"
																			>
																				+{session.cohorts.length - 2}
																			</Badge>
																		)}
																	</div>
																) : (
																	<span className="text-slate-400 text-sm">
                                    No cohorts
                                  </span>
																)}
															</TableCell>
															<TableCell>
																<Badge
																	className={`text-xs ${getStatusBadgeColor(session.status)}`}
																>
																	{session.status?.toUpperCase()}
																</Badge>
															</TableCell>
															<TableCell>
																<div className="flex items-center space-x-2">
																	{getSessionTypeIcon(session.type)}
																	<span className="text-sm text-slate-700 capitalize">
                                    {session.type}
                                  </span>
																</div>
															</TableCell>
															<TableCell>
																{session.meetingLink ? (
																	<div className="flex items-center space-x-2">
																		<Button
																			variant="ghost"
																			size="sm"
																			onClick={(e) => {
																				e.stopPropagation();
																				window.open(
																					session.meetingLink,
																					"_blank",
																				);
																			}}
																			className="h-8 px-2 text-blue-600 hover:text-blue-700"
																		>
																			<ExternalLink className="h-3 w-3" />
																		</Button>
																		<Button
																			variant="ghost"
																			size="sm"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleCopyLink(session.meetingLink);
																			}}
																			className="h-8 px-2 text-slate-600 hover:text-slate-700"
																		>
																			<Copy className="h-3 w-3" />
																		</Button>
																	</div>
																) : (
																	<span className="text-slate-400 text-sm">
                                    No link
                                  </span>
																)}
															</TableCell>
															{canManageSessions && (
																<TableCell>
																	<Button
																		variant="ghost"
																		size="sm"
																		className="h-8 w-8 p-0"
																		onClick={(e) => {
																			e.stopPropagation();
																			handleManageSession(session);
																		}}
																	>
																		<MoreHorizontal className="h-4 w-4" />
																	</Button>
																</TableCell>
															)}
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</div>
								)}
								
								{/* Grid View */}
								{viewMode === "grid" && (
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
										{filteredSessions.length === 0 ? (
											<div className="col-span-full text-center py-12">
												<div className="flex flex-col items-center space-y-3">
													<Video className="h-12 w-12 text-slate-400" />
													<h3 className="text-lg font-medium text-slate-500">
														No sessions found
													</h3>
													<p className="text-sm text-slate-400 max-w-sm">
														{searchTerm ||
														selectedCohort !== "all" ||
														selectedStatus !== "all"
															? "Try adjusting your filters to find sessions"
															: canCreateSessions
																? "Create your first session to get started"
																: "No sessions available at the moment"}
													</p>
													{canCreateSessions &&
														!searchTerm &&
														selectedCohort === "all" &&
														selectedStatus === "all" && (
															<Button
																onClick={() => setIsCreateDialogOpen(true)}
																className="mt-4 bg-slate-900 hover:bg-slate-800 text-white"
															>
																<Plus className="h-4 w-4 mr-2" />
																Create Session
															</Button>
														)}
												</div>
											</div>
										) : (
											filteredSessions.map((session) => (
												<Card
													key={session._id}
													className="border-slate-200 bg-white hover:shadow-md transition-shadow duration-200"
												>
													<CardHeader className="pb-3">
														<div className="flex items-start justify-between">
															<div className="space-y-1 flex-1">
																<CardTitle className="text-lg font-medium text-slate-900 line-clamp-1">
																	{session.name}
																</CardTitle>
																<div className="flex items-center space-x-2">
																	{getSessionTypeIcon(session.type)}
																	<span className="text-sm text-slate-600 capitalize">
                                    {session.type}
                                  </span>
																</div>
															</div>
															<Badge
																className={`text-xs ${getStatusBadgeColor(session.status)}`}
															>
																{session.status?.toUpperCase()}
															</Badge>
														</div>
														{session.description && (
															<CardDescription className="line-clamp-2 mt-2">
																{session.description}
															</CardDescription>
														)}
													</CardHeader>
													<CardContent className="space-y-4">
														<div className="space-y-2">
															<div className="flex items-center space-x-2 text-sm">
																<Calendar className="h-4 w-4 text-slate-500" />
																<span className="text-slate-700">
                                  {formatDateTime(session.startDateTime)}
                                </span>
															</div>
															<div className="flex items-center space-x-2 text-sm">
																<Clock className="h-4 w-4 text-slate-500" />
																<span className="text-slate-700">
                                  {formatDateTime(session.endDateTime)}
                                </span>
															</div>
														</div>
														
														{session.cohorts && session.cohorts.length > 0 && (
															<div>
																<p className="text-xs font-medium text-slate-600 mb-1">
																	Cohorts:
																</p>
																<div className="flex flex-wrap gap-1">
																	{session.cohorts.slice(0, 3).map((cohort) => (
																		<Badge
																			key={cohort._id}
																			variant="secondary"
																			className="text-xs"
																		>
																			{cohort.name}
																		</Badge>
																	))}
																	{session.cohorts.length > 3 && (
																		<Badge
																			variant="secondary"
																			className="text-xs"
																		>
																			+{session.cohorts.length - 3} more
																		</Badge>
																	)}
																</div>
															</div>
														)}
														
														<div className="flex items-center justify-between pt-2 border-t border-slate-100">
															<div className="flex items-center space-x-2">
																{session.meetingLink && (
																	<>
																		<Button
																			variant="ghost"
																			size="sm"
																			onClick={() =>
																				window.open(
																					session.meetingLink,
																					"_blank",
																				)
																			}
																			className="h-8 px-2 text-blue-600 hover:text-blue-700"
																		>
																			<ExternalLink className="h-3 w-3" />
																		</Button>
																		<Button
																			variant="ghost"
																			size="sm"
																			onClick={() =>
																				handleCopyLink(session.meetingLink)
																			}
																			className="h-8 px-2 text-slate-600 hover:text-slate-700"
																		>
																			<Copy className="h-3 w-3" />
																		</Button>
																	</>
																)}
															</div>
															{canManageSessions && (
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => handleManageSession(session)}
																	className="h-8 px-2 text-slate-600 hover:text-slate-700"
																>
																	<Settings className="h-3 w-3" />
																</Button>
															)}
														</div>
													</CardContent>
												</Card>
											))
										)}
									</div>
								)}
								
								{/* Results Summary */}
								{filteredSessions.length > 0 && (
									<div className="mt-6 text-sm text-slate-600">
										Showing {filteredSessions.length} of {sessions.length}{" "}
										sessions
									</div>
								)}
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default withAuth(SessionsPage, [
	ROLES.ADMIN,
	ROLES.SCHOOL_ADMIN,
	ROLES.TRAINER,
	ROLES.STUDENT,
]);
