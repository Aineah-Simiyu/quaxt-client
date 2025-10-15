import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatStatus, getStatusColor, getStatusStyles } from "@/utils/colorHelpers";
import Link from "next/link";

export default function RecentSubmissions({ submissions = [] }) {
	const list = Array.isArray(submissions) ? submissions : [];
	
	return (
		<Card className="border-0 shadow-sm bg-white">
			<CardHeader className="px-6 py-5 border-b border-slate-100">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-lg font-semibold text-slate-900">Recent Submissions</CardTitle>
						<CardDescription className="text-slate-600 mt-1">
							Latest student hand-ins
						</CardDescription>
					</div>
					<Link className="text-sm text-slate-600 hover:text-slate-900 font-medium" href="/submissions">
						View All
					</Link>
				</div>
			</CardHeader>
			
			<CardContent className="p-0">
				<div className="divide-y divide-slate-100">
					{list.map((sub) => (
						<div
							key={sub._id}
							className="px-6 py-4 hover:bg-slate-50 transition-colors duration-150"
						>
							<div className="flex items-start justify-between">
								<div className="flex items-start space-x-4">
									{/* status dot */}
									<div className="flex-shrink-0 mt-1">
										<div
											className={`h-2 w-2 rounded-full ${getStatusColor(sub.status)}`}
										/>
									</div>
									
									<div>
										{/* assignment title */}
										<p className="text-sm font-medium text-slate-900">
											{sub.assignment?.title ?? "Untitled Assignment"}
										</p>
										
										{/* student name */}
										<p className="text-xs text-slate-500 mt-1">
											👤{" "}
											<span className="font-medium text-slate-700">
                        {sub.student?.firstName} {sub.student?.lastName}
                      </span>
										</p>
										
										{/* cohort tags */}
										<div className="flex flex-wrap gap-2 mt-2">
											{sub.student?.cohorts?.map((c, i) => (
												<span
													key={i}
													className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
												>
                          {c}
                        </span>
											))}
										</div>
										
										{/* submitted at + late warning */}
										<div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>
                        🕒 Submitted{" "}
	                      {new Date(sub.submittedAt).toLocaleDateString("en-US", {
		                      month: "short",
		                      day: "numeric",
		                      hour: "2-digit",
		                      minute: "2-digit",
	                      })}
                      </span>
											{sub.isLate && (
												<span className="text-amber-600 font-medium">⚠️ Late</span>
											)}
										</div>
									</div>
								</div>
								
								{/* status badge */}
								<span
									className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusStyles(
										sub.status
									)}`}
								>
                  {formatStatus(sub.status)}
                </span>
							</div>
						</div>
					))}
					
					{!list.length && (
						<div className="px-6 py-10 text-center text-sm text-slate-500">
							No submissions yet
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}