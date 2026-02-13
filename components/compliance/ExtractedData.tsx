import React from 'react';
import { ExtractedPOData, DocumentType } from '../../types';

interface ExtractedDataProps {
  data: ExtractedPOData;
  file?: File | null;
  onReset: () => void;
  onUpdate: (newData: ExtractedPOData) => void;
  onGenerateDocument?: (docType: DocumentType) => void;
  isGeneratingDoc?: boolean;
  customFooter?: React.ReactNode;
}

export const ExtractedData: React.FC<ExtractedDataProps> = ({ data, file, onReset, onUpdate, onGenerateDocument, isGeneratingDoc, customFooter }) => {
  const isSuspicious = data.securityAnalysis?.isSuspicious;
  const tamperScore = data.securityAnalysis?.tamperScore || 0;

  const handleProductChange = (index: number, field: string, value: any) => {
    const newProducts = [...data.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    onUpdate({ ...data, products: newProducts });
  };

  const handleFieldChange = (field: string, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="relative group">
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-violet-600 rounded-[2rem] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

      <div className="relative bg-white p-8 rounded-[1.75rem] shadow-xl shadow-purple-100/50 border border-slate-100">

        {/* Security Badge Banner */}
        {data.securityAnalysis && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-4 ${isSuspicious ? 'bg-rose-50 border border-rose-100' : 'bg-emerald-50 border border-emerald-100'}`}>
            <div className={`flex-shrink-0 p-2 rounded-full ${isSuspicious ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {isSuspicious ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            <div>
              <h3 className={`font-bold text-sm uppercase tracking-wider ${isSuspicious ? 'text-rose-800' : 'text-emerald-800'}`}>
                {isSuspicious ? `Security Warning (Score: ${tamperScore}/100)` : 'Document Integrity Verified'}
              </h3>
              <p className={`text-sm mt-1 leading-relaxed ${isSuspicious ? 'text-rose-700' : 'text-emerald-700'}`}>
                {data.securityAnalysis.suspicionReason}
              </p>
            </div>
          </div>
        )}

        {/* PDF Preview */}
        {file && (
          <div className="mb-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Document Preview</span>
              <span className="text-xs text-slate-400 font-mono">{file.name}</span>
            </div>
            <div className="h-96 w-full bg-slate-100">
              <embed src={URL.createObjectURL(file)} type={file.type} className="w-full h-full" />
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Extracted Shipment Details</h2>
            <p className="text-slate-500 mt-1">Review and edit the extracted data to update compliance rules.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onReset}
              className="mt-4 md:mt-0 px-5 py-2.5 bg-slate-50 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors text-sm"
            >
              Start New Import
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Seller/Exporter</label>
            <input
              type="text"
              value={data.sellerName}
              onChange={(e) => handleFieldChange('sellerName', e.target.value)}
              className="w-full bg-transparent border-b border-slate-300 focus:border-fuchsia-500 px-0 py-1 font-semibold text-lg text-slate-900 outline-none transition-colors"
            />
          </div>
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Buyer/Importer</label>
            <input
              type="text"
              value={data.buyerName}
              onChange={(e) => handleFieldChange('buyerName', e.target.value)}
              className="w-full bg-transparent border-b border-slate-300 focus:border-fuchsia-500 px-0 py-1 font-semibold text-lg text-slate-900 outline-none transition-colors"
            />
          </div>
          <div className="bg-fuchsia-50/50 p-5 rounded-2xl border border-fuchsia-100">
            <label className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-2 block">Origin</label>
            <input
              type="text"
              value={data.originCountry}
              onChange={(e) => handleFieldChange('originCountry', e.target.value)}
              className="w-full bg-transparent border-b border-fuchsia-300 focus:border-fuchsia-600 px-0 py-1 font-bold text-lg text-fuchsia-900 outline-none transition-colors"
            />
          </div>
          <div className="bg-violet-50/50 p-5 rounded-2xl border border-violet-100">
            <label className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2 block">Destination</label>
            <input
              type="text"
              value={data.destinationCountry}
              onChange={(e) => handleFieldChange('destinationCountry', e.target.value)}
              className="w-full bg-transparent border-b border-violet-300 focus:border-violet-600 px-0 py-1 font-bold text-lg text-violet-900 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Products Identified</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/60">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    HS Code
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {data.products.map((product, index) => (
                  <tr key={index} className="hover:bg-fuchsia-50/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-fuchsia-500 outline-none"
                      />
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-2">
                          {/* Render active attributes first */}
                          {(product.attributes || []).map(attr => (
                            <span key={attr} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide cursor-pointer hover:bg-rose-100 hover:text-rose-700"
                              onClick={() => {
                                const newAttrs = (product.attributes || []).filter(a => a !== attr);
                                handleProductChange(index, 'attributes', newAttrs);
                                // Sync legacy isOrganic flag
                                if (attr === 'Organic') handleProductChange(index, 'isOrganic', false);
                              }}
                            >
                              {attr} ×
                            </span>
                          ))}
                          {/* Organic legacy handling */}
                          {product.isOrganic && !(product.attributes?.includes('Organic')) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide cursor-pointer hover:bg-rose-100 hover:text-rose-700"
                              onClick={() => handleProductChange(index, 'isOrganic', false)}
                            >
                              Organic ×
                            </span>
                          )}

                          {/* Add Attribute Dropdown */}
                          <div className="relative group/add">
                            <button className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wide hover:bg-slate-200">
                              + Add
                            </button>
                            <div className="absolute left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 hidden group-hover/add:block p-1">
                              {['Frozen', 'Fresh/Chilled', 'Dried', 'Roasted', 'Organic', 'Fairtrade', 'Halal', 'Kosher', 'Wild Caught', 'Aquaculture', 'Ready-to-Eat'].map(opt => (
                                <button
                                  key={opt}
                                  className="block w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-fuchsia-50 hover:text-fuchsia-600 rounded-lg"
                                  onClick={() => {
                                    const currentAttrs = product.attributes || [];
                                    if (!currentAttrs.includes(opt)) {
                                      const newAttrs = [...currentAttrs, opt];
                                      handleProductChange(index, 'attributes', newAttrs);
                                      if (opt === 'Organic') handleProductChange(index, 'isOrganic', true);
                                    }
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                      <input
                        type="text"
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                        className="w-24 bg-transparent border-b border-dashed border-slate-300 focus:border-fuchsia-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                      <input
                        type="text"
                        value={product.hsCode}
                        onChange={(e) => handleProductChange(index, 'hsCode', e.target.value)}
                        className="w-32 bg-slate-100 rounded px-2 py-1 border border-transparent focus:border-fuchsia-500 focus:bg-white transition-all outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {customFooter ? (
          customFooter
        ) : (
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Draft Documents</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Generate AI-drafted documents based on these details.
              </p>
              <div className="flex space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => onGenerateDocument('Certificate of Origin')}
                  disabled={isGeneratingDoc}
                  className="flex-1 sm:flex-none flex items-center justify-center bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-fuchsia-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isGeneratingDoc ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  ) : (
                    'Cert. of Origin'
                  )}
                </button>
                <button
                  onClick={() => onGenerateDocument('Pro-forma Invoice')}
                  disabled={isGeneratingDoc}
                  className="flex-1 sm:flex-none flex items-center justify-center bg-white border border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isGeneratingDoc ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-400 border-t-slate-800"></div>
                  ) : (
                    'Invoice'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};