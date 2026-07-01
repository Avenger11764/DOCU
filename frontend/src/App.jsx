import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import ChatArea from './components/ChatArea';
import API_BASE from './config';

export default function App() {
  const [showChat, setShowChat] = useState(false);
  const [username, setUsername] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [customApiKeyInput, setCustomApiKeyInput] = useState(localStorage.getItem('docu_custom_api_key') || '');

  useEffect(() => {
    const token = localStorage.getItem('docu_token');
    const storedUsername = localStorage.getItem('docu_username');
    if (token) {
      setShowChat(true);
      setUsername(storedUsername || 'User');
    }
  }, []);

  const fetchSessions = async () => {
    const token = localStorage.getItem('docu_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/documents/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        if (data.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data[0]._id);
        } else if (data.length === 0) {
          await handleNewSession();
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchDocumentsForSession = async (sessionId) => {
    if (!sessionId) return;
    const token = localStorage.getItem('docu_token');
    if (!token) return;

    setIsLoadingDocs(true);
    try {
      const response = await fetch(`${API_BASE}/api/documents?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents for session:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleNewSession = async () => {
    const token = localStorage.getItem('docu_token');
    if (!token) return;

    try {
      const defaultTitle = `Chat Session - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const response = await fetch(`${API_BASE}/api/documents/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: defaultTitle }),
      });
      if (response.ok) {
        const newSess = await response.json();
        setSessions((prev) => [newSess, ...prev]);
        setSelectedSessionId(newSess._id);
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    const token = localStorage.getItem('docu_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/documents/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s._id !== sessionId));
        if (selectedSessionId === sessionId) {
          setSelectedSessionId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  useEffect(() => {
    if (showChat) {
      fetchSessions();
    }
  }, [showChat]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchDocumentsForSession(selectedSessionId);
    } else {
      setDocuments([]);
      if (sessions.length > 0) {
        setSelectedSessionId(sessions[0]._id);
      } else if (showChat) {
        handleNewSession();
      }
    }
  }, [selectedSessionId, sessions.length]);

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDeleteDoc = async (id) => {
    const token = localStorage.getItem('docu_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc._id !== id));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('docu_token');
    localStorage.removeItem('docu_username');
    localStorage.removeItem('docu_custom_api_key');
    setUsername('');
    setCustomApiKeyInput('');
    setSessions([]);
    setSelectedSessionId(null);
    setDocuments([]);
    setShowChat(false);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const trimmedKey = customApiKeyInput.trim();
    if (trimmedKey) {
      localStorage.setItem('docu_custom_api_key', trimmedKey);
    } else {
      localStorage.removeItem('docu_custom_api_key');
    }
    setShowSettingsModal(false);
  };

  const getActiveDocumentsLabel = () => {
    if (documents.length === 0) return 'General Chat';
    if (documents.length === 1) return documents[0].filename;
    return `${documents.length} uploaded files`;
  };

  if (!showChat) {
    return (
      <LandingPage 
        onGetStarted={() => {
          setShowChat(true);
          setUsername(localStorage.getItem('docu_username') || 'User');
          setCustomApiKeyInput(localStorage.getItem('docu_custom_api_key') || '');
        }} 
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#FAFAFA] overflow-hidden">
      <aside className="w-[30%] min-w-[320px] max-w-[380px] h-full bg-[#f9f9f9] border-r border-[#dbc2b0] flex flex-col z-50 relative overflow-hidden">
        
        <header className="flex flex-col py-5 px-6 gap-2 border-b border-[#dbc2b0]/30 bg-[#f9f9f9]">
          <div className="flex items-center gap-2 text-lg font-bold text-[#8d4b00]">
            <div className="w-8 h-8 bg-[#D97706] rounded flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                description
              </span>
            </div>
            <span className="tracking-tighter font-extrabold text-lg uppercase">DOCU</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-6 relative z-10">
          <button 
            onClick={() => handleNewSession()}
            className="flex items-center justify-center gap-2 p-3 bg-[#D97706] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all duration-200 w-full shadow-md shadow-amber-700/10"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            <span>New Chat</span>
          </button>

          <div className="space-y-3">
            <DocumentUpload onUploadSuccess={handleUploadSuccess} sessionId={selectedSessionId} />
            <DocumentList
              documents={documents}
              onDeleteDoc={handleDeleteDoc}
              isLoadingDocs={isLoadingDocs}
            />
          </div>

          <div className="pt-4 border-t border-slate-200/50">
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Chats</span>
              <span className="material-symbols-outlined text-slate-400 text-xs">history</span>
            </div>

            <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar">
              {sessions.map((sess) => {
                const isSelected = sess._id === selectedSessionId;
                return (
                  <div
                    key={sess._id}
                    onClick={() => setSelectedSessionId(sess._id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer group transition-all duration-200 ${
                      isSelected
                        ? 'bg-slate-200/80 font-bold text-slate-800 shadow-sm border-r-2 border-[#D97706]'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden w-full mr-2">
                      <span className="material-symbols-outlined text-xs flex-shrink-0" style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}>
                        forum
                      </span>
                      <span className="truncate text-xs font-semibold" title={sess.title}>
                        {sess.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(sess._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded text-slate-400 transition-all duration-200"
                      title="Delete Session"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="p-6 border-t border-[#dbc2b0]/30 space-y-4 bg-[#f9f9f9]">
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-3 p-2 rounded-lg text-slate-500 font-semibold hover:bg-slate-200/50 transition-colors duration-200 w-full text-left text-xs"
            >
              <span className="material-symbols-outlined text-base">settings</span>
              <span>Settings</span>
            </button>
            <button 
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-3 p-2 rounded-lg text-slate-500 font-semibold hover:bg-slate-200/50 transition-colors duration-200 w-full text-left text-xs"
            >
              <span className="material-symbols-outlined text-base">help</span>
              <span>Support</span>
            </button>
          </div>
          
          <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between p-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#D97706]/10 text-[#8d4b00] border border-[#D97706]/20 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {username ? username.substring(0, 2) : 'US'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-slate-700 truncate capitalize">{username}</span>
                <span className="text-[10px] text-slate-400">Researcher</span>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-sm font-bold">logout</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200/50 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span>Backend connected · MongoDB Atlas</span>
          </div>
        </footer>
      </aside>

      <div className="flex-1 h-full flex flex-col relative bg-[#FAFAFA]">
        <ChatArea 
          selectedDocId={selectedSessionId}
          selectedDocName={getActiveDocumentsLabel()} 
          selectedSessionId={selectedSessionId}
          onQueryComplete={fetchSessions}
          hasDocuments={documents.length > 0}
        />
      </div>

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#dbc2b0] rounded-2xl w-full max-w-md p-8 editorial-shadow relative">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D97706]">settings</span>
              Settings
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Configure your research preferences and developer APIs.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                  Custom Gemini API Key
                </label>
                <input
                  type="password"
                  value={customApiKeyInput}
                  onChange={(e) => setCustomApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#f9f9f9] border border-[#dbc2b0] rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706]"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Provide your own key to bypass public quota limits. This key is saved locally in your browser storage and never shared.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#D97706] text-white rounded-xl text-xs font-bold hover:opacity-95 transition-opacity"
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    handleLogout();
                  }}
                  className="w-full py-3 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Logout Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#dbc2b0] rounded-2xl w-full max-w-sm p-8 editorial-shadow relative text-center">
            <button 
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#dbc2b0]/50 text-[#D97706]">
              <span className="material-symbols-outlined text-2xl font-semibold">contact_support</span>
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-2">Support & Feedback</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Need assistance or want to request custom features? Contact our lead support representative directly.
            </p>

            <a 
              href="mailto:avinashbajpai11764@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#D97706]/10 text-[#8d4b00] border border-[#D97706]/20 rounded-xl text-xs font-bold hover:bg-[#D97706]/20 transition-all"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              <span>avinashbajpai11764@gmail.com</span>
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
