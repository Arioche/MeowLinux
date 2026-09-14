import React, { useState, useRef, useEffect } from 'react';
import { TerminalEntry } from '../types';
import { Terminal as TerminalIcon, Copy, Trash2, CornerDownLeft, Sparkles } from 'lucide-react';
import { soundFx } from '../lib/audio';

interface TerminalProps {
  history: TerminalEntry[];
  onExecuteCommand: (cmd: string) => void;
  onClear: () => void;
  cwd: string;
  currentUser: string;
  onAutocomplete: (input: string) => { completed: string; suggestions: string[] };
}

export const Terminal: React.FC<TerminalProps> = ({
  history,
  onExecuteCommand,
  onClear,
  cwd,
  currentUser,
  onAutocomplete,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [tabSuggestions, setTabSuggestions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Command history for Up/Down arrow cycling
  const commandHistory = history
    .filter((h) => h.type === 'command' && h.cmd)
    .map((h) => h.cmd!);

  useEffect(() => {
    // Only scroll the terminal container itself, NEVER scroll the browser window or the screen down
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    soundFx.playKeypress();

    // Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      soundFx.playEnter();
      const cmdToRun = inputVal;
      setInputVal('');
      setHistoryIndex(-1);
      setTabSuggestions([]);
      onExecuteCommand(cmdToRun);
      
      // Keep input focused and scroll container to bottom without window jitter
      setTimeout(() => {
        if (terminalContainerRef.current) {
          terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
        }
        inputRef.current?.focus({ preventScroll: true });
      }, 10);
      return;
    }

    // Up Arrow (Previous command)
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(commandHistory[nextIdx] || '');
      return;
    }

    // Down Arrow (Next command)
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      }
      return;
    }

    // Tab (Autocomplete)
    if (e.key === 'Tab') {
      e.preventDefault();
      const res = onAutocomplete(inputVal);
      if (res.completed !== inputVal) {
        setInputVal(res.completed);
        setTabSuggestions([]);
      } else if (res.suggestions.length > 0) {
        setTabSuggestions(res.suggestions);
      }
      return;
    }

    // Ctrl+L (Clear screen)
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      onClear();
      return;
    }

    // Ctrl+C (Interrupt)
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      onExecuteCommand('^C');
      setInputVal('');
      return;
    }
  };

  const handleCopyHistory = () => {
    const rawText = history
      .map((h) => (h.cmd ? `$ ${h.cmd}\n${h.output}` : h.output))
      .join('\n');
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Quick Command buttons for user convenience
  const quickPills = ['ls -la', 'pwd', 'whoami', 'uname -a', 'ps aux', 'df -h', 'help', 'meow'];

  // Format cwd for prompt (replace /home/meow with ~)
  const displayCwd = cwd.startsWith('/home/meow')
    ? cwd.replace('/home/meow', '~')
    : cwd;

  return (
    <div
      className="flex flex-col h-full bg-[#0a0d14] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl font-mono text-sm sm:text-base"
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#121622] border-b border-slate-800/80 select-none">
        <div className="flex items-center gap-2">
          {/* Mac-style traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
          </div>
          <div className="flex items-center gap-2 ml-2">
            <TerminalIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-300">
              {currentUser}@catnip: {displayCwd} (bash)
            </span>
          </div>
        </div>

        {/* Toolbar buttons */}
        <div className="flex items-center gap-1.5">
          <button
            id="copy-terminal-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyHistory();
            }}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Copy terminal transcript"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            id="clear-terminal-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Clear terminal buffer (Ctrl+L)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {copied && (
            <span className="text-[10px] text-emerald-400 font-sans px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
              Copied!
            </span>
          )}
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={terminalContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-2.5 custom-scrollbar min-h-[320px] max-h-[500px]"
      >
        {history.map((entry) => {
          if (entry.type === 'command') {
            return (
              <div key={entry.id} className="flex items-start gap-2 flex-wrap">
                <span className="text-emerald-400 font-bold select-none">{currentUser}@catnip</span>
                <span className="text-slate-500 select-none">:</span>
                <span className="text-blue-400 font-semibold select-none">{displayCwd}</span>
                <span className="text-slate-400 select-none">{currentUser === 'root' ? '#' : '$'}</span>
                <span className="text-slate-100 font-semibold">{entry.cmd}</span>
              </div>
            );
          }

          if (entry.type === 'error') {
            return (
              <pre
                key={entry.id}
                className="text-rose-400 font-mono whitespace-pre-wrap leading-relaxed pl-3 border-l-2 border-rose-500/50"
              >
                {entry.output}
              </pre>
            );
          }

          if (entry.type === 'success') {
            return (
              <pre
                key={entry.id}
                className="text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed pl-3 border-l-2 border-emerald-500/50"
              >
                {entry.output}
              </pre>
            );
          }

          if (entry.type === 'ascii') {
            return (
              <pre
                key={entry.id}
                className="text-amber-300 font-mono whitespace-pre-wrap leading-tight bg-slate-900/40 p-2.5 rounded-lg border border-amber-500/20"
              >
                {entry.output}
              </pre>
            );
          }

          return (
            <pre key={entry.id} className="text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
              {entry.output}
            </pre>
          );
        })}

        {/* Tab Suggestions Pill Box */}
        {tabSuggestions.length > 0 && (
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tab Suggestions:</span>
            <div className="flex flex-wrap gap-2">
              {tabSuggestions.map((s, idx) => (
                <span
                  key={idx}
                  onClick={() => {
                    setInputVal((prev) => prev.trim() + ' ' + s);
                    setTabSuggestions([]);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 hover:bg-slate-700 cursor-pointer font-mono"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Current Active Command Input Line */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-emerald-400 font-bold select-none whitespace-nowrap">
            {currentUser}@catnip
          </span>
          <span className="text-slate-500 select-none">:</span>
          <span className="text-blue-400 font-semibold select-none whitespace-nowrap">{displayCwd}</span>
          <span className="text-slate-400 select-none">{currentUser === 'root' ? '#' : '$'}</span>
          <input
            id="terminal-input"
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-slate-100 outline-none border-none font-mono caret-emerald-400 text-sm sm:text-base p-0 m-0"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={terminalEndRef} />
      </div>

      {/* Quick Interactive Shortcut Pills */}
      <div className="px-3 py-2 bg-[#10141f] border-t border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs uppercase font-bold text-slate-400 mr-1">Quick Paws:</span>
          {quickPills.map((pill, idx) => (
            <button
              key={idx}
              id={`quick-cmd-${pill.replace(/\s+/g, '-')}`}
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playKeypress();
                setInputVal(pill);
                inputRef.current?.focus({ preventScroll: true });
              }}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 font-mono transition"
            >
              {pill}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">Tab</kbd> Complete
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono ml-1">↑↓</kbd> History
        </div>
      </div>
    </div>
  );
};
