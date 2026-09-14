import React, { useState, useRef, useEffect } from 'react';
import { Challenge, TerminalEntry } from '../types';
import { Bot, X, Send, Sparkles, Terminal, BookOpen, Lightbulb } from 'lucide-react';
import { soundFx } from '../lib/audio';

interface AiMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChallenge: Challenge;
  terminalHistory: TerminalEntry[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'mentor';
  text: string;
  timestamp: number;
}

export const AiMentorModal: React.FC<AiMentorModalProps> = ({
  isOpen,
  onClose,
  currentChallenge,
  terminalHistory,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'mentor',
      text: `🐾 *Purr!* Greetings, apprentice! I am **Commander Whiskers**, Senior Catdministrator and Chief LPIC Proctor.\n\nI'm inspecting your terminal session for **"${currentChallenge?.title}"**. How can I assist your Linux journey today? Ask me about command flags, LPIC exam traps, or where to aim your paws next!`,
      timestamp: Date.now(),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputVal.trim();
    if (!textToSend || loading) return;

    soundFx.playEnter();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const lastCmdEntry = [...terminalHistory].reverse().find((h) => h.type === 'command');
      const response = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          currentChallenge,
          terminalHistory: terminalHistory.slice(-6),
          userCommand: lastCmdEntry?.cmd || '',
        }),
      });

      const data = await response.json();
      soundFx.playMeow();

      const mentorMsg: ChatMessage = {
        id: `mentor-${Date.now()}`,
        sender: 'mentor',
        text: data.response || `🐾 *Mrow!* I recommend reviewing the objective checklist or trying \`help\` in the terminal!`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, mentorMsg]);
    } catch (err) {
      soundFx.playError();
      setMessages((prev) => [
        ...prev,
        {
          id: `mentor-${Date.now()}`,
          sender: 'mentor',
          text: `🐾 *Hiss!* My comms link encountered static. For **${currentChallenge.title}**, try checking the hints tab or reviewing suggested commands!`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    `How do I solve "${currentChallenge.title}"?`,
    'Explain the command flags needed here',
    'What LPIC exam traps should I watch out for?',
    'Why is Linux file hierarchy structured this way?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#11141f] border border-teal-500/30 rounded-3xl shadow-2xl shadow-teal-950/30 overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Mentor Header */}
        <div className="p-4 sm:px-6 bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-2xl shadow-lg shadow-teal-500/20 border border-teal-300/40">
              <span>🐱</span>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100">Commander Whiskers</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 font-mono">
                  LPIC Senior Proctor
                </span>
              </div>
              <p className="text-xs text-slate-400">AI Linux Mentor • Live Terminal Companion</p>
            </div>
          </div>

          <button
            id="close-mentor-btn"
            onClick={() => {
              soundFx.playKeypress();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Message Scroll Area */}
        <div ref={messagesContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs sm:text-sm">
          {messages.map((msg) => {
            const isMentor = msg.sender === 'mentor';
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isMentor ? '' : 'flex-row-reverse'}`}>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base border ${
                    isMentor
                      ? 'bg-teal-950/60 border-teal-500/40 text-teal-300 shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {isMentor ? '🐱' : '👤'}
                </div>

                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    isMentor
                      ? 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm font-sans'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-slate-950 font-medium rounded-tr-sm shadow-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-950/60 border border-teal-500/40 flex items-center justify-center text-base">
                🐱
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce delay-200" />
                <span>Commander Whiskers is formulating advice...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-slate-500 flex-shrink-0">Ask:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-[11px] text-slate-300 hover:text-teal-300 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-3 sm:p-4 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2">
          <input
            id="mentor-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask Commander Whiskers anything about Linux or this challenge..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-teal-500/50 transition"
          />
          <button
            id="send-mentor-msg-btn"
            onClick={() => handleSendMessage()}
            disabled={loading || !inputVal.trim()}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-slate-950 font-bold transition shadow-md shadow-teal-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
