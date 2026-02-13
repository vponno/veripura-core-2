import React from 'react';
import { Plus, Check, ShieldCheck, FileText, Truck, ScrollText, Globe } from 'lucide-react';
import { ChecklistItemCategory } from '../../types';

interface AdditionalRequirementsSelectorProps {
    onAddRule: (name: string, category: ChecklistItemCategory) => void;
}

const PRESET_GROUPS = [
    {
        title: 'Regulatory Agents',
        icon: Globe,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
        category: ChecklistItemCategory.REGULATORY,
        items: [
            'Certificate of Origin',
            'Phytosanitary Certificate',
            'Health Certificate',
            'Import Permit'
        ]
    },
    {
        title: 'Food Safety & Quality',
        icon: ShieldCheck,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
        category: ChecklistItemCategory.FOOD_SAFETY,
        items: [
            'ISO 22000 / HACCP',
            'Pesticide Analysis Report',
            'Heavy Metals Test',
            'Microbiological Analysis',
            'Non-GMO Certificate'
        ]
    },
    {
        title: 'Certifications',
        icon: ScrollText,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-100',
        category: ChecklistItemCategory.CERTIFICATIONS,
        items: [
            'Organic Certificate',
            'Fairtrade',
            'Halal Certificate',
            'Kosher Certificate',
            'Rainforest Alliance'
        ]
    },
];

export const AdditionalRequirementsSelector: React.FC<AdditionalRequirementsSelectorProps> = ({ onAddRule }) => {
    const [customName, setCustomName] = React.useState('');
    // Track selected items to visualize state (optional, as handleAddRule adds to parent)
    // For this UI, we just fire the event. Parent handles "added" state via the checklist.

    // We might want to visually indicate "added" if we had access to the current list, 
    // but the prop only allows adding. We'll animate buttons on click or keep it simple.

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
                <span className="text-xs text-slate-400">Select documents required for this shipment</span>
            </div>

            {/* Grid of Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESET_GROUPS.map((group) => (
                    <div
                        key={group.title}
                        className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
                            <div className={`p-1.5 rounded-lg ${group.bgColor} ${group.color}`}>
                                <group.icon size={16} />
                            </div>
                            <h4 className="font-semibold text-slate-800 text-sm">{group.title}</h4>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {group.items.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => onAddRule(item, group.category)}
                                    className="text-xs px-2.5 py-1.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center gap-1.5 group font-medium"
                                >
                                    <Plus size={12} className="text-slate-400 group-hover:text-white" />
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
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
