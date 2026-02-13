
import React from 'react';
import { ChecklistItem as ChecklistItemType, ChecklistItemStatus } from '../../types';

interface ChecklistItemProps {
    item: ChecklistItemType;
    onUpdate: (id: string, status: ChecklistItemStatus) => void;
}

const statusStyles = {
    [ChecklistItemStatus.MISSING]: {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        ring: 'focus:ring-rose-500'
    },
    [ChecklistItemStatus.PENDING]: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        ring: 'focus:ring-amber-500'
    },
    [ChecklistItemStatus.READY]: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        ring: 'focus:ring-emerald-500'
    }
};

const getCategoryStyle = (category: string | undefined) => {
    if (!category) return 'bg-slate-100 text-slate-600';

    const styles = [
        'bg-indigo-100 text-indigo-700',
        'bg-emerald-100 text-emerald-700',
        'bg-amber-100 text-amber-700',
        'bg-rose-100 text-rose-700',
        'bg-violet-100 text-violet-700',
        'bg-sky-100 text-sky-700',
        'bg-fuchsia-100 text-fuchsia-700'
    ];

    // Simple hash to consistently pick a color for a category name
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    return styles[Math.abs(hash) % styles.length];
};

export const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, onUpdate }) => {
    const currentStatusStyle = statusStyles[item.status];
    const currentCategoryStyle = getCategoryStyle(item.category);

    return (
        <div className={`group p-5 border rounded-2xl transition-all duration-200 hover:shadow-md ${currentStatusStyle.bg} ${currentStatusStyle.border} bg-opacity-40`}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center mb-3">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${currentCategoryStyle}`}>
                            {item.category}
                        </span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">{item.documentName}</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs font-medium text-slate-500">
                        <span className="flex items-center">
                            <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"></path></svg>
                            {item.issuingAgency}
                        </span>
                        {item.agencyLink && item.agencyLink !== 'N/A' && (
                            <a href={item.agencyLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-fuchsia-600 hover:text-fuchsia-800 hover:underline">
                                Visit Agency
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0 pt-1">
                    <div className="relative">
                        <select
                            value={item.status}
                            onChange={(e) => onUpdate(item.id, e.target.value as ChecklistItemStatus)}
                            className={`w-full md:w-40 appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-bold shadow-sm border-0 ring-1 ring-inset ring-slate-200 ${currentStatusStyle.ring} focus:ring-2 bg-white text-slate-700 cursor-pointer hover:bg-slate-50`}
                        >
                            {Object.values(ChecklistItemStatus).map(status => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
