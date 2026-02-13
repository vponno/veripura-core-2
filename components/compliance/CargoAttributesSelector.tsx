import React from 'react';
import { Leaf, Snowflake, Zap, Droplets, Fish, Heart, ShieldCheck, ThermometerSnowflake, Flame, ConciergeBell } from 'lucide-react';

interface CargoAttributesSelectorProps {
    selectedAttributes: string[];
    onToggleAttribute: (attribute: string) => void;
    variant?: 'all' | 'product' | 'shipment';
}

const ATTRIBUTE_GROUPS = [
    {
        title: 'Condition & Processing',
        icon: ThermometerSnowflake,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        category: 'Condition',
        type: 'shipment',
        items: [
            { name: 'Frozen', icon: Snowflake },
            { name: 'Fresh/Chilled', icon: Droplets },
            { name: 'Dried', icon: Leaf },
            { name: 'Roasted', icon: Flame },
            { name: 'Ready-to-Eat', icon: ConciergeBell }
        ]
    },
    {
        title: 'Sourcing & Ethics',
        icon: Heart,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        category: 'Sourcing',
        type: 'product',
        items: [
            { name: 'Organic', icon: Leaf },
            { name: 'Fairtrade', icon: Heart },
            { name: 'Wild Caught', icon: Fish },
            { name: 'Aquaculture', icon: Droplets }
        ]
    },
    {
        title: 'Dietary & Religious',
        icon: ShieldCheck,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        category: 'Dietary',
        type: 'product',
        items: [
            { name: 'Halal', icon: Zap },
            { name: 'Kosher', icon: ShieldCheck }
        ]
    }
];

export const CargoAttributesSelector: React.FC<CargoAttributesSelectorProps> = ({ selectedAttributes, onToggleAttribute, variant = 'all' }) => {

    const visibleGroups = ATTRIBUTE_GROUPS.filter(g => {
        if (variant === 'all') return true;
        return g.type === variant;
    });

    return (
        <div className="space-y-4">
            {visibleGroups.map((group) => (
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
                        {group.items.map((item) => {
                            const isSelected = selectedAttributes.includes(item.name);
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => onToggleAttribute(item.name)}
                                    className={`text-xs px-2.5 py-1.5 rounded-md border transition-all flex items-center gap-1.5 group font-medium ${isSelected
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                >
                                    <item.icon size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                    {item.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};
