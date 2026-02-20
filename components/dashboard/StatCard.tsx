import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
    };
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color = 'text-primary' }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-slate-800">{value}</div>
                </div>
                <div className={`p-3 rounded-lg bg-slate-50 ${color}`}>
                    <Icon size={24} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {trend.value > 0 ? '+' : ''}{trend.value}%
                    </span>
                    <span className="text-slate-400 ml-2">{trend.label}</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
