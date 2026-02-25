import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChecklistItemCategory } from '../../types';
import { complianceService } from '../../services/complianceService';

interface GuardianRequirementChatProps {
    onAddRule: (name: string, category: ChecklistItemCategory) => void;
    onRemoveRule: (name: string) => void;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'guardian';
    timestamp: number;
    agentName?: string; // If sent by specific agent
}

export const GuardianRequirementChat: React.FC<GuardianRequirementChatProps> = ({ onAddRule, onRemoveRule }) => {
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

    const processUserRequest = async (text: string) => {
        setIsTyping(true);
        try {
            // 1. Analyze Intent via AI
            const intent = await import('../../services/geminiService').then(m => m.analyzeGuardianIntent(text));

            if (intent.action === 'ADD_REQUIREMENT' && intent.docName && intent.category) {
                const docName = intent.docName;
                // Cast string category to Enum if possible, else default
                const categoryEnum = Object.values(ChecklistItemCategory).includes(intent.category as any)
                    ? intent.category as ChecklistItemCategory
                    : ChecklistItemCategory.REGULATORY;

                const agentId = complianceService.getResponsibleAgent(docName, categoryEnum);
                const { getAgentPersona } = await import('./AgentPersonas');
                const persona = getAgentPersona(agentId);

                onAddRule(docName, categoryEnum);

                // 4. Guardian Response using Persona
                const responseText = `**${persona.greeting}** <br/>Request for **${docName}** acknowledged. Added to roadmap.`;

                setIsTyping(false);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: responseText,
                    sender: 'guardian',
                    timestamp: Date.now(),
                    agentName: agentId
                }]);
            } else if (intent.action === 'REMOVE_REQUIREMENT' && intent.docName) {
                // Handle Removal
                onRemoveRule(intent.docName);
                setIsTyping(false);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: `Request to remove **${intent.docName}** acknowledged. Requirement revoked.`,
                    sender: 'guardian',
                    timestamp: Date.now(),
                    agentName: 'Guardian Orchestrator'
                }]);
            } else {
                // Fallback / Unknown
                setIsTyping(false);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: "I'm analyzing that request... Could you specify the exact document type?",
                    sender: 'guardian',
                    timestamp: Date.now(),
                    agentName: 'Guardian Orchestrator'
                }]);
            }
        } catch (e) {
            console.error(e);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: "I am having trouble connecting to the Agent Network (AI Service Error).",
                sender: 'guardian',
                timestamp: Date.now()
            }]);
        }
    };

    return (
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[400px]">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
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
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm rounded-tl-none'
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
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
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

            {/* Input Area */}
            <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
                className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2"
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a requirement (e.g. 'Add Halal Cert')..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 block w-full p-2.5 outline-none transition-all"
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

export default GuardianRequirementChat;
