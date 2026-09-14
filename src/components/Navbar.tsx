import React from 'react';
import { Terminal, Award, Sparkles, Volume2, VolumeX, Flame, Bot, RotateCcw, User as UserIcon, Layers, ShieldAlert, BookOpen, Server, Trophy, BarChart3, Settings, Sun, Moon, CloudCheck } from 'lucide-react';
import { UserProgress } from '../types';
import { soundFx } from '../lib/audio';
import { User } from 'firebase/auth';

export type ActiveNavView =
  | 'quests'
  | 'skilltree'
  | 'boss'
  | 'exam'
  | 'containers'
  | 'leaderboard'
  | 'analytics'
  | 'cms';

interface NavbarProps {
  progress: UserProgress;
  currentUser?: User | null;
  activeView: ActiveNavView;
  setActiveView: (view: ActiveNavView) => void;
  onOpenCertificates: () => void;
  onOpenMentor: () => void;
  onOpenProfile: () => void;
  onToggleSound: () => void;
  onResetChallenge: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  progress,
  currentUser,
  activeView,
  setActiveView,
  onOpenCertificates,
  onOpenMentor,
  onOpenProfile,
  onToggleSound,
  onResetChallenge,
  theme,
  onToggleTheme,
}) => {
  // Rank calculations based on XP
  const getCatRank = (xp: number) => {
    if (xp >= 1500) return { rank: 'Felis Apex Master', level: 9, next: 2500 };
    if (xp >= 1000) return { rank: 'Arch-Panther (Root)', level: 8, next: 1500 };
    if (xp >= 700) return { rank: 'Kernel Commander', level: 7, next: 1000 };
    if (xp >= 450) return { rank: 'SysAdmin Siamese', level: 6, next: 700 };
    if (xp >= 280) return { rank: 'Bash Bobcat', level: 5, next: 450 };
    if (xp >= 160) return { rank: 'Terminal Tabby', level: 4, next: 280 };
    if (xp >= 80) return { rank: 'Claw Tech', level: 3, next: 160 };
    if (xp >= 40) return { rank: 'Prowler Kitten', level: 2, next: 80 };
    return { rank: 'Stray Kitten', level: 1, next: 40 };
  };

  const rankInfo = getCatRank(progress.xp);
  const prevThreshold = rankInfo.level === 1 ? 0 : [0, 40, 80, 160, 280, 450, 700, 1000, 1500][rankInfo.level - 1] || 0;
  const xpInLevel = Math.max(0, progress.xp - prevThreshold);
  const xpNeeded = rankInfo.next - prevThreshold;
  const progressPct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  const navItems: { id: ActiveNavView; label: string; icon: any; highlight?: string }[] = [
    { id: 'quests', label: 'Quests', icon: Terminal },
    { id: 'skilltree', label: 'Tech Tree', icon: Layers },
    { id: 'boss', label: 'Boss Crisis', icon: ShieldAlert, highlight: 'text-rose-400' },
    { id: 'exam', label: 'Exam Sim', icon: BookOpen },
    { id: 'containers', label: 'Sandbox', icon: Server },
    { id: 'leaderboard', label: 'Ranks & Streaks', icon: Trophy },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'cms', label: 'CMS Studio', icon: Settings },
  ];

  return (
    <header className="w-full bg-[#131722]/95 backdrop-blur border-b border-slate-800/80 sticky top-0 z-30 px-3 sm:px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        {/* Top Tier: Logo, Gamification XP Bar, Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveView('quests')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <span className="text-lg">🐱</span>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-900 border border-emerald-400 flex items-center justify-center">
                <Terminal className="w-2 h-2 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  MeowLinux
                </span>
                <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 hidden sm:inline">
                  LPIC Academy
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block leading-tight">Gamified Linux Terminal Challenges</p>
            </div>
          </div>

          {/* User Rank & XP Progress Bar */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 font-mono">
                Lv.{rankInfo.level}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-200">{rankInfo.rank}</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">{progress.xp} XP</span>
                </div>
                {/* XP Progress Bar */}
                <div className="w-24 sm:w-32 bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* Streak Flame */}
            <div
              onClick={() => setActiveView('leaderboard')}
              className="flex items-center gap-1 text-sm font-medium text-orange-400 cursor-pointer hover:opacity-90 transition"
              title="Consecutive Day Streak"
            >
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
              <span className="font-mono font-bold">{progress.streak}</span>
              <span className="text-xs text-slate-400 hidden lg:inline">streak</span>
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Commander Whiskers AI Button */}
            <button
              id="open-mentor-btn"
              onClick={() => {
                soundFx.playMeow();
                onOpenMentor();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 hover:border-teal-400/60 text-teal-300 text-xs sm:text-sm font-semibold transition"
              title="Commander Whiskers AI Mentor"
            >
              <Bot className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">AI Mentor</span>
            </button>

            {/* Badges & Diplomas */}
            <button
              id="open-certificates-btn"
              onClick={() => {
                soundFx.playKeypress();
                onOpenCertificates();
              }}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 text-xs sm:text-sm font-semibold transition"
              title="Certification Diplomas & Badges"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Badges</span>
              {progress.earnedBadges.length > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {progress.earnedBadges.length}
                </span>
              )}
            </button>

            {/* Profile Customizer & Cloud Account */}
            <button
              id="open-profile-btn"
              onClick={() => {
                soundFx.playKeypress();
                onOpenProfile();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition ${
                currentUser
                  ? 'bg-slate-900 border-emerald-500/40 hover:border-emerald-500 text-slate-100'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
              } text-xs sm:text-sm font-semibold`}
              title={currentUser ? `Signed in as ${currentUser.email || currentUser.displayName} (Cloud Synced)` : 'User Profile & Cloud Sync'}
            >
              <div className="relative flex items-center justify-center">
                <span className="text-sm">{progress.avatarId || '🐱'}</span>
                {currentUser && (
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center" title="Cloud Active" />
                )}
              </div>
              <span className="hidden md:inline truncate max-w-[80px]">{progress.userName?.split(' ')[0] || 'Me'}</span>
              {currentUser && <CloudCheck className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline" />}
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              id="toggle-theme-btn"
              onClick={onToggleTheme}
              className={`p-1.5 rounded-xl border transition ${
                theme === 'light'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20'
                  : 'bg-slate-900 border-slate-800 text-amber-400 hover:border-amber-500/40'
              }`}
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            >
              {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Sound Toggle */}
            <button
              id="toggle-sound-btn"
              onClick={onToggleSound}
              className={`p-1.5 rounded-xl border transition ${
                progress.soundEnabled
                  ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:border-emerald-500/40'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={progress.soundEnabled ? 'Mute sound FX' : 'Enable retro audio'}
            >
              {progress.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Reset Challenge button (when in quests) */}
            {activeView === 'quests' && (
              <button
                id="reset-challenge-btn"
                onClick={onResetChallenge}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
                title="Reset current challenge environment"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Tier: Mode Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => {
                  soundFx.playKeypress();
                  setActiveView(item.id);
                }}
                className={`py-1.5 px-3 rounded-xl font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : `text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 ${item.highlight || ''}`
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
