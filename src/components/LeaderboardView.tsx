import React, { useState, useEffect } from 'react';
import { LEADERBOARD_DATA } from '../data/leaderboardData';
import { LeaderboardEntry, UserProgress } from '../types';
import { Trophy, Flame, Award, Shield, Sparkles, Calendar, Zap, Star, Cloud } from 'lucide-react';
import { soundFx } from '../lib/audio';
import { fetchLeaderboardEntries, auth } from '../lib/firebase';

interface LeaderboardViewProps {
  progress: UserProgress;
  onUseFreezeToken?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  progress,
  onUseFreezeToken,
}) => {
  const [activeCategory, setActiveCategory] = useState<'xp' | 'streak' | 'exam'>('xp');
  const [cloudEntries, setCloudEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (auth.currentUser) {
      fetchLeaderboardEntries()
        .then((entries) => {
          if (isMounted && entries && entries.length > 0) {
            setCloudEntries(entries);
          }
        })
        .catch(() => {
          // fallback to offline leaderboard
        });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Inject current user into leaderboard
  const userExamScore = progress.examHistory && progress.examHistory.length > 0
    ? Math.max(...progress.examHistory.map((e) => e.score))
    : 0;

  const userEntry: LeaderboardEntry = {
    rank: 0,
    username: `${progress.userName} (You)`,
    avatar: progress.avatarId || '🐱',
    title: progress.callsign || 'Candidate SysAdmin',
    level: Math.floor(progress.xp / 500) + 1,
    xp: progress.xp,
    streak: progress.streak,
    examScore: userExamScore,
    country: auth.currentUser ? 'CLOUD' : 'MEOW',
    isUser: true,
  };

  // Merge cloud entries if present, excluding current user if they exist in cloud entries
  const otherCloudEntries = cloudEntries.filter((e) => !e.isUser);
  const baseList = otherCloudEntries.length > 0 ? otherCloudEntries : LEADERBOARD_DATA;
  const combinedList = [...baseList, userEntry];

  if (activeCategory === 'xp') {
    combinedList.sort((a, b) => b.xp - a.xp);
  } else if (activeCategory === 'streak') {
    combinedList.sort((a, b) => b.streak - a.streak);
  } else {
    combinedList.sort((a, b) => b.examScore - a.examScore);
  }

  // Re-assign ranks
  const rankedList = combinedList.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));

  // Generate simulated 14-day streak activity
  const pastDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const isToday = i === 13;
    const isActive = i >= 14 - Math.min(14, progress.streak);
    return {
      dayStr: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      dateNum: d.getDate(),
      isActive,
      isToday,
    };
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Global Rankings & Streak Command */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Leaderboard Header */}
        <div className="lg:col-span-8 bg-gradient-to-r from-[#12192b] via-[#101420] to-[#162136] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Global Feline Leaderboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
              Top Cat SysAdmins of the World
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Compete against top feline engineers across the globe. Earn XP by conquering LPIC quests, maintaining your daily streak, and achieving top scores on certified simulations.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategory('xp')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'xp'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Total XP Rankings</span>
            </button>
            <button
              onClick={() => setActiveCategory('streak')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'streak'
                  ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Longest Streaks</span>
            </button>
            <button
              onClick={() => setActiveCategory('exam')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'exam'
                  ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>LPIC Exam High Scores</span>
            </button>
          </div>
        </div>

        {/* Right: Interactive Daily Streak Hub */}
        <div className="lg:col-span-4 bg-[#111624] border border-orange-500/30 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                <Flame className="w-4 h-4 fill-orange-500" />
                <span>Active Daily Streak</span>
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                1.2x XP Multiplier Active
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-100 font-mono">
                {progress.streak}
              </span>
              <span className="text-sm font-bold text-orange-400">Days Consecutive</span>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Longest recorded record: <strong className="text-slate-200">{Math.max(progress.longestStreak || progress.streak, progress.streak)} Days</strong>
            </p>
          </div>

          {/* 14-day Calendar Activity Dots */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">Past 14 Days Activity:</span>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {pastDays.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">{d.dayStr}</span>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition ${
                      d.isActive
                        ? 'bg-orange-500 text-slate-950 shadow-sm shadow-orange-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {d.dateNum}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Freeze & Powerups */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Freeze Tokens: <strong className="text-slate-200">{progress.freezeTokens || 1}</strong></span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">Streak Protected</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#111420] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">
            {activeCategory === 'xp' ? 'All-Time XP Standing' : activeCategory === 'streak' ? 'Streak Records' : 'Exam Simulation Top Scorers'}
          </h3>
          <span className="text-xs text-slate-400">Updated Real-Time</span>
        </div>

        <div className="divide-y divide-slate-800/60 overflow-x-auto">
          {rankedList.map((entry) => {
            const isTop3 = entry.rank <= 3;
            const rankBadgeColor = entry.rank === 1
              ? 'bg-amber-500 text-slate-950 font-black'
              : entry.rank === 2
              ? 'bg-slate-300 text-slate-950 font-black'
              : entry.rank === 3
              ? 'bg-amber-700 text-slate-100 font-black'
              : 'bg-slate-800 text-slate-400 font-bold';

            return (
              <div
                key={entry.username}
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition ${
                  entry.isUser
                    ? 'bg-emerald-950/30 border-l-4 border-l-emerald-500'
                    : 'hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${rankBadgeColor}`}>
                    {entry.rank}
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl flex-shrink-0">
                    {entry.avatar}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100 truncate">
                        {entry.username}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {entry.country}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {entry.title} • <span className="text-emerald-400 font-medium">Lv.{entry.level}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-10 text-right flex-shrink-0">
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-orange-400 flex items-center justify-end gap-1">
                      <Flame className="w-3.5 h-3.5 fill-orange-500" />
                      <span>{entry.streak}d</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Streak</div>
                  </div>

                  <div className="hidden sm:block">
                    <div className="text-xs font-bold font-mono text-blue-400">
                      {entry.examScore}/800
                    </div>
                    <div className="text-[10px] text-slate-400">Exam Best</div>
                  </div>

                  <div>
                    <div className="text-sm font-bold font-mono text-amber-400">
                      {entry.xp.toLocaleString()} XP
                    </div>
                    <div className="text-[10px] text-slate-400">Score</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
