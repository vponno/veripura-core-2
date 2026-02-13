
interface RouteChangeConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    oldRoute: { origin: string; destination: string };
    newRoute: { origin: string; destination: string };
}

export const RouteChangeConfirmation: React.FC<RouteChangeConfirmationProps> = ({
    isOpen, onClose, onConfirm, oldRoute, newRoute
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100">
                <div className="flex items-center gap-3 mb-4 text-amber-600">
                    <div className="p-2 bg-amber-100 rounded-full">
                        <span className="text-xl">⚠️</span>
                    </div>
                    <h3 className="text-lg font-bold">Route Change Detected</h3>
                </div>

                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                    You are changing the consignment route from
                    <span className="font-bold text-slate-800"> {oldRoute.origin} → {oldRoute.destination} </span>
                    to
                    <span className="font-bold text-slate-800"> {newRoute.origin} → {newRoute.destination}</span>.
                </p>

                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-6">
                    <p className="text-xs font-semibold text-amber-800 mb-1">Impact:</p>
                    <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                        <li>Compliance roadmap will be regenerated.</li>
                        <li>Existing documents may be flagged as mismatches.</li>
                        <li>Mandatory requirements may change.</li>
                    </ul>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-amber-500 text-white font-bold text-sm rounded-lg hover:bg-amber-600 shadow-sm transition-colors"
                    >
                        Confirm Change
                    </button>
                </div>
            </div>
        </div>
    );
};
