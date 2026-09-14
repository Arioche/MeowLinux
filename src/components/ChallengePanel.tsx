import React, { useState } from 'react';
import { Challenge } from '../types';
import { CheckCircle2, Circle, Lightbulb, BookOpen, ShieldCheck, ChevronRight, Sparkles, Bot, AlertCircle } from 'lucide-react';
import { soundFx } from '../lib/audio';

interface ChallengePanelProps {
  challenge: Challenge;
  isCompleted: boolean;
  onVerify: () => void;
  onNextChallenge?: () => void;
  onOpenMentor: () => void;
  completedTasks: boolean[];
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({
  challenge,
  isCompleted,
  onVerify,
  onNextChallenge,
  onOpenMentor,
  completedTasks,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'hints' | 'lpicNotes'>('tasks');
  const [revealedHints, setRevealedHints] = useState<number>(0);

  const handleRevealHint = () => {
    soundFx.playKeypress();
    setRevealedHints((prev) => Math.min(challenge.hints.length, prev + 1));
  };

  return (
    <div className="flex flex-col bg-[#11141f] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Header with Title and XP */}
      <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-semibold">
              {challenge.lpicCode}
            </span>
            <span className="text-xs font-semibold text-teal-400">🐾 {challenge.catCodename}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-mono">+{challenge.xp} XP</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
            {challenge.title}
            {isCompleted && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            )}
          </h3>
        </div>

        {/* Ask Commander Whiskers Quick Trigger */}
        <button
          id="panel-ask-mentor-btn"
          onClick={() => {
            soundFx.playMeow();
            onOpenMentor();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-medium transition flex-shrink-0"
        >
          <Bot className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">Ask Whiskers</span>
        </button>
      </div>

      {/* Narrative Scenario */}
      <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/60 text-xs text-slate-300 leading-relaxed">
        <p className="italic text-slate-400">"{challenge.scenario}"</p>
      </div>

      {/* Sub Tabs: Tasks / Hints / LPIC Exam Notes */}
      <div className="flex items-center border-b border-slate-800/80 bg-slate-900/30 px-3 pt-2 gap-2 text-xs">
        <button
          id="subtab-tasks-btn"
          onClick={() => {
            soundFx.playKeypress();
            setActiveSubTab('tasks');
          }}
          className={`pb-2 px-2 font-medium border-b-2 transition-all ${
            activeSubTab === 'tasks'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Objective Checklist
        </button>
        <button
          id="subtab-hints-btn"
          onClick={() => {
            soundFx.playKeypress();
            setActiveSubTab('hints');
          }}
          className={`pb-2 px-2 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'hints'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          Hints ({challenge.hints.length})
        </button>
        <button
          id="subtab-lpicnotes-btn"
          onClick={() => {
            soundFx.playKeypress();
            setActiveSubTab('lpicNotes');
          }}
          className={`pb-2 px-2 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'lpicNotes'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          LPIC Exam Theory
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar text-xs">
        {activeSubTab === 'tasks' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 font-medium">
              🎯 <strong>Mission Goal:</strong> {challenge.objective}
            </div>

            <div className="space-y-2 mt-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Verification Criteria
              </span>
              {challenge.verifications.map((v, idx) => {
                const isTaskDone = completedTasks[idx] || isCompleted;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                      isTaskDone
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isTaskDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs ${isTaskDone ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {v.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggested Commands Cheat Pills */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Relevant Linux Commands
              </span>
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {challenge.suggestedCommands.map((cmd, i) => (
                  <code
                    key={i}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px]"
                  >
                    {cmd}
                  </code>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'hints' && (
          <div className="space-y-3">
            <p className="text-slate-400 text-xs">
              Stuck? Commander Whiskers leaves progressive paw-prints to guide your commands:
            </p>

            <div className="space-y-2">
              {challenge.hints.slice(0, revealedHints).map((hint, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200">
                  <div className="flex items-center gap-1.5 font-semibold text-[11px] text-amber-400 mb-1">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Hint #{idx + 1}</span>
                  </div>
                  <p className="text-xs leading-relaxed font-mono">{hint}</p>
                </div>
              ))}
            </div>

            {revealedHints < challenge.hints.length ? (
              <button
                id="reveal-hint-btn"
                onClick={handleRevealHint}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-medium transition flex items-center justify-center gap-2"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Reveal Next Hint ({revealedHints}/{challenge.hints.length})</span>
              </button>
            ) : (
              <p className="text-[11px] text-slate-500 text-center italic">All hints revealed for this mission.</p>
            )}
          </div>
        )}

        {activeSubTab === 'lpicNotes' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-200">
              <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300 mb-1.5">
                <BookOpen className="w-4 h-4" />
                <span>LPIC Exam Domain Pointer</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">{challenge.lpicExamNotes}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
              💡 <strong>Exam Strategy:</strong> The Linux Professional Institute tests practical command syntax, flags, exit codes, and configuration file paths. Testing these in MeowLinux helps build genuine muscle memory!
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions: Check / Next */}
      <div className="p-3.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between gap-3">
        <button
          id="verify-mission-btn"
          onClick={() => {
            soundFx.playEnter();
            onVerify();
          }}
          className="flex-1 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 hover:border-slate-600 transition flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verify Mission</span>
        </button>

        {isCompleted && onNextChallenge && (
          <button
            id="next-mission-btn"
            onClick={() => {
              soundFx.playSuccess();
              onNextChallenge();
            }}
            className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 animate-pulse"
          >
            <span>Next Quest</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
