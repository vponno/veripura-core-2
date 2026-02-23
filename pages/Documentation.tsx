import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Eye, ArrowLeftRight, Bell, Link2, FileSearch,
    CheckCircle2, AlertTriangle, Globe, Leaf, Bot, Lock,
    ArrowLeft, Zap, Layers, BarChart3, FileCheck
} from 'lucide-react';

const Documentation: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-fuchsia-50">

            {/* Header */}
            <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/login')}>
                    <img
                        src="/logo.png"
                        alt="VeriPura Core Logo"
                        className="h-10 w-auto"
                        style={{ filter: "invert(27%) sepia(51%) saturate(2878%) hue-rotate(275deg) brightness(104%) contrast(97%)" }}
                    />
                </div>
                <button
                    onClick={() => navigate('/login')}
                    className="text-sm text-slate-600 hover:text-primary transition-colors font-medium flex items-center gap-1"
                >
                    <ArrowLeft size={16} /> Back to Login
                </button>
            </header>

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-6 pt-8 pb-16 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                    <FileCheck size={14} className="fill-current" />
                    Platform Documentation
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                    How VeriPura <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-600">Works</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    VeriPura Core is an AI-powered compliance and document management platform for global trade.
                    It continuously monitors your consignment dossier, validates documents in real-time,
                    and anchors every verification to an immutable blockchain ledger.
                </p>
            </section>

            {/* Guardian AI Section */}
            <section className="max-w-6xl mx-auto px-6 pb-16">
                <SectionTitle
                    icon={<Bot className="text-fuchsia-600" size={28} />}
                    title="Guardian AI — Your Compliance Co-Pilot"
                    subtitle="An intelligent agent that watches over your entire consignment lifecycle."
                />

                <div className="grid md:grid-cols-2 gap-8 mt-10">
                    <FeatureCard
                        icon={<Eye className="text-blue-600" size={24} />}
                        color="bg-blue-50 border-blue-100"
                        title="Constant Monitoring"
                        description="Your Guardian AI continuously monitors every document in your consignment dossier. Each time a new document is uploaded or an existing document changes, the entire dossier is re-evaluated against the latest regulatory requirements for your specific trade route."
                    />
                    <FeatureCard
                        icon={<ArrowLeftRight className="text-purple-600" size={24} />}
                        color="bg-purple-50 border-purple-100"
                        title="Forward & Backward Validation"
                        description="Every document is validated in both directions — backward against previously uploaded documents for consistency, and forward against what is still required. This means a newly uploaded Certificate of Origin is checked against your existing Invoice, Packing List, and Bill of Lading for logical coherence across the entire dossier."
                    />
                    <FeatureCard
                        icon={<Layers className="text-indigo-600" size={24} />}
                        color="bg-indigo-50 border-indigo-100"
                        title="Intelligent Document Understanding"
                        description="VeriPura doesn't just read text — it understands context. Using advanced document intelligence, the platform extracts key fields, recognizes document types automatically, and identifies discrepancies that would take human reviewers hours to catch. Handwritten amendments, mismatched quantities, and route inconsistencies are all flagged instantly."
                    />
                    <FeatureCard
                        icon={<Shield className="text-emerald-600" size={24} />}
                        color="bg-emerald-50 border-emerald-100"
                        title="Self-Correcting Workflows"
                        description="When a document reveals a discrepancy — for example, a Bill of Lading showing a different destination than expected — the Guardian AI doesn't just flag it. It proposes a resolution, updates the compliance roadmap, and re-validates all affected documents automatically. One correction cascades through the entire dossier."
                    />
                </div>
            </section>

            {/* Smart Alerting Section */}
            <section className="max-w-6xl mx-auto px-6 pb-16">
                <SectionTitle
                    icon={<Bell className="text-orange-500" size={28} />}
                    title="Smart Alerting"
                    subtitle="Know exactly what needs attention, when it needs attention, and why."
                />

                <div className="grid md:grid-cols-3 gap-6 mt-10">
                    <AlertCard
                        level="GREEN"
                        levelColor="bg-emerald-100 text-emerald-700 border-emerald-200"
                        icon={<CheckCircle2 size={20} className="text-emerald-600" />}
                        title="Validated"
                        description="Document passes all checks. No discrepancies detected. Automatically approved and added to your compliant dossier."
                    />
                    <AlertCard
                        level="YELLOW"
                        levelColor="bg-amber-100 text-amber-700 border-amber-200"
                        icon={<AlertTriangle size={20} className="text-amber-600" />}
                        title="Requires Review"
                        description="Potential issues detected — such as handwritten amendments, minor discrepancies, or certification warnings. Routed to a human reviewer for final decision."
                    />
                    <AlertCard
                        level="RED"
                        levelColor="bg-red-100 text-red-700 border-red-200"
                        icon={<AlertTriangle size={20} className="text-red-600" />}
                        title="Rejected"
                        description="Critical issues found — tampering indicators, route mismatches, or regulatory non-compliance. Immediate action required with clear guidance on remediation."
                    />
                </div>

                <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <BarChart3 size={20} className="text-slate-400" />
                        Real-Time Compliance Dashboard
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                        Your dashboard provides a live overview of all active consignments, their completion percentage,
                        and which documents require attention. Email alerts are automatically sent when documents are flagged,
                        ensuring your compliance team never misses a critical action item — even when they're not logged in.
                    </p>
                </div>
            </section>

            {/* IOTA Blockchain Section */}
            <section className="max-w-6xl mx-auto px-6 pb-16">
                <SectionTitle
                    icon={<Link2 className="text-cyan-600" size={28} />}
                    title="Blockchain-Verified Trust"
                    subtitle="Every document verification is permanently anchored to the IOTA distributed ledger."
                />

                <div className="grid md:grid-cols-2 gap-8 mt-10">
                    <FeatureCard
                        icon={<Lock className="text-cyan-600" size={24} />}
                        color="bg-cyan-50 border-cyan-100"
                        title="Immutable Document Proof"
                        description="When a document is validated, a cryptographic fingerprint (hash) of the encrypted file is permanently recorded on the IOTA blockchain. This creates tamper-proof evidence that a specific document existed in a specific state at a specific time. No one — not even VeriPura — can alter this record."
                    />

                    <FeatureCard
                        icon={<Globe className="text-blue-600" size={24} />}
                        color="bg-blue-50 border-blue-100"
                        title="Public Verification"
                        description="Every blockchain transaction is publicly verifiable on the IOTA Explorer. Trade partners, customs authorities, and auditors can independently verify the authenticity and timing of any document without requiring access to VeriPura. Trust without dependency."
                    />

                </div>
            </section>

            {/* Security Section */}
            <section className="max-w-6xl mx-auto px-6 pb-16">
                <SectionTitle
                    icon={<Shield className="text-rose-500" size={28} />}
                    title="Enterprise-Grade Security"
                    subtitle="Your trade documents are protected with military-grade encryption at every layer."
                />

                <div className="grid md:grid-cols-3 gap-6 mt-10">
                    <MiniCard
                        icon={<Lock size={20} className="text-slate-600" />}
                        title="AES-256 Encryption"
                        description="Every uploaded document is encrypted with a unique key before storage. Documents are never stored in plaintext."
                    />
                    <MiniCard
                        icon={<Shield size={20} className="text-slate-600" />}
                        title="Zero-Knowledge Design"
                        description="Only the consignment owner holds the decryption key. VeriPura cannot read your documents at rest."
                    />
                    <MiniCard
                        icon={<Globe size={20} className="text-slate-600" />}
                        title="GDPR Compliant"
                        description="Data sovereignty and privacy by design. Your documents, your control, your jurisdiction."
                    />
                </div>
            </section>

            {/* Sustainability */}
            <section className="max-w-6xl mx-auto px-6 pb-16">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 md:p-12 border border-emerald-100">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <Leaf className="text-emerald-600" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-3">Sustainability at the Core</h2>
                            <p className="text-slate-600 leading-relaxed max-w-3xl">
                                VeriPura is designed to support sustainable trade practices. The platform can verify
                                deforestation-free sourcing certificates, organic certifications, carbon footprint declarations,
                                and environmental compliance documents across all major global standards — including
                                EU Deforestation Regulation (EUDR), USDA NOP, JAS, COR, and more. Every verification
                                is backed by the same Guardian AI and blockchain-anchored proof system.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Transform Your Trade Compliance?</h2>
                <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                    Start verifying your consignment documents with AI-powered intelligence and blockchain-backed proof.
                </p>
                <button
                    onClick={() => navigate('/login')}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 inline-flex items-center gap-3"
                >
                    Get Started
                    <ArrowLeft size={18} className="rotate-180" />
                </button>
            </section>

            {/* Footer */}
            <footer className="p-6 text-center text-slate-400 text-sm border-t border-slate-100 bg-white">
                <div className="flex justify-center gap-6 mb-3">
                    <a href="https://www.linkedin.com/company/veripura/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">LinkedIn</a>
                    <a href="https://www.instagram.com/veri.pura/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Instagram</a>
                    <a href="https://x.com/VeriPura" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">X</a>
                </div>
                &copy; 2026 VeriPura&trade; Core | <span className="text-primary hover:underline cursor-pointer" onClick={() => navigate('/terms')}>Terms of Service</span> | <a href="https://www.veripura.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.veripura.com</a>
            </footer>
        </div>
    );
};

// --- Sub-Components ---

const SectionTitle = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
    <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4">
            {icon}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">{subtitle}</p>
    </div>
);

const FeatureCard = ({ icon, color, title, description }: { icon: React.ReactNode; color: string; title: string; description: string }) => (
    <div className={`p-6 rounded-2xl border ${color} hover:shadow-md transition-shadow`}>
        <div className="mb-4 w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-100">
            {icon}
        </div>
        <h3 className="font-bold text-slate-900 mb-2 text-lg">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
);

const AlertCard = ({ level, levelColor, icon, title, description }: { level: string; levelColor: string; icon: React.ReactNode; title: string; description: string }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
            {icon}
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${levelColor}`}>{level}</span>
        </div>
        <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
);

const MiniCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
        <div className="mb-3 w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100">
            {icon}
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
);

export default Documentation;
