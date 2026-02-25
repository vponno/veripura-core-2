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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md dark:hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
                </div>
                <div className={`p-3 rounded-lg bg-slate-50 dark:bg-slate-800 ${color}`}>
                    <Icon size={24} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {trend.value > 0 ? '+' : ''}{trend.value}%
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 ml-2">{trend.label}</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
