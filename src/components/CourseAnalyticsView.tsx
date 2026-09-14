import React from 'react';
import { UserProgress } from '../types';
import { LPIC_LEVEL_INFO, CHALLENGES } from '../data/lpicCurriculum';
import { BarChart3, TrendingUp, Award, Clock, Terminal, CheckCircle2, ArrowRight, Zap, Target } from 'lucide-react';
import { soundFx } from '../lib/audio';

interface CourseAnalyticsViewProps {
  progress: UserProgress;
  onNavigateToLevel: (levelId: any) => void;
}

export const CourseAnalyticsView: React.FC<CourseAnalyticsViewProps> = ({
  progress,
  onNavigateToLevel,
}) => {
  // Calculate completion percentage per LPIC tier
  const tierStats = LPIC_LEVEL_INFO.map((tier) => {
    const tierChallenges = CHALLENGES.filter((c) => c.lpicLevel === tier.id);
    const completedCount = tierChallenges.filter((c) => progress.completedChallenges.includes(c.id)).length;
    const percentage = tierChallenges.length > 0
      ? Math.round((completedCount / tierChallenges.length) * 100)
      : 0;

    return {
      ...tier,
      total: tierChallenges.length,
      completed: completedCount,
      percentage,
    };
  });

  const totalChallenges = CHALLENGES.length;
  const totalCompleted = progress.completedChallenges.length;
  const overallPercentage = Math.round((totalCompleted / totalChallenges) * 100);

  // Identify lowest completion domain to recommend next
  const lowestTier = [...tierStats].sort((a, b) => a.percentage - b.percentage)[0] || tierStats[0];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Analytics Overview Banner */}
      <div className="bg-gradient-to-r from-[#121929] via-[#101420] to-[#162238] border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Telemetry & Certification Analytics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
            Learning Curve & Proficiency
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time tracking of LPIC objectives mastered, terminal commands diversity, exam readiness indicators, and retention metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 self-stretch md:self-auto">
          <div className="text-center px-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {overallPercentage}%
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total LPIC Completion</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111624] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Terminal Shell Commands</span>
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {progress.totalCommandsRun || 48}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold">Active Shell Operations</div>
        </div>

        <div className="bg-[#111624] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Quests Conquered</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {totalCompleted} / {totalChallenges}
          </div>
          <div className="text-[10px] text-cyan-400 font-semibold">{totalChallenges - totalCompleted} Remaining</div>
        </div>

        <div className="bg-[#111624] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Cert Badges Earned</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {progress.earnedBadges.length}
          </div>
          <div className="text-[10px] text-amber-400 font-semibold">Diplomas & Medals</div>
        </div>

        <div className="bg-[#111624] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Daily Streak Factor</span>
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {progress.streak} Days
          </div>
          <div className="text-[10px] text-orange-400 font-semibold">1.2x Multiplier Active</div>
        </div>
      </div>

      {/* LPIC Curriculum Mastery Tracks */}
      <div className="bg-[#111420] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              LPIC Curriculum Competency Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Progress by certification exam and knowledge domain
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {tierStats.map((tier) => (
            <div
              key={tier.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{tier.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {tier.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tier.description}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold font-mono text-emerald-400">
                    {tier.completed} / {tier.total} ({tier.percentage}%)
                  </div>
                  <button
                    onClick={() => {
                      soundFx.playKeypress();
                      onNavigateToLevel(tier.id);
                    }}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 underline mt-0.5"
                  >
                    View Missions
                  </button>
                </div>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${tier.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation Widget */}
      <div className="bg-gradient-to-r from-purple-950/30 via-[#13111f] to-[#161226] border border-purple-500/30 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
            <Target className="w-4 h-4" />
            <span>Commander Whiskers&apos; Next Recommendation</span>
          </div>
          <h4 className="text-base font-bold text-slate-100">
            Recommended Focus: {lowestTier.name} ({lowestTier.code})
          </h4>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Based on your curriculum telemetry, leveling up this certification track will maximize your composite score for the official LPIC exams.
          </p>
        </div>

        <button
          onClick={() => {
            soundFx.playEnter();
            onNavigateToLevel(lowestTier.id);
          }}
          className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-slate-100 font-bold text-xs transition shadow-lg shadow-purple-600/20 flex items-center gap-1.5 flex-shrink-0"
        >
          <span>Jump to {lowestTier.name}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
