
import React, { useRef, useEffect } from 'react';

interface DraftDocumentModalProps {
  content: {
    title: string;
    html: string;
  } | null;
  onClose: () => void;
}

export const DraftDocumentModal: React.FC<DraftDocumentModalProps> = ({ content, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  const handlePrint = () => {
    const printableContent = printableRef.current?.innerHTML;
    if (printableContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print Document</title>');
        printWindow.document.write('<style>body{font-family:sans-serif; margin: 40px; color: #333;} h1,h2,h3{color:#000;} table{width:100%; border-collapse:collapse; margin-top:20px;} td,th{border:1px solid #ddd; padding:12px; text-align: left;} .disclaimer{background-color:#fff3cd; color: #664d03; border:1px solid #ffeeba; padding:1rem; margin-bottom:2rem; border-radius:4px; font-weight:bold; text-align:center;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printableContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  if (!content) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 md:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-title"
    >
      <div 
        ref={modalRef} 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 id="document-title" className="text-xl font-bold text-slate-800">{content.title}</h2>
          <button onClick={onClose} className="bg-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-300 rounded-full p-2 transition-colors" aria-label="Close modal">
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main ref={printableRef} className="p-8 overflow-y-auto bg-white text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: content.html }} />

        <footer className="flex justify-end items-center p-6 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="text-slate-600 font-semibold py-2.5 px-6 rounded-xl hover:bg-slate-200 transition-colors mr-3">
            Close
          </button>
          <button onClick={handlePrint} className="bg-slate-900 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </footer>
      </div>
    </div>
  );
};
