import React from 'react';
import { ChecklistItem as ChecklistItemType, ChecklistItemStatus } from '../../types';
import { ChecklistItemCard } from './ChecklistItemCard';

interface ChecklistProps {
  items: ChecklistItemType[];
  onUpdate: (id: string, status: ChecklistItemStatus) => void;
  onDelete: (id: string) => void;
}

export const Checklist: React.FC<ChecklistProps> = ({ items, onUpdate, onDelete }) => {
  const progress = items.length > 0 ? (items.filter(item => item.status === ChecklistItemStatus.READY).length / items.length) * 100 : 0;

  const mandatoryItems = items.filter(i => i.isMandatory);
  const advisedItems = items.filter(i => !i.isMandatory);

  return (
    <div className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-slate-200">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Compliance Checklist</h2>
          <p className="text-sm text-slate-500">Required documents and certifications.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-fuchsia-600">{Math.round(progress)}%</span>
          <p className="text-xs text-slate-400 font-semibold uppercase">Complete</p>
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="space-y-8">
        {/* Mandatory Section */}
        {mandatoryItems.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Mandatory Requirements
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {mandatoryItems.map(item => (
                <ChecklistItemCard key={item.id} item={item} onUpdate={onUpdate} />
              ))}
            </div>
          </div>
        )}

        {/* Advised Section */}
        {advisedItems.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Recommended / Optional
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {advisedItems.map(item => (
                <ChecklistItemCard
                  key={item.id}
                  item={item}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};