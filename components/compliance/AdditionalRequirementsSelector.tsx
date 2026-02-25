import React from 'react';
import { ChecklistItemCategory } from '../../types';

interface AdditionalRequirementsSelectorProps {
    onAddRule: (name: string, category: ChecklistItemCategory) => void;
}

export const AdditionalRequirementsSelector: React.FC<AdditionalRequirementsSelectorProps> = ({ onAddRule }) => {
    const [customName, setCustomName] = React.useState('');

    const handleAddCustom = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (customName.trim()) {
            onAddRule(customName.trim(), ChecklistItemCategory.REGULATORY);
            setCustomName('');
        }
    };

    return (
        <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Add Guardian Requirements
                </h3>
            </div>

            {/* Custom Input */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="block text-xs font-semibold text-slate-500 mb-2">ADD CUSTOM REQUIREMENT</label>
                <form onSubmit={handleAddCustom} className="flex gap-2">
                    <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Specific Lab Analysis..."
                        className="flex-1 bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 block w-full p-2.5 outline-none transition-all placeholder:text-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={!customName.trim()}
                        className="text-white bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-bold rounded-lg text-sm px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Add
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdditionalRequirementsSelector;
