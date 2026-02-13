import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Plus } from 'lucide-react';
import { ChecklistItemCategory } from '../../types';
import { complianceService } from '../../services/complianceService';

interface GuardianRequirementChatProps {
    onAddRule: (name: string, category: ChecklistItemCategory) => void;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'guardian';
    timestamp: number;
    agentName?: string; // If sent by specific agent
}

const PRESET_CHIPS = [
    { label: 'Phytosanitary Cert', category: ChecklistItemCategory.REGULATORY },
    { label: 'Certificate of Origin', category: ChecklistItemCategory.REGULATORY },
    { label: 'HACCP / ISO 22000', category: ChecklistItemCategory.FOOD_SAFETY },
    { label: 'Organic Certificate', category: ChecklistItemCategory.CERTIFICATIONS },
    { label: 'Bill of Lading', category: ChecklistItemCategory.REGULATORY },
    { label: 'Lab Analysis', category: ChecklistItemCategory.FOOD_SAFETY },
];

export const GuardianRequirementChat: React.FC<GuardianRequirementChatProps> = ({ onAddRule }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: "Hello. I am the Guardian Orchestrator. Tell me what additional documents you need, and I will assign the correct specialist agent.",
            sender: 'guardian',
            timestamp: Date.now()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        // 1. Add User Message
        const userMsg: Message = {
            id: Date.now().toString(),
            text: text,
            sender: 'user',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // 2. Simulate Processing / "Thinking"
        setTimeout(() => {
            processUserRequest(text);
        }, 800);
    };

    const processUserRequest = (text: string) => {
        // Simple NLP / Heuristic for MVP
        const lowerText = text.toLowerCase();
        let docName = '';
        let category = ChecklistItemCategory.REGULATORY;

        // Detection Logic
        if (lowerText.includes('organic') || lowerText.includes('bio')) {
            docName = 'Organic Certificate';
            category = ChecklistItemCategory.CERTIFICATIONS;
        } else if (lowerText.includes('halal')) {
            docName = 'Halal Certificate';
            category = ChecklistItemCategory.CERTIFICATIONS;
        } else if (lowerText.includes('kosher')) {
            docName = 'Kosher Certificate';
            category = ChecklistItemCategory.CERTIFICATIONS;
        } else if (lowerText.includes('origin')) {
            docName = 'Certificate of Origin';
            category = ChecklistItemCategory.REGULATORY;
        } else if (lowerText.includes('phyto')) {
            docName = 'Phytosanitary Certificate';
            category = ChecklistItemCategory.REGULATORY;
        } else if (lowerText.includes('health')) {
            docName = 'Health Certificate';
            category = ChecklistItemCategory.REGULATORY;
        } else if (lowerText.includes('haccp') || lowerText.includes('iso')) {
            docName = 'ISO 22000 / HACCP';
            category = ChecklistItemCategory.FOOD_SAFETY;
        } else if (lowerText.includes('add ')) {
            // Fallback: Use whatever user typed after "add"
            docName = text.replace(/add /i, '').trim();
            // Try to guess category or default
            category = ChecklistItemCategory.REGULATORY;
        } else {
            // Unclear intent
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: "I didn't quite catch the document name. Try saying 'Add [Document Name]'.",
                sender: 'guardian',
                timestamp: Date.now()
            }]);
            return;
        }

        // 3. Execute Action
        if (docName) {
            // capitalize first letter
            docName = docName.charAt(0).toUpperCase() + docName.slice(1);

            const agent = complianceService.getResponsibleAgent(docName, category);
            onAddRule(docName, category);

            // 4. Guardian Response
            const responseText = `Understood. I have tasked the **${agent}** to track the **${docName}**.`;

            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: responseText,
                sender: 'guardian',
                timestamp: Date.now(),
                agentName: 'Orchestrator'
            }]);
        }
    };

    const handleChipClick = (label: string, category: ChecklistItemCategory) => {
        handleSendMessage(`Add ${label}`);
    };

    return (
        <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
            {/* Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-fuchsia-100 rounded-lg text-fuchsia-700">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Guardian Assistant</h3>
                        <p className="text-xs text-slate-500">Orchestrating 50+ Specialized Agents</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-fuchsia-600 text-white'
                            }`}>
                            {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>

                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === 'user'
                                ? 'bg-slate-200 text-slate-800 rounded-tr-none'
                                : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none'
                            }`}>
                            {msg.agentName && (
                                <span className="block text-xs font-bold text-fuchsia-700 mb-1">
                                    {msg.agentName}
                                </span>
                            )}
                            <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-fuchsia-600 text-white flex items-center justify-center flex-shrink-0">
                            <Bot size={14} />
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions (Chips) */}
            <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-2">
                {PRESET_CHIPS.map((chip) => (
                    <button
                        key={chip.label}
                        onClick={() => handleChipClick(chip.label, chip.category)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-fuchsia-50 hover:text-fuchsia-700 hover:border-fuchsia-200 transition-colors"
                    >
                        <Plus size={12} />
                        {chip.label}
                    </button>
                ))}
                {/* Hint Chip */}
                <span className="text-xs text-slate-400 italic px-2 py-1.5">
                    Try "Add Pesticide Report"...
                </span>
            </div>

            {/* Input Area */}
            <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
                className="p-4 bg-white border-t border-slate-100 flex gap-2"
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a requirement (e.g. 'Add Halal Cert')..."
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 block w-full p-2.5 outline-none transition-all"
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="text-white bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-bold rounded-lg p-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};
