import React, { useState } from 'react';
import { DailyQuest } from '../types';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, Gift, Flame, Clock } from 'lucide-react';
import { soundFx } from '../lib/audio';

interface DailyQuestsBarProps {
  quests: DailyQuest[];
  onClaimQuest: (questId: string) => void;
  streak: number;
}

export const DailyQuestsBar: React.FC<DailyQuestsBarProps> = ({
  quests,
  onClaimQuest,
  streak,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedCount = quests.filter((q) => q.completed).length;
  const unclaimedCount = quests.filter((q) => q.completed && !q.claimed).length;

  return (
    <div className="bg-[#111624] border border-slate-800 rounded-2xl p-3 shadow-lg transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-sm">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">Daily Training Quests</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                {completedCount}/{quests.length} Done
              </span>
              {unclaimedCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold animate-pulse">
                  {unclaimedCount} Ready to Claim!
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Resets daily at 00:00 UTC • Complete all for streak bonus</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-orange-400">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>{streak} Day Streak</span>
          </div>

          <button
            id="toggle-daily-quests-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
          >
            <span className="text-[11px] font-medium hidden sm:inline">{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {quests.map((q) => {
            const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
            return (
              <div
                key={q.id}
                className={`p-3 rounded-xl border transition-all ${
                  q.claimed
                    ? 'bg-slate-900/50 border-slate-800 opacity-70'
                    : q.completed
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">{q.title}</h5>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{q.description}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                    +{q.xpReward} XP
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>Progress</span>
                  <span>{q.progress} / {q.target}</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      q.completed ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-2.5">
                  {q.claimed ? (
                    <div className="flex items-center justify-center gap-1 py-1 text-[11px] text-slate-500 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Claimed</span>
                    </div>
                  ) : q.completed ? (
                    <button
                      id={`claim-quest-${q.id}`}
                      onClick={() => {
                        soundFx.playSuccess();
                        onClaimQuest(q.id);
                      }}
                      className="w-full py-1 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm"
                    >
                      Claim +{q.xpReward} XP
                    </button>
                  ) : (
                    <div className="text-center py-1 text-[10px] text-slate-400 font-medium">
                      In Progress ({pct}%)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
