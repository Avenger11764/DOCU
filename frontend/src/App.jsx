import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import ChatArea from './components/ChatArea';

export default function App() {
  const [showChat, setShowChat] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
        if (data.length > 0 && !selectedDocId) {
          setSelectedDocId(data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (showChat) fetchDocuments();
  }, [showChat]);

  const handleUploadSuccess = (newDocData) => {
    const newDoc = newDocData.document || newDocData;
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDocId(newDoc._id);
  };

  const handleDeleteDoc = async (id) => {
    try {
      const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc._id !== id));
        if (selectedDocId === id) setSelectedDocId(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const getActiveDocumentName = () => {
    if (!selectedDocId) return null;
    const doc = documents.find(d => d._id === selectedDocId);
    return doc ? doc.filename : null;
  };

  if (!showChat) {
    return <LandingPage onGetStarted={() => setShowChat(true)} />;
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
          <div className="space-y-3">
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
            <DocumentList
              documents={documents}
              onDeleteDoc={handleDeleteDoc}
              isLoadingDocs={isLoadingDocs}
              selectedDocId={selectedDocId}
              onSelectDoc={setSelectedDocId}
            />
          </div>
        </div>

        <footer className="p-6 border-t border-[#dbc2b0]/30 bg-[#f9f9f9]">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span>Backend connected · MongoDB Atlas</span>
          </div>
        </footer>
      </aside>

      <div className="flex-1 h-full flex flex-col relative bg-[#FAFAFA]">
        <ChatArea
          selectedDocId={selectedDocId}
          selectedDocName={getActiveDocumentName()}
        />
      </div>
    </div>
  );
}
