import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import API_BASE from '../config';

export default function DocumentUpload({ onUploadSuccess, sessionId }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    if (!sessionId) {
      setError("No active chat session. Please select or create a chat session first.");
      return;
    }


    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    const validTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp'
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.docx')) {
      setError("Unsupported file type. Only PDF, TXT, DOCX, and images (PNG, JPEG, WEBP) are allowed.");
      return;
    }

    setError(null);
    setUploading(true);
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    try {
      const customApiKey = localStorage.getItem('docu_custom_api_key');
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('docu_token')}`
      };
      if (customApiKey) {
        headers['x-gemini-api-key'] = customApiKey;
      }

      const response = await fetch(`${API_BASE}/api/documents/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      setSuccess(true);
      if (onUploadSuccess) {
        onUploadSuccess(data.document);
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  return (
    <div className="w-full">
      <form 
        onDragEnter={handleDrag} 
        onDragOver={handleDrag} 
        onDragLeave={handleDrag} 
        onDrop={handleDrop}
        onSubmit={(e) => e.preventDefault()}
        onClick={onButtonClick}
        className="upload-card group cursor-pointer border-dashed border-2 border-[#dbc2b0] bg-[#8d4b00]/[0.02] p-6 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-[#D97706] hover:bg-[#D97706]/[0.05]"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.docx,image/*"
          onChange={handleChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="material-symbols-outlined text-[#D97706] animate-spin text-[32px]">sync</span>
            <p className="text-sm font-semibold text-[#1a1c1c]">Processing Document...</p>
            <p className="text-xs text-[#554336]">Extracting text, chunking, and embedding...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-2 py-4 text-[#8d4b00]">
            <span className="material-symbols-outlined text-[#D97706] text-[32px] animate-bounce">check_circle</span>
            <p className="text-sm font-semibold">Upload Complete!</p>
            <p className="text-xs text-[#554336]">Your document is ready for research.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <span className="material-symbols-outlined text-[#8d4b00] text-[32px] group-hover:animate-bounce transition-transform duration-300">cloud_upload</span>
            <h3 className="font-semibold text-sm text-[#1a1c1c] mb-0.5">Upload Document</h3>
            <p className="text-xs text-[#554336]">Drag & drop your PDF, TXT or DOCX here, or <span className="text-[#D97706] font-semibold group-hover:underline">browse</span></p>
            <p className="text-[10px] text-slate-400 mt-1">Supports PDF, TXT, DOCX & Images up to 10MB</p>
          </div>
        )}
      </form>

      {error && (
        <div 
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(186, 26, 26, 0.05)',
            border: '1px solid rgba(186, 26, 26, 0.2)',
            color: '#ba1a1a',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          className="animate-fade-in"
        >
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
