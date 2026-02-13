import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/lib/firebase';
import { AlertTriangle, Copy, Download, CheckCircle } from 'lucide-react';

const WalletBackup: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [acknowledged, setAcknowledged] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (currentUser) {
            // 1. Get Private Key
            const sk = localStorage.getItem(`iota_sk_${currentUser.uid}`);
            setPrivateKey(sk);

            // 2. Check if already backed up
            const checkStatus = async () => {
                const docRef = doc(db, 'users', currentUser.uid);
                const snap = await getDoc(docRef);
                if (snap.exists() && snap.data().isWalletBackedUp) {
                    setAcknowledged(true); // Auto-check the box
                }
            };
            checkStatus();
        }
    }, [currentUser, navigate]);

    const handleCopy = () => {
        if (privateKey) {
            navigator.clipboard.writeText(privateKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!privateKey) return;
        const element = document.createElement("a");
        const file = new Blob([privateKey], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "iota_private_key.txt";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    };

    const handleContinue = async () => {
        if (!currentUser || !acknowledged) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                isWalletBackedUp: true
            });
            navigate('/');
        } catch (e) {
            console.error(e);
            alert("Failed to update status. Please try again.");
        }
        setLoading(false);
    };

    if (!currentUser) return <div className="p-10">Please log in first.</div>;
    if (!privateKey) return <div className="p-10">No wallet found. Please logout and login again to generate one.</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-xl shadow-lg overflow-hidden">
                <div className="bg-amber-500 p-6 text-white text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                    <h1 className="text-2xl font-bold">Action Required</h1>
                    <p className="opacity-90">Backup your IOTA Private Key</p>
                </div>

                <div className="p-8 space-y-6">
                    <p className="text-gray-600 text-center">
                        Your IOTA wallet has been created. For security, your private key is <strong>only stored in this browser</strong>.
                        You MUST save it now, or you will lose access to your funds if you clear your cache.
                    </p>

                    <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Your Private Key</label>
                        <code className="block break-all text-sm font-mono text-slate-700 bg-white p-3 rounded mb-4">
                            {privateKey}
                        </code>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCopy}
                                className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 py-2 rounded hover:bg-slate-50 transition"
                            >
                                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 py-2 rounded hover:bg-slate-50 transition"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                        <input
                            type="checkbox"
                            id="ack"
                            checked={acknowledged}
                            onChange={(e) => setAcknowledged(e.target.checked)}
                            className="mt-1"
                        />
                        <label htmlFor="ack" className="cursor-pointer select-none">
                            I confirm that I have securely saved my private key. I understand that VeriPura cannot recover this key for me.
                        </label>
                    </div>

                    <button
                        onClick={handleContinue}
                        disabled={!acknowledged || loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {loading ? 'Processing...' : 'Continue to App'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WalletBackup;
