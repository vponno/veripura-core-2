import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle, XCircle, Loader2, Sparkles, FileText } from 'lucide-react';

interface SubAgentNotification {
    id: string;
    agentName: string;
    status: 'running' | 'completed' | 'failed';
    message: string;
    documentsFound?: number;
    timestamp: number;
}

interface SubAgentNotifierProps {
    notifications: SubAgentNotification[];
    onDismiss?: (id: string) => void;
}

export const SubAgentNotifier: React.FC<SubAgentNotifierProps> = ({ 
    notifications, 
    onDismiss 
}) => {
    const [visibleNotifications, setVisibleNotifications] = useState<SubAgentNotification[]>([]);

    useEffect(() => {
        // Auto-dismiss completed notifications after 10 seconds (was 5)
        const timer = setInterval(() => {
            const now = Date.now();
            setVisibleNotifications(prev => 
                prev.filter(n => {
                    const age = now - n.timestamp;
                    // Keep running notifications and recent completed ones
                    return n.status === 'running' || age < 10000;
                })
            );
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setVisibleNotifications(notifications);
    }, [notifications]);

    if (visibleNotifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
            {visibleNotifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`rounded-xl shadow-lg border p-4 animate-in slide-in-from-right duration-300 ${
                        notification.status === 'running'
                            ? 'bg-blue-50 border-blue-200'
                            : notification.status === 'completed'
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-red-50 border-red-200'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                            notification.status === 'running'
                                ? 'bg-blue-100 text-blue-600'
                                : notification.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-red-100 text-red-600'
                        }`}>
                            {notification.status === 'running' ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : notification.status === 'completed' ? (
                                <CheckCircle size={18} />
                            ) : (
                                <XCircle size={18} />
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Bot size={14} className="text-fuchsia-500" />
                                <h4 className="text-sm font-bold text-slate-900">
                                    {notification.agentName}
                                </h4>
                            </div>
                            
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {notification.message}
                            </p>
                            
                            {notification.documentsFound && notification.documentsFound > 0 && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-fuchsia-700">
                                    <FileText size={12} />
                                    <span>Found {notification.documentsFound} required documents</span>
                                </div>
                            )}
                            
                            {notification.status === 'running' && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                                    <Sparkles size={12} className="animate-pulse" />
                                    <span>Analyzing with AI...</span>
                                </div>
                            )}
                        </div>
                        
                        {notification.status !== 'running' && onDismiss && (
                            <button
                                onClick={() => onDismiss(notification.id)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SubAgentNotifier;
