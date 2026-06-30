import React from 'react';

export default function DocumentList({
  documents = [],
  onDeleteDoc,
  isLoadingDocs,
}) {
  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Files</span>
        <span className="material-symbols-outlined text-slate-400 text-xs">folder_open</span>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
        {isLoadingDocs ? (
          <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
            <span className="material-symbols-outlined text-[#D97706] animate-spin text-sm">sync</span>
            <span className="text-[10px]">Loading files...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-4 px-3 border border-dashed border-[#dbc2b0]/40 rounded-lg text-slate-400">
            <p className="text-[10px] leading-relaxed">No documents uploaded to this chat yet.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc._id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-[#dbc2b0]/30 bg-white shadow-sm hover:border-[#D97706]/40 transition-all duration-200"
            >
              <div className="flex items-center gap-2 overflow-hidden w-full mr-2">
                <span className="material-symbols-outlined text-[#8d4b00] text-base flex-shrink-0">
                  description
                </span>
                <div className="overflow-hidden flex flex-col">
                  <span className="truncate text-[11px] font-bold text-slate-800" title={doc.filename}>
                    {doc.filename}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    {formatBytes(doc.fileSize)}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDoc(doc._id);
                }}
                className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 transition-all duration-200"
                title="Delete Document"
              >
                <span className="material-symbols-outlined text-xs">delete</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
