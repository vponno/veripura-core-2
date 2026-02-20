import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Truck, Package, ArrowRight, Wallet, ShieldCheck, Zap, Globe, Leaf, FileCheck, Bot } from 'lucide-react';

const Login: React.FC = () => {
    const { signInWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    React.useEffect(() => {
        if (currentUser) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-fuchsia-50 flex flex-col">

            {/* Navbar / Header */}
            <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">

                <div className="flex items-center gap-3">
                    <img
                        src="/logo.png"
                        alt="VeriPura Core Logo"
                        className="h-10 w-auto hue-rotate-[290deg] saturate-200 invert-[.18] sepia-[.96] saturate-[46.45] brightness-[.97] contrast-[1.18]"
                        style={{ filter: "invert(27%) sepia(51%) saturate(2878%) hue-rotate(275deg) brightness(104%) contrast(97%)" }}
                    />
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full">

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                    <Zap size={14} className="fill-current" />
                    Powered by IOTA MoveVM
                </div>

                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
                    The Future of <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-600">
                        Demand-Driven Supply
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Orchestrate global trade with AI Guardians and on-chain settlement.
                    From compliance to carbon, ensure every consignment is verified.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto mb-16">
                    <button
                        onClick={handleLogin}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-3"
                    >
                        <img
                            src="https://www.google.com/favicon.ico"
                            alt="Google"
                            className="w-5 h-5 bg-white rounded-full p-0.5"
                        />
                        Sign in with Google
                    </button>
                    <button
                        onClick={() => window.open('https://veripura.com', '_blank')}
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 px-8 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-3"
                    >
                        Documentation
                    </button>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left w-full">
                    <FeatureCard
                        icon={<FileCheck className="text-primary" size={24} />}
                        title="Intelligent Document Validation"
                        description="Real-time structural and regulatory analysis of every uploaded trade document."
                    />
                    <FeatureCard
                        icon={<Bot className="text-emerald-500" size={24} />}
                        title="Agentic Dossier Building"
                        description="Autonomous agents compile, organize, and verify complete consignment dossiers."
                    />
                    <FeatureCard
                        icon={<Wallet className="text-purple-500" size={24} />}
                        title="Instant Settlement"
                        description="Smart contracts trigger stablecoin payments upon confirmed delivery."
                    />
                    <FeatureCard
                        icon={<Leaf className="text-green-500" size={24} />}
                        title="Sustainability Verified"
                        description="Carbon footprint calculation and deforestation-free verification."
                    />
                </div>
            </main>

            <footer className="p-6 text-center text-slate-400 text-sm border-t border-slate-100 mt-12 bg-white">
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

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-4 bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100">
            {icon}
        </div>
        <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
);

export default Login;
