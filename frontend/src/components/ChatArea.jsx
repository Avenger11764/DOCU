import React, { useState, useRef, useEffect } from 'react';
import API_BASE from '../config';

export default function ChatArea({ selectedDocId, selectedDocName, selectedSessionId, onQueryComplete, hasDocuments, toggleSidebar }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState({});
  const [mousePos, setMousePos] = useState({ x: 250, y: 250 });
  const messagesEndRef = useRef(null);

  // Track mouse coordinates for dynamic radial spotlight
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Fetch persistent message history for the active session
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedSessionId) {
        setMessages([]);
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/api/documents/sessions/${selectedSessionId}/messages`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('docu_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data.map(m => ({
            role: m.role,
            text: m.text,
            citations: m.citations || [],
            loading: false
          })));
        }
      } catch (err) {
        console.error('Error loading message history:', err);
      }
    };
    fetchMessages();
    setExpandedCitations({});
  }, [selectedSessionId]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleCitations = (msgIndex) => {
    setExpandedCitations(prev => ({
      ...prev,
      [msgIndex]: !prev[msgIndex]
    }));
  };

  const handleClearChat = () => {
    setMessages([]);
    setExpandedCitations({});
  };


  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedSessionId || !hasDocuments || loading) return;

    const userQuestion = input.trim();
    setInput('');
    setLoading(true);

    // 1. Add User Message
    const userMsg = { role: 'user', text: userQuestion };
    setMessages(prev => [...prev, userMsg]);

    // 2. Add empty Assistant Message to be streamed into
    const assistantMsgIndex = messages.length + 1; // index in the updated list
    const initialAssistantMsg = { 
      role: 'assistant', 
      text: '', 
      citations: [], 
      loading: true 
    };
    setMessages(prev => [...prev, initialAssistantMsg]);

    try {
      // 3. Initiate Server-Sent Events request directed at the active session
      const customApiKey = localStorage.getItem('docu_custom_api_key');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('docu_token')}`
      };
      if (customApiKey) {
        headers['x-gemini-api-key'] = customApiKey;
      }

      const response = await fetch(`${API_BASE}/api/documents/sessions/${selectedSessionId}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: userQuestion
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process question");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finished = false;
      let streamedText = '';
      let citationsList = [];

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) {
          finished = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.slice(6).trim();
              if (!dataStr) continue;
              const data = JSON.parse(dataStr);

              if (data.type === 'citations') {
                citationsList = data.citations || [];
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated[assistantMsgIndex]) {
                    updated[assistantMsgIndex].citations = citationsList;
                  }
                  return updated;
                });
              } else if (data.type === 'token') {
                streamedText += data.token;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated[assistantMsgIndex]) {
                    updated[assistantMsgIndex].text = streamedText;
                  }
                  return updated;
                });
              } else if (data.type === 'done') {
                finished = true;
              } else if (data.type === 'error') {
                throw new Error(data.error || "Error streaming response");
              }
            } catch (err) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }

      // Mark message as not loading
      setMessages(prev => {
        const updated = [...prev];
        if (updated[assistantMsgIndex]) {
          updated[assistantMsgIndex].loading = false;
        }
        return updated;
      });

      if (onQueryComplete) {
        onQueryComplete();
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const updated = [...prev];
        if (updated[assistantMsgIndex]) {
          updated[assistantMsgIndex].text = "Sorry, an error occurred while generating the answer. Please try again.";
          updated[assistantMsgIndex].loading = false;
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    // Format bold text
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Format bullet points
    formatted = formatted.replace(/^\*\s+(.*?)$/gm, '• $1');
    return formatted.split('\n').map((line, idx) => (
      <p key={idx} className={line.startsWith('• ') ? "pl-4 py-0.5" : "py-0.5"}>
        {line.startsWith('• ') ? (
          <>
            <span className="text-[#D97706] font-bold mr-1">•</span> 
            <span dangerouslySetInnerHTML={{ __html: line.substring(2) }} />
          </>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: line }} />
        )}
      </p>
    ));
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{
        '--mouse-x': `${mousePos.x}px`,
        '--mouse-y': `${mousePos.y}px`,
      }}
      className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden relative z-10"
    >
      {/* Dynamic Background Graphics */}
      <div className="absolute inset-0 pointer-events-none opacity-20 -z-10 bg-[linear-gradient(rgba(219,194,176,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(219,194,176,0.15)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div 
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(217, 119, 6, 0.18), transparent 70%)`
        }}
      />
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-20 opacity-90">
        <div className="absolute top-[10%] left-[-15%] w-[450px] h-[450px] bg-[#ffdcc3]/45 rounded-full blur-[130px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-15%] w-[450px] h-[450px] bg-[#d5e0f8]/60 rounded-full blur-[130px] animate-pulse"></div>
      </div>

      {/* Top Header Bar */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#dbc2b0]/30 flex items-center justify-between px-6 z-40 shadow-sm">
        <div className="flex items-center gap-3 text-slate-800">
          <button 
            onClick={toggleSidebar} 
            className="md:hidden p-1.5 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors flex items-center justify-center"
            title="Toggle Sidebar"
          >
            <span className="material-symbols-outlined font-bold text-lg">menu</span>
          </button>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-xs font-semibold text-slate-450 truncate">Active:</span>
            <span className="text-xs font-bold text-[#8d4b00] truncate max-w-[150px] sm:max-w-[280px]">
              {selectedDocId ? selectedDocName : 'None'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClearChat} 
            disabled={messages.length === 0}
            className="text-xs font-bold text-[#8d4b00] hover:underline disabled:opacity-40"
          >
            Clear Chat
          </button>
        </div>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {!selectedDocId ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 relative z-10">
            <div className="w-16 h-16 bg-[#D97706]/10 rounded-2xl flex items-center justify-center shadow-sm border border-[#D97706]/20 mb-4 animate-bounce">
              <span className="material-symbols-outlined text-[#D97706] text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <h4 className="text-slate-800 font-bold text-base mb-1">DOCU Research Workspace</h4>
            <p className="text-xs max-w-sm leading-relaxed text-slate-400">
              Upload research materials using the sidebar dropzone and select a document to get started. Ask questions and review grounded insights with verifiable citations.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            {hasDocuments ? (
              <>
                <span className="material-symbols-outlined text-slate-300 text-[48px] mb-3">chat_bubble_outline</span>
                <p className="text-xs text-slate-400">Ask any question to synthesize information from <span className="text-[#8d4b00] font-semibold">{selectedDocName}</span></p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-slate-300 text-[48px] mb-3 animate-pulse">upload_file</span>
                <p className="text-sm font-bold text-slate-700 mb-1">No documents in this session</p>
                <p className="text-xs text-slate-450 max-w-xs leading-relaxed">
                  Please upload a PDF, DOCX, TXT file, or image using the sidebar dropzone to activate this chat session.
                </p>
              </>
            )}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                {/* Chat Bubble Layout */}
                {isUser ? (
                  <div className="bg-white p-4 rounded-xl rounded-tr-none max-w-[80%] border border-[#dbc2b0]/30 shadow-sm text-sm text-slate-800 leading-relaxed">
                    <p>{msg.text}</p>
                  </div>
                ) : (
                  <div className="ai-insight-border pl-6 py-2 max-w-[90%] text-sm text-slate-800 leading-relaxed w-full">
                    {msg.loading && !msg.text ? (
                      <div className="typing-indicator flex items-center py-1">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      formatText(msg.text)
                    )}

                    {/* Citations badges rendering */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.citations.map((cite, cIdx) => (
                          <div 
                            key={cIdx}
                            onClick={() => toggleCitations(`${index}-${cIdx}`)}
                            className="citation-pill px-3 py-1 text-[10px] font-bold rounded-full border cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                            title={`Similarity Match: ${(cite.similarity * 100).toFixed(1)}%`}
                          >
                            [{cIdx + 1}] Source Block #{cite.index + 1}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expanded Citation Preview Box */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 flex flex-col gap-2">
                        {msg.citations.map((cite, cIdx) => {
                          const isExpanded = expandedCitations[`${index}-${cIdx}`];
                          if (!isExpanded) return null;
                          return (
                            <div 
                              key={cIdx}
                              className="mt-2 p-3 bg-white border border-[#dbc2b0]/40 rounded-lg text-xs animate-fade-in"
                            >
                              <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-400">
                                <span className="text-[#8d4b00]">Excerpt Citation [{cIdx + 1}]</span>
                                <span className="text-[#D97706]">Match Rating: {(cite.similarity * 100).toFixed(1)}%</span>
                              </div>
                              <p className="text-slate-600 italic">"...{cite.text}..."</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Query Bar */}
      <div className="p-6 flex justify-center bg-transparent">
        <form onSubmit={handleSend} className="w-full max-w-4xl">
          <div className="bg-white floating-input-shadow border border-[#dbc2b0]/40 rounded-full flex items-center p-2 pl-6 gap-4 focus-within:ring-2 focus-within:ring-[#8d4b00]/20">
            <span className="material-symbols-outlined text-slate-400 transition-colors">edit_note</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                !selectedSessionId
                  ? "Select a document session from the sidebar to ask questions..."
                  : !hasDocuments
                  ? "Please upload a document to this session to start chatting..."
                  : "Ask a question about the document..."
              }
              disabled={!selectedSessionId || !hasDocuments || loading}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 placeholder:text-slate-400/60 py-2 focus:outline-none disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!selectedSessionId || !hasDocuments || !input.trim() || loading}
              className="w-10 h-10 bg-[#D97706] text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base font-bold">north</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
