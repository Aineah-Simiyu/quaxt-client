import React from 'react';

const KPIStatCard = ({ icon: Icon, value, title, subtitle, iconBgClass, iconColorClass }) => {
	return (
		<div className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200 rounded-lg">
			<div className="p-6">
				<div className="flex items-center justify-between mb-3">
					<div className={`h-10 w-10 ${iconBgClass} rounded-lg flex items-center justify-center`}>
						<Icon className={`h-5 w-5 ${iconColorClass}`} />
					</div>
					<span className="text-2xl font-light text-slate-900">{value}</span>
				</div>
				<div>
					<p className="text-sm font-medium text-slate-900 mb-1">{title}</p>
					<p className="text-xs text-slate-500">{subtitle}</p>
				</div>
			</div>
		</div>
	);
};

export default KPIStatCard;
