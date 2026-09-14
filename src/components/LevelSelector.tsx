import React from 'react';
import { LPICLevelId, Challenge } from '../types';
import { LPIC_LEVEL_INFO, CHALLENGES } from '../data/lpicCurriculum';
import { CheckCircle2, Lock, Play, Sparkles, ChevronRight, Award } from 'lucide-react';
import { soundFx } from '../lib/audio';

interface LevelSelectorProps {
  selectedLevel: LPICLevelId;
  onSelectLevel: (levelId: LPICLevelId) => void;
  currentChallengeId: string;
  onSelectChallenge: (challenge: Challenge) => void;
  completedChallengeIds: string[];
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  selectedLevel,
  onSelectLevel,
  currentChallengeId,
  onSelectChallenge,
  completedChallengeIds,
}) => {
  const currentLevelChallenges = CHALLENGES.filter((c) => c.lpicLevel === selectedLevel);
  const activeLevelMeta = LPIC_LEVEL_INFO.find((lvl) => lvl.id === selectedLevel);

  return (
    <div className="flex flex-col bg-[#11141f] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Tier Selector Navigation */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {LPIC_LEVEL_INFO.map((tier) => {
          const tierChallenges = CHALLENGES.filter((c) => c.lpicLevel === tier.id);
          const completedCount = tierChallenges.filter((c) => completedChallengeIds.includes(c.id)).length;
          const isSelected = selectedLevel === tier.id;
          const isCertified = completedCount === tierChallenges.length && tierChallenges.length > 0;

          return (
            <button
              key={tier.id}
              id={`track-${tier.id}`}
              onClick={() => {
                soundFx.playKeypress();
                onSelectLevel(tier.id as LPICLevelId);
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-slate-800 border border-slate-700 text-slate-100 shadow-md'
                  : 'bg-slate-900/40 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold ${isSelected ? tier.accentColor : 'text-slate-300'}`}>
                    {tier.name}
                  </span>
                  {isCertified && (
                    <Award className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span>{tier.code}</span>
                  <span>•</span>
                  <span>{completedCount}/{tierChallenges.length} passed</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Level Summary Header */}
      {activeLevelMeta && (
        <div className={`p-4 bg-gradient-to-r ${activeLevelMeta.themeColor} border-b border-slate-800/80`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-emerald-400 font-semibold">
                  LPIC {activeLevelMeta.code}
                </span>
                <span className="text-xs font-semibold text-slate-300">{activeLevelMeta.subtitle}</span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1">{activeLevelMeta.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl leading-relaxed">{activeLevelMeta.description}</p>
            </div>

            {/* Certification Badge Teaser */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/60 border border-slate-800 min-w-20">
              <span className="text-[10px] text-slate-400 font-medium uppercase">Badge</span>
              <span className="text-xs font-bold text-amber-400 mt-0.5">{activeLevelMeta.badgeName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Missions List for the Tier */}
      <div className="p-3 space-y-2 max-h-[380px] lg:max-h-[480px] overflow-y-auto custom-scrollbar">
        {currentLevelChallenges.map((challenge, idx) => {
          const isCompleted = completedChallengeIds.includes(challenge.id);
          const isActive = challenge.id === currentChallengeId;

          return (
            <div
              key={challenge.id}
              id={`mission-card-${challenge.id}`}
              onClick={() => {
                soundFx.playKeypress();
                onSelectChallenge(challenge);
              }}
              className={`group relative flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                  : isCompleted
                  ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  : 'bg-slate-900/30 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* Status Indicator Icon */}
                <div className="pt-0.5">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs animate-pulse">
                      <Play className="w-3 h-3 fill-slate-950 ml-0.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Challenge Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-400">{challenge.lpicCode}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] text-teal-400 font-medium">{challenge.catCodename}</span>
                  </div>
                  <h4 className={`text-xs sm:text-sm font-semibold truncate mt-0.5 ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {challenge.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{challenge.objective}</p>
                </div>
              </div>

              {/* Reward & Difficulty Tag */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                  +{challenge.xp} XP
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                  {challenge.difficulty}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
