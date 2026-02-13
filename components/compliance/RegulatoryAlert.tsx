
import React from 'react';

interface RegulatoryAlertProps {
  message: string;
  onDismiss: () => void;
}

export const RegulatoryAlert: React.FC<RegulatoryAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="mb-6 bg-amber-50 border border-amber-100 p-5 rounded-2xl shadow-sm flex items-start gap-4">
        <div className="flex-shrink-0 bg-amber-100 rounded-full p-2">
          <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5v2h2v-2h-2zm0-8v6h2V5h-2z"/>
          </svg>
        </div>
        <div className="flex-1 pt-1">
          <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-1">Regulatory Update</h4>
          <p className="text-amber-900 leading-relaxed">{message}</p>
        </div>
        <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600 transition-colors p-1" aria-label="Dismiss alert">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
    </div>
  );
};
