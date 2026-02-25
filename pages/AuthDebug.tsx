import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/lib/firebase';
import { iotaService } from '../services/iotaService';
import { Wallet, User, LogOut, Copy, ExternalLink, ShieldCheck, Coins, AlertTriangle, Key, Eye, EyeOff } from 'lucide-react';
import DIDManagement from '../components/DIDManagement';
import IOTATransactionHistory from '../components/IOTATransactionHistory';

const WalletProfile: React.FC = () => {
    const { currentUser, userProfile, logout, error, balance, refreshBalance } = useAuth();
    const [requestingTokens, setRequestingTokens] = useState(false);
    const [showPrivateKey, setShowPrivateKey] = useState(false);

    // Import State
    const [showImportInput, setShowImportInput] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);

    const iotaAddress = userProfile?.iotaAddress || null;

    const handleCopyAddress = () => {
        if (iotaAddress) {
            navigator.clipboard.writeText(iotaAddress);
            alert("Address copied to clipboard!");
        }
    };

    const handleTopUp = async () => {
        if (!iotaAddress) return;
        setRequestingTokens(true);
        try {
            await iotaService.requestTokens(iotaAddress);
            alert("Tokens requested! It may take a few seconds to reflect.");
            setTimeout(() => refreshBalance(), 3000); // Poll after 3s
        } catch (e: any) {
            alert("Faucet request failed: " + e.message);
        } finally {
            setRequestingTokens(false);
        }
    };

    if (!currentUser) return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <p>Please sign in to view your wallet.</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <User size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Wallet & Identity</h1>
                    <p className="text-slate-500">Manage your identity and digital wallet.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                    <ShieldCheck size={16} />
                    {error}
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-400">
                        {currentUser.displayName ? currentUser.displayName[0] : currentUser.email![0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{currentUser.displayName || "User"}</h2>
                        <p className="text-slate-500 text-sm">{currentUser.email}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 font-medium">
                            <ShieldCheck size={12} className="text-slate-400" />
                            <span>Identity Verified</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors text-sm font-medium"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>

            {/* Wallet Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
                    {/* Balance Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300">
                            <Wallet size={20} />
                            <span className="text-sm font-medium tracking-wide">IOTA TESTNET WALLET</span>
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold font-mono">
                                {balance === null ? '...' : (balance / 1000000000).toFixed(6)}
                                <span className="text-lg text-slate-400 ml-2">IOTA</span>
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">Available Balance</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleTopUp}
                                disabled={requestingTokens}
                                className="px-4 py-2 bg-primary hover:bg-fuchsia-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-70"
                            >
                                <Coins size={16} />
                                {requestingTokens ? 'Requesting...' : 'Get Testnet Tokens'}
                            </button>
                            <a
                                href={`https://explorer.iota.org/address/${iotaAddress}?network=testnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                            >
                                <ExternalLink size={16} />
                                Explorer
                            </a>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="md:w-1/2 space-y-4 bg-white/5 p-4 rounded-lg border border-white/10 self-center">
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-semibold">Wallet Address</label>
                            <div className="flex items-start gap-2 mt-1">
                                <code className="text-xs font-mono text-slate-200 break-all leading-relaxed bg-black/20 p-2 rounded w-full">
                                    {iotaAddress || "Generating Wallet..."}
                                </code>
                                <button
                                    onClick={handleCopyAddress}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded text-slate-300 hover:text-white transition-colors"
                                    title="Copy Address"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Private Key Reveal Section */}
                        <div className="pt-2 border-t border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1">
                                    Private Key
                                    <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 py-0.5 rounded ml-2 border border-rose-500/30">
                                        Device Only
                                    </span>
                                </label>
                                <button
                                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                                    className="text-[10px] font-bold text-fuchsia-300 hover:text-white underline decoration-fuchsia-300/50 hover:decoration-white transition-all select-none"
                                >
                                    {showPrivateKey ? "Hide Key" : "Reveal Key"}
                                </button>
                            </div>

                            {showPrivateKey ? (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    <div className="bg-rose-950/30 border border-rose-900/50 rounded p-2 flex items-start gap-2">
                                        <div className="p-1 bg-rose-500/10 rounded">
                                            <AlertTriangle size={12} className="text-rose-400" />
                                        </div>
                                        <p className="text-[10px] text-rose-200/80 leading-tight">
                                            <strong>Warning:</strong> clear your cache or lose this device, and this wallet is gone forever.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-[10px] font-mono text-fuchsia-200/80 break-all bg-black/20 p-2 rounded border border-white/5">
                                            {localStorage.getItem(`iota_sk_${currentUser.uid}`) || "Key not found"}
                                        </code>
                                        <button
                                            onClick={() => {
                                                const key = localStorage.getItem(`iota_sk_${currentUser.uid}`);
                                                if (key) {
                                                    navigator.clipboard.writeText(key);
                                                    alert("Private Key copied to clipboard. Paste it somewhere safe!");
                                                }
                                            }}
                                            className="p-2 bg-white/10 hover:bg-rose-500/20 rounded text-slate-300 hover:text-rose-300 transition-colors border border-transparent hover:border-rose-500/30"
                                            title="Copy Private Key"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-8 bg-black/20 rounded border border-white/5 flex items-center justify-center">
                                    <span className="text-[10px] text-slate-500 font-mono">••••••••••••••••••••••••••••••••••</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 text-right">
                            <a
                                href="#/backup-wallet" // Kept for legacy flow, but strictly less useful now
                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                Open Backup Wizard →
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Wallet Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Key size={20} className="text-slate-400" />
                    Import Existing Wallet
                </h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 mb-3">
                        If you already have an IOTA Testnet wallet (e.g. from the CLI or another device), paste the private key details here to restore access.
                    </p>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showImportInput ? "text" : "password"}
                                    placeholder="iotaprivkey..."
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
                                    id="import-key-input"
                                    onChange={() => setImportStatus(null)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowImportInput(!showImportInput)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showImportInput ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <button
                                onClick={async () => {
                                    const input = document.getElementById('import-key-input') as HTMLInputElement;
                                    const key = input.value.trim();
                                    if (!key.startsWith('iotaprivkey') && !key.startsWith('suiprivkey')) {
                                        setImportStatus("Invalid Key Format. Must start with 'iotaprivkey' or 'suiprivkey'.");
                                        return;
                                    }

                                    try {
                                        await updateDoc(doc(db, 'users', currentUser.uid), {
                                            iotaPrivateKey: key,
                                        });
                                        localStorage.setItem(`iota_sk_${currentUser.uid}`, key);
                                        setImportStatus("SUCCESS");
                                        input.value = ""; // Clear input
                                        setTimeout(() => window.location.reload(), 1000); // Reload after 1s
                                    } catch (e: any) {
                                        setImportStatus("Failed to import: " + e.message);
                                    }
                                }}
                                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
                            >
                                Import Key
                            </button>
                        </div>
                        {importStatus && (
                            <p className={`text-xs font-medium ${importStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {importStatus === 'SUCCESS' ? '✅ Wallet imported successfully! Reloading...' : importStatus}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* DID Management */}
            <DIDManagement />

            {/* IOTA Transaction History */}
            <IOTATransactionHistory maxItems={20} showDetails={true} />

        </div>
    );
};

export default WalletProfile;
