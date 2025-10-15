// Helper functions
function getStatusColor(status) {
	switch (status) {
		case 'completed':
			return 'bg-emerald-500';
		case 'in-progress':
			return 'bg-blue-500';
		case 'not-started':
			return 'bg-slate-400';
		case 'overdue':
			return 'bg-red-500';
		default:
			return 'bg-slate-400';
	}
}

function getStatusStyles(status) {
	switch (status) {
		case 'completed':
			return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
		case 'in-progress':
			return 'bg-blue-50 text-blue-700 border border-blue-200';
		case 'not-started':
			return 'bg-slate-50 text-slate-700 border border-slate-200';
		case 'overdue':
			return 'bg-red-50 text-red-700 border border-red-200';
		default:
			return 'bg-slate-50 text-slate-700 border border-slate-200';
	}
}

function getPriorityStyles(priority) {
	switch (priority) {
		case 'high':
			return 'bg-red-100 text-red-700';
		case 'medium':
			return 'bg-yellow-100 text-yellow-700';
		case 'low':
			return 'bg-green-100 text-green-700';
		default:
			return 'bg-slate-100 text-slate-700';
	}
}

function formatStatus(status) {
	switch (status) {
		case 'completed':
			return 'Complete';
		case 'in-progress':
			return 'In Progress';
		case 'not-started':
			return 'Pending';
		case 'overdue':
			return 'Overdue';
		default:
			return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');
	}
}

module.exports = { getStatusColor, getStatusStyles, getPriorityStyles, formatStatus };