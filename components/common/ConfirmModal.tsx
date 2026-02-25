import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'info' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'warning'
}) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const variantStyles = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-amber-600 hover:bg-amber-700',
        info: 'bg-blue-600 hover:bg-blue-700'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${variant === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                                variant === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                                    'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                            }`}>
                            <AlertTriangle size={24} />
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-2">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-slate-900/10 transition-all active:scale-95 ${variantStyles[variant]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
