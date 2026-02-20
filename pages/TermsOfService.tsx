import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-fuchsia-900 to-primary text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck className="w-8 h-8 text-fuchsia-200" />
                        <h1 className="text-2xl font-bold">Terms of Service</h1>
                    </div>
                    <p className="text-fuchsia-100">
                        Please review our terms regarding AI-generated compliance analysis.
                    </p>
                </div>

                <div className="p-10 space-y-8 text-slate-700">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                            Disclaimer: AI-Generated Analysis
                        </h2>
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                            <p className="font-medium text-amber-900 mb-2">
                                ⚠️ Verify with certified professionals before use.
                            </p>
                            <p className="text-amber-800">
                                VeriPura Core provides automated compliance assistance based on available data and AI analysis.
                                However, this <strong>does not replace legal, regulatory, or custom brokerage advice</strong>.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">1. Nature of Services</h3>
                        <p>
                            VeriPura Core utilizes advanced artificial intelligence to analyze document data and suggest compliance roadmaps.
                            While we strive for accuracy, international trade regulations are complex and subject to frequent change.
                            The output provided by VeriPura Core should be used as a support tool, not as the sole basis for critical business decisions.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">2. Limitation of Liability</h3>
                        <p>
                            By using this service, you acknowledge that VeriPura Core is not liable for any delays, fines, or penalties
                            incurred due to reliance on AI-generated analysis. Final verification of all shipping documents and
                            compliance requirements remains the responsibility of the exporter/importer of record.
                        </p>
                    </section>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-2 bg-white text-slate-700 border border-slate-300 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                </div>
            </div>

            <footer className="mt-8 text-center text-xs text-slate-400">
                &copy; 2026 VeriPura&trade; Core | <span className="text-primary">www.veripura.com</span>
            </footer>
        </div>
    );
};

export default TermsOfService;
