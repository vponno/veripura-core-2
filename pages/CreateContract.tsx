import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { iotaService } from '../services/iotaService';
import { Package, Truck, DollarSign, User, ShieldCheck, Loader2, Save } from 'lucide-react';

const PRODUCTS = ['Coffee', 'Cocoa', 'Soy', 'Rubber', 'Wood', 'Cattle', 'Rice', 'Tea'];

const CreateContract: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        product: 'Coffee',
        quantity: '',
        price: '',
        buyerAddress: '',
        destination: 'Germany'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateContract = async (mode: 'draft' | 'onchain') => {
        if (!currentUser) return;
        if (!formData.quantity || !formData.price || !formData.buyerAddress) {
            alert("Please fill in all required fields.");
            return;
        }

        setLoading(true);
        try {
            const privateKey = localStorage.getItem(`iota_sk_${currentUser.uid}`);
            if (mode === 'onchain' && !privateKey) {
                throw new Error("No wallet found. Please logout and login again.");
            }

            console.log(`Creating ${mode} contract...`);

            if (mode === 'onchain' && privateKey) {
                const result = await iotaService.createSupplyContract(privateKey, {
                    sellerName: currentUser.displayName || 'Unknown Exporter',
                    buyerAddress: formData.buyerAddress,
                    product: formData.product,
                    quantity: Number(formData.quantity),
                    price: Number(formData.price),
                    destination: formData.destination
                });

                console.log("Contract created:", result);
                alert(`Contract Anchored on IOTA!\nDigest: ${result.digest}`);
                // TODO: Save 'result.digest' and 'result.explorerUrl' to Firestore
                navigate(`/consignments`);
            } else {
                // Draft logic (Mock for now, or just save to Firestore if needed)
                alert("Draft saved (Local simulation).");
            }

        } catch (e: any) {
            console.error(e);
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-lg">
                    <Package size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New Supply Contract</h1>
                    <p className="text-slate-500">Initiate a secure, anchored trade agreement.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                <div className="space-y-6">
                    {/* Product & Quantity Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Product Category</label>
                            <div className="relative">
                                <select
                                    name="product"
                                    value={formData.product}
                                    onChange={handleChange}
                                    className="w-full appearance-none px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Quantity (kg)</label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="e.g. 5000"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Price & Destination Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Unit Price (USD/kg)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="e.g. 4.50"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Destination Country</label>
                            <input
                                type="text"
                                name="destination"
                                value={formData.destination}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Buyer Address */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Buyer IOTA Address</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                name="buyerAddress"
                                value={formData.buyerAddress}
                                onChange={handleChange}
                                placeholder="iota1..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1 ml-1">Must be a valid IOTA Testnet address.</p>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                        <button
                            onClick={() => handleCreateContract('draft')}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleCreateContract('onchain')}
                            disabled={loading}
                            className="flex-[2] px-4 py-3 bg-primary text-white font-bold rounded-lg hover:bg-fuchsia-700 shadow-glow transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
                            Create Smart Contract
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex gap-3">
                <ShieldCheck className="shrink-0" />
                <p>
                    <strong>Secure Anchoring:</strong> Creating a Smart Contract will permanently record the trade terms (Hash) on the IOTA Tangle.
                    This action requires gas fees (covered by Faucet) and cannot be undone.
                </p>
            </div>
        </div>
    );
};

export default CreateContract;
