import React, { useState } from 'react';
import { Save, X, FileText } from 'lucide-react';
import { soundFx } from '../lib/audio';

interface NanoModalProps {
  filePath: string;
  initialContent: string;
  isOpen: boolean;
  onSave: (path: string, newContent: string) => void;
  onClose: () => void;
}

export const NanoModal: React.FC<NanoModalProps> = ({
  filePath,
  initialContent,
  isOpen,
  onSave,
  onClose,
}) => {
  const [content, setContent] = useState(initialContent);

  // Sync content when opened with different file
  React.useEffect(() => {
    setContent(initialContent);
  }, [initialContent, filePath]);

  if (!isOpen) return null;

  const handleSaveAndExit = () => {
    soundFx.playEnter();
    onSave(filePath, content);
    onClose();
  };

  const lineCount = content.split('\n').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0d1117] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        {/* Nano Header Bar */}
        <div className="bg-slate-200 text-slate-950 px-4 py-1.5 flex items-center justify-between font-bold select-none text-xs">
          <span>GNU nano 7.2</span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>File: {filePath}</span>
          </span>
          <span className="text-[11px] font-medium text-slate-700">{lineCount} lines</span>
        </div>

        {/* Text Area Body */}
        <div className="p-4 bg-[#0a0d14] flex-1">
          <textarea
            id="nano-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-80 bg-transparent text-slate-200 font-mono text-xs sm:text-sm outline-none resize-none leading-relaxed custom-scrollbar"
            spellCheck={false}
            autoFocus
          />
        </div>

        {/* Nano Keybindings Footer */}
        <div className="bg-[#121622] border-t border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">^O</span>
              <span>WriteOut</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-400 font-bold">^X</span>
              <span>Exit</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="nano-cancel-btn"
              onClick={() => {
                soundFx.playKeypress();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Discard & Close
            </button>
            <button
              id="nano-save-btn"
              onClick={handleSaveAndExit}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save File (^O)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
