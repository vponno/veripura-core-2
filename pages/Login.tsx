import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Truck, Package, ArrowRight, Wallet } from 'lucide-react';

const Login: React.FC = () => {
    const { signInWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
            // Note: SignInWithRedirect will reload the page, so navigation happens after redirect
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
        <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center space-y-8">

                {/* Logo & Brand */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-100">
                        <span className="font-bold text-3xl text-white">V</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">VeriPura</h1>
                    <p className="text-slate-500 mt-2">Digital Product Passport on IOTA</p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <Truck className="text-primary mb-2" size={24} />
                        <h3 className="font-semibold text-slate-900 text-sm">Traceability</h3>
                        <p className="text-xs text-slate-500">Track from farm to fork</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <Wallet className="text-primary mb-2" size={24} />
                        <h3 className="font-semibold text-slate-900 text-sm">IOTA Wallet</h3>
                        <p className="text-xs text-slate-500">Non-custodial identity</p>
                    </div>
                </div>

                {/* Login Button */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <button
                        onClick={handleLogin}
                        className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-fuchsia-200 flex items-center justify-center gap-3 group"
                    >
                        <img
                            src="https://www.google.com/favicon.ico"
                            alt="Google"
                            className="w-5 h-5 bg-white rounded-full p-0.5"
                        />
                        Sign in with Google
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-xs text-slate-400">
                        Secure authentication powered by Firebase & IOTA
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
