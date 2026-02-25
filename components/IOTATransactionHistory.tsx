import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { iotaService } from '../services/iotaService';
import {
  Link2,
  FileText,
  Shield,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Hash,
  ArrowRightLeft,
  CheckCircle,
  Loader2,
  Wallet,
  Plus
} from 'lucide-react';

export interface IOTATransaction {
  id: string;
  type: 'document_anchor' | 'merkle_root' | 'consignment' | 'did_publish' | 'credential_anchor' | 'wallet_create' | 'token_transfer';
  timestamp: string;
  digest: string;
  explorerUrl: string;
  description: string;
  status: 'confirmed' | 'pending' | 'failed';
  cost?: string;
  amount?: number;
  sender?: string;
  recipients?: string[];
  timestampISO?: string;
  metadata?: Record<string, any>;
}

interface TransactionHistoryProps {
  maxItems?: number;
  showDetails?: boolean;
}

const IOTATransactionHistory: React.FC<TransactionHistoryProps> = ({
  maxItems = 20,
  showDetails = true
}) => {
  const { currentUser, userProfile } = useAuth();
  const [transactions, setTransactions] = useState<IOTATransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && userProfile?.iotaAddress) {
      loadTransactionHistory();
    }
  }, [currentUser, userProfile?.iotaAddress]);

  const loadTransactionHistory = async () => {
    if (!currentUser || !userProfile?.iotaAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const txHistory: IOTATransaction[] = [];

    try {
      const address = userProfile.iotaAddress;

      // 1. Wallet creation (initial account creation)
      txHistory.push({
        id: `wallet_create_${currentUser.uid}`,
        type: 'wallet_create',
        timestamp: userProfile.createdAt || new Date().toISOString(),
        digest: address,
        explorerUrl: `https://explorer.rebased.iota.org/address/${address}?network=testnet`,
        description: 'IOTA Wallet Created',
        status: 'confirmed',
        sender: address,
        recipients: []
      });

      // 2. Fetch REAL transaction history from IOTA
      const realTransactions = await iotaService.getTransactionHistory(address, maxItems);

      console.log('[IOTA History] Real transactions:', realTransactions);

      // Transform real IOTA transactions to our format
      for (const tx of realTransactions) {
        const isSender = tx.sender?.toLowerCase() === address.toLowerCase();

        // Determine transaction type based on object changes
        let txType: IOTATransaction['type'] = 'token_transfer';
        let description = 'Token Transfer';

        // Analyze object changes to determine transaction type
        if (tx.objectChanges && tx.objectChanges.length > 0) {
          const hasConsignment = tx.objectChanges.some((c: any) =>
            c.objectType?.includes('Consignment')
          );

          if (hasConsignment) {
            txType = 'consignment';
            description = 'Consignment Registered';
          } else if (tx.objectChanges.some((c: any) => c.type === 'created')) {
            // Check what was created
            const createdTypes = tx.objectChanges
              .filter((c: any) => c.type === 'created')
              .map((c: any) => c.objectType);

            if (createdTypes.some((t: string) => t?.includes('Consignment'))) {
              txType = 'consignment';
              description = 'Consignment Created';
            }
          }
        }

        txHistory.push({
          id: tx.digest,
          type: txType,
          timestamp: tx.timestampISO,
          digest: tx.digest,
          explorerUrl: `https://explorer.rebased.iota.org/txblock/${tx.digest}?network=testnet`,
          description: description,
          status: 'confirmed',
          sender: tx.sender,
          recipients: tx.recipients,
          amount: tx.amount, // Real amount from service
          timestampISO: tx.timestampISO,
          metadata: {
            objectChanges: tx.objectChanges,
            sender: tx.sender,
            recipients: tx.recipients
          }
        });
      }

      // 3. Add DID publish if exists
      if (userProfile.didPublishTxId) {
        txHistory.push({
          id: `did_publish_${userProfile.iotaDID}`,
          type: 'did_publish',
          timestamp: new Date().toISOString(),
          digest: userProfile.didPublishTxId,
          explorerUrl: userProfile.didExplorerUrl || `https://explorer.rebased.iota.org/txblock/${userProfile.didPublishTxId}?network=testnet`,
          description: 'DID Document Published to IOTA Tangle',
          status: 'confirmed',
          sender: address,
          metadata: {
            did: userProfile.iotaDID
          }
        });
      }

    } catch (error) {
      console.error('[IOTA History] Error loading history:', error);
    }

    // Sort by timestamp (newest first)
    txHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setTransactions(txHistory.slice(0, maxItems));
    setLoading(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'document_anchor':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'merkle_root':
        return <Link2 className="w-4 h-4 text-purple-600" />;
      case 'did_publish':
        return <Shield className="w-4 h-4 text-indigo-600" />;
      case 'credential_anchor':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'consignment':
        return <Package className="w-4 h-4 text-orange-600" />;
      case 'token_transfer':
        return <ArrowRightLeft className="w-4 h-4 text-slate-600" />;
      case 'wallet_create':
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      default:
        return <Hash className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      document_anchor: 'Document Anchor',
      merkle_root: 'Merkle Root',
      did_publish: 'DID Publish',
      credential_anchor: 'Credential Anchor',
      consignment: 'Consignment',
      token_transfer: 'Transfer',
      wallet_create: 'Wallet Created'
    };
    return labels[type] || type;
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">IOTA Transaction History</h3>
          <span className="ml-auto bg-white/20 text-white text-xs px-2 py-1 rounded-full">
            {transactions.length} on-chain
          </span>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="p-8 text-center">
          <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-600">No transactions yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Anchoring documents or creating identities will appear here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {transactions.map((tx) => (
            <div key={tx.id} className="hover:bg-slate-50 transition-colors">
              {/* Main Row */}
              <div
                className="px-4 py-3 flex items-center gap-3 cursor-pointer"
                onClick={() => showDetails && setExpandedTx(expandedTx === tx.id ? null : tx.id)}
              >
                <div className="p-2 bg-slate-100 rounded-lg">
                  {getTransactionIcon(tx.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 text-sm">
                        {tx.description}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : tx.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                        {tx.status}
                      </span>
                    </div>

                    {tx.amount !== undefined && tx.amount !== 0 && (
                      <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{(tx.amount / 1000000000).toFixed(4)} IOTA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{getTypeLabel(tx.type)}</span>
                    <span>•</span>
                    <span>{formatTimestamp(tx.timestamp)}</span>
                  </div>
                </div>

                {showDetails && (
                  expandedTx === tx.id ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )
                )}
              </div>

              {/* Expanded Details */}
              {showDetails && expandedTx === tx.id && (
                <div className="px-4 pb-3 pt-0 bg-slate-50">
                  <div className="space-y-2 text-sm">
                    {tx.digest && (
                      <div className="flex items-start gap-2">
                        <Hash className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-slate-500 text-xs">Transaction ID</span>
                          <code className="block text-xs font-mono text-slate-700 break-all">
                            {tx.digest}
                          </code>
                        </div>
                      </div>
                    )}

                    {tx.sender && (
                      <div className="flex items-start gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-slate-500 text-xs">From</span>
                          <code className="block text-xs font-mono text-slate-700 break-all">
                            {tx.sender}
                          </code>
                        </div>
                      </div>
                    )}

                    {tx.recipients && tx.recipients.length > 0 && (
                      <div className="flex items-start gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0 rotate-180" />
                        <div className="flex-1">
                          <span className="text-slate-500 text-xs">To</span>
                          <code className="block text-xs font-mono text-slate-700 break-all">
                            {tx.recipients.join(', ')}
                          </code>
                        </div>
                      </div>
                    )}

                    {tx.explorerUrl && (
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on IOTA Explorer
                      </a>
                    )}

                    {tx.metadata && tx.metadata.objectChanges && tx.metadata.objectChanges.length > 0 && (
                      <div className="mt-2">
                        <span className="text-slate-500 text-xs">On-Chain Changes ({tx.metadata.objectChanges.length})</span>
                        <div className="mt-1 space-y-1">
                          {tx.metadata.objectChanges.slice(0, 5).map((change: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <span className={`px-1.5 py-0.5 rounded ${change.type === 'created' ? 'bg-green-100 text-green-700' :
                                change.type === 'modified' ? 'bg-blue-100 text-blue-700' :
                                  change.type === 'transferred' ? 'bg-purple-100 text-purple-700' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                {change.type}
                              </span>
                              <span className="text-slate-600 font-mono truncate">
                                {change.objectId?.substring(0, 20)}...
                              </span>
                            </div>
                          ))}
                          {tx.metadata.objectChanges.length > 5 && (
                            <p className="text-xs text-slate-500">
                              +{tx.metadata.objectChanges.length - 5} more changes
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {transactions.length > 0 && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {transactions.filter(t => t.type !== 'wallet_create').length} on-chain transactions
            </span>
            <a
              href={`https://explorer.rebased.iota.org/address/${userProfile?.iotaAddress}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
            >
              View Full History
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for imports
const Package = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export default IOTATransactionHistory;
