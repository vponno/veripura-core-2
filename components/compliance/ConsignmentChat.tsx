import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, AlertTriangle, CheckCircle, User, X } from 'lucide-react';
import { AgentMessage } from '../../services/consignmentService';
import { agentService } from '../../services/agentService';
import ReactMarkdown from 'react-markdown';

interface ConsignmentChatProps {
    consignmentId: string;
    messages: AgentMessage[];
    isOpen: boolean;
    onClose: () => void;
}

export const ConsignmentChat: React.FC<ConsignmentChatProps> = ({ consignmentId, messages, isOpen, onClose }) => {
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;
        setSending(true);
        try {
            await agentService.sendMessage(consignmentId, input, 'text', 'user');
            setInput('');
            // TODO: In future, trigger LLM reply here
        } catch (e) {
            console.error("Failed to send message", e);
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col pt-16 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-fuchsia-100 rounded-full">
                        <Bot size={20} className="text-fuchsia-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Consignment Guardian</h3>
                        <p className="text-xs text-slate-500">Active Monitoring</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.length === 0 && (
                    <div className="text-center mt-10 opacity-50">
                        <Bot size={48} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm text-slate-500">I am monitoring this shipment.<br />Upload documents to start analysis.</p>
                        <div className="mt-4 p-2 bg-slate-100 rounded text-xs text-slate-400 border border-slate-200 inline-block">
                            🛡️ Guardian Agent Active
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-slate-200 text-slate-600' :
                            msg.type === 'alert' ? 'bg-red-100 text-red-600' :
                                msg.type === 'success' ? 'bg-green-100 text-green-600' :
                                    'bg-fuchsia-100 text-fuchsia-600'
                            }`}>
                            {msg.sender === 'user' ? <User size={14} /> :
                                msg.type === 'alert' ? <AlertTriangle size={14} /> :
                                    msg.type === 'success' ? <CheckCircle size={14} /> :
                                        <Bot size={14} />}
                        </div>

                        {/* Bubble */}
                        <div className={`rounded-2xl p-3 text-sm max-w-[85%] shadow-sm ${msg.sender === 'user' ? 'bg-slate-800 text-white rounded-tr-none' :
                            msg.type === 'alert' ? 'bg-white border border-red-200 text-slate-800 rounded-tl-none' :
                                'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                            }`}>
                            <div className="prose prose-sm max-w-none text-inherit">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {msg.type === 'success' && (
                                <div className="mt-2 pt-2 border-t border-green-100 flex items-center justify-between text-[10px] text-green-700 font-mono">
                                    <span>✍️ Verified Signature:</span>
                                    <span className="opacity-70">0x{msg.id.split('-')[0]}...</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about this shipment..."
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    />
                    <button
                        type="submit"
                        disabled={sending || !input.trim()}
                        className="p-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};
