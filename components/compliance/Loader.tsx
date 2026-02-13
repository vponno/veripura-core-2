
import React from 'react';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-lg border border-slate-100">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-fuchsia-200 rounded-full animate-ping opacity-25"></div>
            <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-slate-100 border-t-fuchsia-600"></div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Processing Request</h2>
        <p className="text-slate-500 max-w-md text-center">{message}</p>
    </div>
  );
};
