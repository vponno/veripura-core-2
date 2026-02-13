
import React, { useEffect, useState } from 'react';
import { Consignment as IotaConsignment } from '../types';
import { Consignment as RichConsignment } from '../services/consignmentService';
import { iotaService } from '../services/iotaService';
import { consignmentService } from '../services/consignmentService';
import { useAuth } from '../contexts/AuthContext';
import { Package, MapPin, Calendar, CheckCircle, Truck, Clock, AlertTriangle, FileCheck } from 'lucide-react';

const SupplyChain: React.FC = () => {
  const { currentUser } = useAuth();
  const [consignments, setConsignments] = useState<RichConsignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsignments = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const addr = localStorage.getItem(`iota_addr_${currentUser.uid}`);
      if (addr) {
        const iotaObjects = await iotaService.getOwnedObjects(addr);
        // Hydrate from Firestore
        const richConsignments = await Promise.all(
          iotaObjects.map(async (obj) => {
            const internalId = obj.fields.internal_id;
            const richData = await consignmentService.getConsignment(internalId);
            if (richData) {
              // Merge IOTA ID with Rich Data
              return { ...richData, iotaId: obj.id } as RichConsignment;
            }
            return null;
          })
        );
        setConsignments(richConsignments.filter((c): c is RichConsignment => c !== null));
      }
    } catch (e) {
      console.error("Failed to fetch supply chain objects", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-slate-500 gap-2">
      <Clock className="animate-spin" /> Loading Supply Chain...
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Supply Chain Tracker</h2>
        <p className="text-slate-500">Real-time object-centric tracking via IOTA.</p>
      </div>

      <div className="space-y-6">
        {consignments.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
            <p className="text-slate-500">No active consignments found for tracking.</p>
          </div>
        ) : consignments.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">ID: {item.id ? item.id.slice(0, 10) : '...'}...</span>
                <h3 className="text-sm font-bold text-slate-700">
                  {item.products && item.products.length > 0 ? item.products[0].name : 'Unknown Product'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Guardian Agent Status Badge */}
                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${item.guardianAgent?.status === 'processing' ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse' :
                    item.guardianAgent?.status === 'waiting_human' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                      'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                  Agent: {item.guardianAgent?.status || 'Active'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                  item.status === 'Archived' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Origin</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    <MapPin size={14} className="text-slate-400" /> {item.exportFrom || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Destination</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    <MapPin size={14} className="text-slate-400" /> {item.importTo || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Last Thought</p>
                  <p className="font-medium text-slate-600 italic text-sm">
                    "{item.guardianAgent?.memory.shortTerm.currentThoughtProcess || 'Monitoring compliance...'}"
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Active Agents</p>
                  <div className="flex gap-1 mt-1">
                    {item.guardianAgent?.subAgents.map(sa => (
                      <span key={sa} className="text-[10px] bg-indigo-50 text-indigo-700 px-1 rounded border border-indigo-100">
                        {sa}
                      </span>
                    )) || <span className="text-slate-400 text-sm">-</span>}
                  </div>
                </div>
              </div>

              {/* Simple Linear Progress Flow based on Status */}
              <div className="relative flex items-center justify-between text-sm">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10" />

                {/* Step 1: Created */}
                <div className="flex flex-col items-center bg-white px-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-4 border-white">
                    <Package size={16} />
                  </div>
                  <span className="mt-2 font-medium text-slate-700">Registered</span>
                </div>

                {/* Step 2: Inspection (Implied if not compliant yet) */}
                <div className="flex flex-col items-center bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${item.status === 'In Progress' || item.status === 'Completed' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'
                    }`}>
                    <AlertTriangle size={16} />
                  </div>
                  <span className="mt-2 text-slate-500">Inspection</span>
                </div>

                {/* Step 3: Transit */}
                <div className="flex flex-col items-center bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${item.status === 'In Progress' || item.status === 'Completed' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'
                    }`}>
                    <Truck size={16} />
                  </div>
                  <span className="mt-2 text-slate-500">Transit</span>
                </div>

                {/* Step 4: Compliant/Delivered */}
                <div className="flex flex-col items-center bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${item.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
                    }`}>
                    <CheckCircle size={16} />
                  </div>
                  <span className="mt-2 text-slate-500">Cleared</span>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplyChain;