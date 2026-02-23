import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { iotaIdentityService } from '../services/iotaIdentityService';
import { 
  Shield, 
  Plus, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  Loader2,
  User,
  Building2,
  Package,
  Award,
  FileCheck,
  AlertCircle
} from 'lucide-react';

const entityTypeIcons: Record<string, any> = {
  farmer: User,
  retailer: Building2,
  product: Package,
  certifier: Award
};

const entityTypeLabels: Record<string, string> = {
  farmer: 'Farmer',
  retailer: 'Retailer', 
  product: 'Product',
  certifier: 'Certifier'
};

const DIDManagement: React.FC = () => {
  const { currentUser, userProfile, createDID, isCreatingDID } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDIDAlias, setNewDIDAlias] = useState('');
  const [newDIDType, setNewDIDType] = useState<'farmer' | 'retailer' | 'product' | 'certifier'>('retailer');
  const [copied, setCopied] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; error?: string } | null>(null);

  const hasDID = userProfile?.iotaDID && userProfile?.didDocumentJson;

  const handleCopyDID = () => {
    if (userProfile?.iotaDID) {
      navigator.clipboard.writeText(userProfile.iotaDID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateDID = async () => {
    if (!newDIDAlias.trim()) return;
    await createDID(newDIDAlias, newDIDType);
    setShowCreateForm(false);
    setNewDIDAlias('');
  };

  const handleVerifyCredential = async () => {
    if (!userProfile?.didDocumentJson) return;
    const result = await iotaIdentityService.verifyCredential(userProfile.didDocumentJson);
    setVerificationResult(result);
    setTimeout(() => setVerificationResult(null), 5000);
  };

  if (!currentUser) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">IOTA Identity (DID)</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {!hasDID ? (
          <div className="text-center py-6">
            <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">
              Create a Decentralized Identifier (DID) to anchor your identity on the IOTA Tangle
            </p>
            
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                Create DID
              </button>
            ) : (
              <div className="max-w-sm mx-auto space-y-3 text-left">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name / Alias</label>
                  <input
                    type="text"
                    value={newDIDAlias}
                    onChange={(e) => setNewDIDAlias(e.target.value)}
                    placeholder="e.g., My Farm, GreenCo Ltd"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Entity Type</label>
                  <select
                    value={newDIDType}
                    onChange={(e) => setNewDIDType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="retailer">Retailer</option>
                    <option value="product">Product</option>
                    <option value="certifier">Certifier</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateDID}
                    disabled={isCreatingDID || !newDIDAlias.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {isCreatingDID ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create DID
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* DID Display */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase">Your DID</span>
                {userProfile.didPublished && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    On-Chain
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-slate-800 break-all">
                  {userProfile.iotaDID}
                </code>
                <button
                  onClick={handleCopyDID}
                  className="p-2 hover:bg-slate-200 rounded-lg transition"
                  title="Copy DID"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                </button>
              </div>
            </div>

            {/* Transaction Info */}
            {userProfile.didPublishTxId && (
              <div className="bg-slate-50 rounded-lg p-4">
                <span className="text-xs font-medium text-slate-500 uppercase block mb-2">Publication Transaction</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-slate-600 break-all">
                    {userProfile.didPublishTxId.substring(0, 40)}...
                  </code>
                  {userProfile.didExplorerUrl && (
                    <a
                      href={userProfile.didExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-200 rounded-lg transition"
                      title="View on Explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-indigo-600" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Verification */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyCredential}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition"
              >
                <FileCheck className="w-4 h-4" />
                Verify DID
              </button>
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                verificationResult.valid 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {verificationResult.valid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {verificationResult.valid ? 'DID Verified Successfully' : verificationResult.error}
                </span>
              </div>
            )}

            {/* DID Document Preview */}
            {userProfile.didDocumentJson && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  View DID Document
                </summary>
                <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto max-h-48">
                  {JSON.stringify(JSON.parse(userProfile.didDocumentJson), null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DIDManagement;
