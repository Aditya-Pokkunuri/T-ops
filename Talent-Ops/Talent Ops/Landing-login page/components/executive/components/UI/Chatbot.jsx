import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageSquare, X, Move, Loader2 } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const CHATBOT_API_URL = 'http://localhost:8000/chat';

const Chatbot = () => {
    const { userId, userRole } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! I am your Talent Ops AI assistant. As an Executive, you have full access to view and manage all workforce data. How can I help you today?' }
    ]);
    const messagesEndRef = useRef(null);

    // Dragging state
    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem('chatbot-position');
        return saved ? JSON.parse(saved) : { bottom: 30, right: 30 };
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Save position to localStorage
    useEffect(() => {
        localStorage.setItem('chatbot-position', JSON.stringify(position));
    }, [position]);

    const formatResponse = (response) => {
        if (response.error) {
            return `❌ Error: ${response.error}`;
        }

        if (response.reply === 'forbidden') {
            return `🚫 Sorry, you don't have permission to do that. ${response.reason || ''}`;
        }

        if (response.message) {
            return response.message;
        }

        if (response.reply && Array.isArray(response.reply)) {
            if (response.reply.length === 0) {
                return response.message || 'No records found.';
            }
            return response.reply.map((item, idx) => {
                const details = Object.entries(item)
                    .filter(([key]) => !key.endsWith('_id') && key !== 'id')
                    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
                    .join('\n');
                return `📌 ${idx + 1}.\n${details}`;
            }).join('\n\n');
        }

        if (response.action) {
            return `✅ Action completed: ${response.action}`;
        }

        return JSON.stringify(response, null, 2);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(CHATBOT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId || 'guest',
                    role: userRole || 'executive',
                    team_id: null,
                    message: userMessage
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            const formattedResponse = formatResponse(data);

            setMessages(prev => [...prev, { role: 'ai', text: formattedResponse }]);
        } catch (error) {
            console.error('Chatbot error:', error);
            setMessages(prev => [...prev, {
                role: 'ai',
                text: `⚠️ Could not connect to the AI backend. Please make sure the server is running on port 8000.\n\nError: ${error.message}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Drag handlers
    const handleMouseDown = (e) => {
        const isButton = e.target.closest('button');
        const isDragHandle = e.target.closest('.drag-handle');
        const isFAB = e.target.closest('.chatbot-fab');

        if (isButton && !isDragHandle && !isFAB) return;

        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX,
            y: e.clientY,
            startBottom: position.bottom,
            startRight: position.right
        });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const deltaX = dragStart.x - e.clientX;
            const deltaY = dragStart.y - e.clientY;

            const newRight = dragStart.startRight + deltaX;
            const newBottom = dragStart.startBottom + deltaY;

            const maxRight = window.innerWidth - 100;
            const maxBottom = window.innerHeight - 100;

            setPosition({
                right: Math.max(10, Math.min(maxRight, newRight)),
                bottom: Math.max(10, Math.min(maxBottom, newBottom))
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                bottom: `${position.bottom}px`,
                right: `${position.right}px`,
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                cursor: isDragging ? 'grabbing' : 'default',
                userSelect: isDragging ? 'none' : 'auto'
            }}
        >
            {isOpen && (
                <div style={{
                    width: '380px',
                    height: '520px',
                    backgroundColor: 'var(--surface)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-lg)',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <div
                        className="drag-handle"
                        onMouseDown={handleMouseDown}
                        style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Move size={16} style={{ opacity: 0.7 }} />
                            <Bot size={20} />
                            <span style={{ fontWeight: 600 }}>TalentOps AI</span>
                            <span style={{
                                fontSize: '0.7rem',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                textTransform: 'capitalize'
                            }}>
                                Executive
                            </span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                color: 'white',
                                opacity: 0.8,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{
                        flex: 1,
                        padding: '16px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        backgroundColor: 'var(--background)'
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: msg.role === 'ai'
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                                </div>
                                <div style={{
                                    maxWidth: '80%',
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    background: msg.role === 'user' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--surface)',
                                    color: msg.role === 'ai' ? 'var(--text-main)' : 'white',
                                    boxShadow: 'var(--shadow-sm)',
                                    borderTopLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                                    borderTopRightRadius: msg.role === 'user' ? '4px' : '16px'
                                }}>
                                    <pre style={{
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5',
                                        margin: 0,
                                        fontFamily: 'inherit',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}>{msg.text}</pre>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <Bot size={16} />
                                </div>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    backgroundColor: 'var(--surface)',
                                    boxShadow: 'var(--shadow-sm)',
                                    borderTopLeftRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--surface)',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        borderTop: '1px solid var(--border)'
                    }}>
                        {['All pending leaves', 'Team performance', 'Approve all leaves'].map((action) => (
                            <button
                                key={action}
                                onClick={() => setInput(action)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#10b981';
                                    e.target.style.color = 'white';
                                    e.target.style.borderColor = '#10b981';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'var(--background)';
                                    e.target.style.color = 'var(--text-secondary)';
                                    e.target.style.borderColor = 'var(--border)';
                                }}
                            >
                                {action}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: '12px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)', display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Ask me anything..."
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '24px',
                                border: '1px solid var(--border)',
                                outline: 'none',
                                fontSize: '0.9rem',
                                backgroundColor: 'var(--background)',
                                transition: 'border-color 0.2s'
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none',
                                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                                opacity: isLoading || !input.trim() ? 0.6 : 1,
                                transition: 'transform 0.2s, opacity 0.2s'
                            }}
                            onMouseEnter={(e) => !isLoading && input.trim() && (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            {isLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            )}

            <button
                className="chatbot-fab"
                onMouseDown={handleMouseDown}
                onClick={(e) => {
                    if (!isDragging) {
                        setIsOpen(!isOpen);
                    }
                }}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                    transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s',
                    cursor: isDragging ? 'grabbing' : 'pointer',
                    border: 'none',
                    userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 30px rgba(16, 185, 129, 0.5)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4)';
                    }
                }}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </button>

            <style>
                {`
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .drag-handle:active {
                        cursor: grabbing !important;
                    }
                `}
            </style>
        </div>
    );
};

export default Chatbot;
