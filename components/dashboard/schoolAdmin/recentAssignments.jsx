import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatStatus, getStatusColor, getStatusStyles } from "@/utils/colorHelpers";
import Link from "next/link";

// ✅ Fixed: Destructure `assignments` from props
export default function RecentAssignments({ assignments = [] }) {
	const data = Array.isArray(assignments) ? assignments : [];
	
	return (
		<div>
			<Card className="border-0 shadow-sm bg-white">
				<CardHeader className="px-6 py-5 border-b border-slate-100">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-lg font-semibold text-slate-900">
								Recent Activity
							</CardTitle>
							<CardDescription className="text-slate-600 mt-1">
								Latest assignment updates and deliverables
							</CardDescription>
						</div>
						<button className="text-sm text-slate-600 hover:text-slate-900 font-medium">
							<Link href="/assignments">View All</Link>
						</button>
					</div>
				</CardHeader>
				
				<CardContent className="p-0">
					<div className="divide-y divide-slate-100">
						{data.map((assignment) => (
							<div
								key={assignment._id}
								className="px-6 py-4 hover:bg-slate-50 transition-colors duration-150"
							>
								<div className="flex items-start justify-between">
									<div className="flex items-start space-x-4">
										<div className="flex-shrink-0 mt-1">
											<div
												className={`h-2 w-2 rounded-full ${getStatusColor(assignment.status)}`}
											></div>
										</div>
										
										<div>
											<p className="text-sm font-medium text-slate-900">
												{assignment.title}
											</p>
											
											<div className="flex flex-wrap gap-2 mt-2">
												{assignment.cohorts?.map((cohort, idx) => (
													<span
														key={idx}
														className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
													>
														{cohort}
													</span>
												))}
											</div>
											
											<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
												<span className="text-xs text-slate-500">
													📅 Due{" "}
													{new Date(assignment.dueDate).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
												
												<span className="text-xs text-slate-500">
													🕒 Created{" "}
													{new Date(assignment.createdAt).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
												
												{assignment.creator && (
													<span className="text-xs text-slate-500">
														👤 Trainer:{" "}
														<span className="font-medium text-slate-700">
															{assignment.creator.firstName} {assignment.creator.lastName}
														</span>
													</span>
												)}
											</div>
										</div>
									</div>
									
									<div className="flex items-center">
										<span
											className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusStyles(
												assignment.status
											)}`}
										>
											{formatStatus(assignment.status)}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}