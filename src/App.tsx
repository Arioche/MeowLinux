import React, { useState, useEffect, useRef } from 'react';
import { LPICLevelId, Challenge, UserProgress, TerminalEntry, ExamResult } from './types';
import { LPIC_LEVEL_INFO, CHALLENGES } from './data/lpicCurriculum';
import { DEFAULT_DAILY_QUESTS } from './data/dailyQuests';
import { VirtualFileSystem } from './lib/vfs';
import { TerminalEngine, CommandContext } from './lib/terminalEngine';
import { soundFx } from './lib/audio';

import { Navbar, ActiveNavView } from './components/Navbar';
import { DailyQuestsBar } from './components/DailyQuestsBar';
import { LevelSelector } from './components/LevelSelector';
import { ChallengePanel } from './components/ChallengePanel';
import { Terminal } from './components/Terminal';
import { SkillTreeView } from './components/SkillTreeView';
import { BossChallengeView } from './components/BossChallengeView';
import { ExamSimulatorView } from './components/ExamSimulatorView';
import { ContainerManagerView } from './components/ContainerManagerView';
import { LeaderboardView } from './components/LeaderboardView';
import { CourseAnalyticsView } from './components/CourseAnalyticsView';
import { CmsStudioView } from './components/CmsStudioView';
import { UserProfileModal } from './components/UserProfileModal';
import { NanoModal } from './components/NanoModal';
import { CertificateModal } from './components/CertificateModal';
import { AiMentorModal } from './components/AiMentorModal';

import { Trophy, ChevronRight } from 'lucide-react';
import { auth, testFirestoreConnection, syncProgressToCloud, fetchUserProgressFromCloud } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const STORAGE_KEY = 'meowlinux_user_progress_v3';

export default function App() {
  // Initialize user progress from localStorage
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.dailyQuests || parsed.dailyQuests.length === 0) {
          parsed.dailyQuests = DEFAULT_DAILY_QUESTS;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return {
      xp: 120,
      completedChallenges: ['les-01'],
      earnedBadges: ['badge-first-step'],
      streak: 4,
      longestStreak: 7,
      freezeTokens: 2,
      lastActiveDate: new Date().toISOString().split('T')[0],
      streakHistory: [],
      unlockedLevels: ['essentials', 'lpic1-101'],
      soundEnabled: true,
      userName: 'Candidate Tabby',
      callsign: 'Junior Whisker SysAdmin',
      userBio: 'Studying for LPIC-1 certification with interactive Linux terminal challenges.',
      avatarId: '🐱',
      preferredShell: '/bin/bash',
      favoriteBadgeId: 'badge-first-step',
      totalCommandsRun: 32,
      completedBossBattles: [],
      examHistory: [],
      unlockedSkills: ['skill-fhs'],
      activeContainerId: 'ubuntu-2404',
      customChallenges: [],
      dailyQuests: DEFAULT_DAILY_QUESTS,
      lastDailyResetDate: new Date().toISOString().split('T')[0],
    };
  });

  // Save progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress]);

  // Firebase Authentication & Cloud Sync
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Test connection quietly for diagnostics
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        try {
          const cloudData = await fetchUserProgressFromCloud(u.uid);
          if (cloudData) {
            setProgress((prev) => ({
              ...prev,
              ...cloudData,
              userName: cloudData.userName || u.displayName || prev.userName,
            }));
          } else {
            // First time this authenticated user signs in: seed their profile with current progress
            await syncProgressToCloud(u, progress);
          }
        } catch (err) {
          console.warn('Initial cloud sync notice:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Background auto-save to cloud when authenticated
  useEffect(() => {
    if (!firebaseUser) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(() => {
      syncProgressToCloud(firebaseUser, progress).catch((err) => {
        console.warn('Auto cloud sync notice:', err);
      });
    }, 2000);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [progress, firebaseUser]);

  // Sync soundFx toggle
  useEffect(() => {
    soundFx.enabled = progress.soundEnabled;
  }, [progress.soundEnabled]);

  // Theme state: default to 'light' (as requested), persistable to localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('meowlinux_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('meowlinux_theme', theme);
    } catch {
      // ignore
    }
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    soundFx.playKeypress();
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  // Active navigation view
  const [activeView, setActiveView] = useState<ActiveNavView>('quests');

  // Active LPIC level & challenge
  const [selectedLevel, setSelectedLevel] = useState<LPICLevelId>('essentials');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(CHALLENGES[0]);

  // Terminal state
  const [cwd, setCwd] = useState<string>('/home/meow');
  const [currentUser, setCurrentUser] = useState<string>('meow');
  const [history, setHistory] = useState<TerminalEntry[]>([
    {
      id: 'welcome-0',
      output: `========================================================================\n  🐾 MEOWLINUX OS 2026.1 (Calico LTS) - LPIC ACADEMY TERMINAL 🐾\n========================================================================\nType 'help' for available commands, 'ls -la' to explore files.\nReady for LPIC challenges! Commander Whiskers is on standby.\n`,
      type: 'ascii',
    },
  ]);

  // VFS & Terminal Engine instances
  const vfsRef = useRef<VirtualFileSystem>(new VirtualFileSystem());
  const engineRef = useRef<TerminalEngine>(new TerminalEngine());

  // Completed tasks status for the current challenge
  const [completedTasks, setCompletedTasks] = useState<boolean[]>([]);
  const [justCompletedChallenge, setJustCompletedChallenge] = useState<Challenge | null>(null);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<string | null>(null);

  // Modals state
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [nanoState, setNanoState] = useState<{ isOpen: boolean; path: string; content: string }>({
    isOpen: false,
    path: '',
    content: '',
  });

  // Setup initial filesystem & CWD for challenge
  const setupChallengeEnvironment = (challenge: Challenge) => {
    const vfs = new VirtualFileSystem();

    if (challenge.initialFilesystem) {
      for (const [path, fileObj] of Object.entries(challenge.initialFilesystem)) {
        vfs.setFile(path, (fileObj as any).content, '/', {
          permissions: (fileObj as any).permissions,
          owner: (fileObj as any).owner,
          group: (fileObj as any).group,
        });
      }
    }

    vfsRef.current = vfs;
    setCwd(challenge.initialCwd || '/home/meow');
    setCurrentUser('meow');
    setCompletedTasks(new Array(challenge.verifications.length).fill(false));
  };

  // When challenge changes, setup environment
  useEffect(() => {
    setupChallengeEnvironment(currentChallenge);
  }, [currentChallenge.id]);

  // Track daily quests progress
  const updateDailyQuestProgress = (type: string, amount: number = 1) => {
    setProgress((prev) => {
      const updatedQuests = (prev.dailyQuests || DEFAULT_DAILY_QUESTS).map((q) => {
        if (q.type === type && !q.completed) {
          const nextProg = q.progress + amount;
          const isDone = nextProg >= q.target;
          return {
            ...q,
            progress: nextProg,
            completed: isDone,
          };
        }
        return q;
      });

      return {
        ...prev,
        dailyQuests: updatedQuests,
      };
    });
  };

  // Claim Daily Quest reward
  const handleClaimDailyQuest = (questId: string) => {
    setProgress((prev) => {
      const quest = prev.dailyQuests.find((q) => q.id === questId);
      if (!quest || quest.claimed) return prev;

      const newQuests = prev.dailyQuests.map((q) =>
        q.id === questId ? { ...q, claimed: true } : q
      );

      return {
        ...prev,
        xp: prev.xp + quest.xpReward,
        dailyQuests: newQuests,
      };
    });
  };

  // Verify challenge criteria
  const verifyCurrentChallenge = (lastCommandResult?: any) => {
    const vfs = vfsRef.current;
    const results: boolean[] = [];

    for (let i = 0; i < currentChallenge.verifications.length; i++) {
      const v = currentChallenge.verifications[i];
      let ok = false;

      if (v.type === 'cwd') {
        ok = cwd === v.path;
      } else if (v.type === 'file_exists' && v.path) {
        const node = vfs.getNode(v.path, cwd);
        ok = node !== null;
      } else if (v.type === 'file_missing' && v.path) {
        const node = vfs.getNode(v.path, cwd);
        ok = node === null;
      } else if (v.type === 'file_contains' && v.path) {
        const node = vfs.getNode(v.path, cwd);
        if (node && node.type === 'file') {
          if (typeof v.contentMatch === 'string') {
            ok = node.content.includes(v.contentMatch);
          } else if (v.contentMatch instanceof RegExp) {
            ok = v.contentMatch.test(node.content);
          }
        }
      } else if (v.type === 'file_permissions' && v.path) {
        const node = vfs.getNode(v.path, cwd);
        if (node && v.permissionsMatch) {
          const currentOctal = VirtualFileSystem.rwxToOctal(node.permissions);
          ok = currentOctal === v.permissionsMatch;
        }
      } else if (v.type === 'command_output') {
        ok = completedTasks[i] || (lastCommandResult && lastCommandResult.type !== 'error');
      }

      results.push(ok);
    }

    setCompletedTasks(results);

    // If all tasks pass and challenge not previously completed
    const allPassed = results.length > 0 && results.every(Boolean);
    const alreadyCompleted = progress.completedChallenges.includes(currentChallenge.id);

    if (allPassed && !alreadyCompleted) {
      soundFx.playSuccess();
      setJustCompletedChallenge(currentChallenge);
      updateDailyQuestProgress('complete_mission', 1);

      const nextCompleted = [...progress.completedChallenges, currentChallenge.id];
      const newXp = progress.xp + currentChallenge.xp;
      const newEarnedBadges = [...progress.earnedBadges];

      // First Step badge
      if (!newEarnedBadges.includes('badge-first-step')) {
        newEarnedBadges.push('badge-first-step');
        setNewlyEarnedBadge('First Paws');
      }

      // Check if LPIC tier certification badge is unlocked
      const tierChallenges = CHALLENGES.filter((c) => c.lpicLevel === currentChallenge.lpicLevel);
      const tierCompletedCount = tierChallenges.filter((c) => nextCompleted.includes(c.id)).length;
      if (tierCompletedCount === tierChallenges.length) {
        const tierMeta = LPIC_LEVEL_INFO.find((l) => l.id === currentChallenge.lpicLevel);
        if (tierMeta && !newEarnedBadges.includes(tierMeta.badgeId)) {
          newEarnedBadges.push(tierMeta.badgeId);
          setNewlyEarnedBadge(tierMeta.badgeName);
        }
      }

      setProgress((prev) => ({
        ...prev,
        xp: newXp,
        completedChallenges: nextCompleted,
        earnedBadges: newEarnedBadges,
      }));
    }
  };

  // Special action handler for easter egg badges (meow, pipe, sudo)
  const handleSpecialAction = (actionId: string) => {
    let badgeIdToUnlock = '';
    let badgeTitle = '';

    if (actionId === 'cat_command' && !progress.earnedBadges.includes('badge-cat-lover')) {
      badgeIdToUnlock = 'badge-cat-lover';
      badgeTitle = 'True Meow-nix Purrist';
    } else if (actionId === 'pipe_used' && !progress.earnedBadges.includes('badge-pipe-master')) {
      badgeIdToUnlock = 'badge-pipe-master';
      badgeTitle = 'Pipeline Sorcerer';
    } else if (actionId === 'sudo_used' && !progress.earnedBadges.includes('badge-sudo-claw')) {
      badgeIdToUnlock = 'badge-sudo-claw';
      badgeTitle = 'Root Claws';
    }

    if (badgeIdToUnlock) {
      soundFx.playSuccess();
      setNewlyEarnedBadge(badgeTitle);
      setProgress((prev) => ({
        ...prev,
        earnedBadges: [...prev.earnedBadges, badgeIdToUnlock],
      }));
    }
  };

  // Command Execution handler
  const handleExecuteCommand = (rawCmd: string) => {
    const cmdId = `cmd-${Date.now()}`;
    const cmdEntry: TerminalEntry = {
      id: cmdId,
      cmd: rawCmd,
      output: '',
      type: 'command',
      timestamp: Date.now(),
    };

    const ctx: CommandContext = {
      vfs: vfsRef.current,
      cwd,
      setCwd,
      currentUser,
      setCurrentUser,
      env: { USER: currentUser, HOME: currentUser === 'root' ? '/root' : '/home/meow', PWD: cwd },
      openNanoEditor: (filePath, initialContent) => {
        setNanoState({ isOpen: true, path: filePath, content: initialContent });
      },
      onSpecialAction: handleSpecialAction,
    };

    const result = engineRef.current.execute(rawCmd, ctx);

    // Track command count for stats and daily quest
    setProgress((p) => ({ ...p, totalCommandsRun: (p.totalCommandsRun || 0) + 1 }));
    updateDailyQuestProgress('run_commands', 1);

    if (rawCmd.includes('/var/log') || rawCmd.includes('grep')) {
      updateDailyQuestProgress('inspect_logs', 1);
    }

    if (result.cleared) {
      setHistory([]);
      return;
    }

    if (result.newCwd) {
      setCwd(result.newCwd);
    }

    const outEntry: TerminalEntry = {
      id: `out-${Date.now()}`,
      output: result.output,
      type: result.type || 'output',
      timestamp: Date.now(),
    };

    setHistory((prev) => [...prev, cmdEntry, ...(result.output ? [outEntry] : [])]);

    // Automatically trigger verification on command execution in quests view
    if (activeView === 'quests') {
      setTimeout(() => {
        verifyCurrentChallenge(result);
      }, 100);
    }
  };

  const handleNextChallenge = () => {
    const currentIndex = CHALLENGES.findIndex((c) => c.id === currentChallenge.id);
    if (currentIndex < CHALLENGES.length - 1) {
      const nextC = CHALLENGES[currentIndex + 1];
      setSelectedLevel(nextC.lpicLevel);
      setCurrentChallenge(nextC);
      setJustCompletedChallenge(null);
    }
  };

  const handleNanoSave = (path: string, newContent: string) => {
    vfsRef.current.setFile(path, newContent, cwd);
    setHistory((prev) => [
      ...prev,
      {
        id: `nano-save-${Date.now()}`,
        output: `🐾 [MeowNano] Saved ${newContent.length} bytes to ${path}`,
        type: 'success',
      },
    ]);
    if (activeView === 'quests') {
      setTimeout(() => verifyCurrentChallenge(), 100);
    }
  };

  // Boss victory handler
  const handleBossVictory = (xpEarned: number, badgeId: string) => {
    setProgress((prev) => {
      const badges = [...prev.earnedBadges];
      if (!badges.includes(badgeId)) badges.push(badgeId);
      return {
        ...prev,
        xp: prev.xp + xpEarned,
        earnedBadges: badges,
        completedBossBattles: [...(prev.completedBossBattles || []), 'boss-midnight-meltdown'],
      };
    });
    setNewlyEarnedBadge('Meltdown Hero');
  };

  // Exam result save handler
  const handleSaveExamResult = (result: ExamResult) => {
    setProgress((prev) => {
      const badges = [...prev.earnedBadges];
      if (result.passed && !badges.includes('badge-exam-pro')) {
        badges.push('badge-exam-pro');
        setNewlyEarnedBadge('LPIC Certified Prodigy');
      }
      return {
        ...prev,
        xp: prev.xp + (result.passed ? 150 : 30),
        earnedBadges: badges,
        examHistory: [...(prev.examHistory || []), result],
      };
    });
  };

  // Launch challenge directly from Skill Tree or CMS
  const handleLaunchChallenge = (challenge: Challenge) => {
    setSelectedLevel(challenge.lpicLevel);
    setCurrentChallenge(challenge);
    setActiveView('quests');
    setJustCompletedChallenge(null);
  };

  const isCurrentChallengeDone = progress.completedChallenges.includes(currentChallenge.id);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-700 transition-colors duration-200 ${
        theme === 'light' ? 'light bg-[#f4f6f9] text-slate-800' : 'bg-[#0b0e17] text-slate-100'
      }`}
    >
      {/* Top Application Navigation */}
      <Navbar
        progress={progress}
        currentUser={firebaseUser}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenCertificates={() => setIsCertificateModalOpen(true)}
        onOpenMentor={() => setIsMentorModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onToggleSound={() => setProgress((p) => ({ ...p, soundEnabled: !p.soundEnabled }))}
        onResetChallenge={() => setupChallengeEnvironment(currentChallenge)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-4">
        {/* Daily Quests Bar (always visible in Quests view) */}
        {activeView === 'quests' && (
          <DailyQuestsBar
            quests={progress.dailyQuests || DEFAULT_DAILY_QUESTS}
            onClaimQuest={handleClaimDailyQuest}
            streak={progress.streak}
          />
        )}

        {/* 1. LPIC Quests Mode */}
        {activeView === 'quests' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left Side: Challenge & Level Curriculum Dashboard */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <ChallengePanel
                challenge={currentChallenge}
                isCompleted={isCurrentChallengeDone}
                onVerify={() => verifyCurrentChallenge()}
                onNextChallenge={handleNextChallenge}
                onOpenMentor={() => setIsMentorModalOpen(true)}
                completedTasks={completedTasks}
              />

              <LevelSelector
                selectedLevel={selectedLevel}
                onSelectLevel={setSelectedLevel}
                currentChallengeId={currentChallenge.id}
                onSelectChallenge={(c) => {
                  setCurrentChallenge(c);
                  setJustCompletedChallenge(null);
                }}
                completedChallengeIds={progress.completedChallenges}
              />
            </div>

            {/* Right Side: Interactive Shell Terminal */}
            <div className="lg:col-span-7 flex flex-col h-full min-h-[460px]">
              <Terminal
                history={history}
                onExecuteCommand={handleExecuteCommand}
                onClear={() => setHistory([])}
                cwd={cwd}
                currentUser={currentUser}
                onAutocomplete={(input) => engineRef.current.autocomplete(input, cwd, vfsRef.current)}
              />
            </div>
          </div>
        )}

        {/* 2. Interactive Skill Tree */}
        {activeView === 'skilltree' && (
          <SkillTreeView
            progress={progress}
            onSelectChallengeById={(cid) => {
              const matched = CHALLENGES.find((c) => c.id === cid);
              if (matched) handleLaunchChallenge(matched);
            }}
          />
        )}

        {/* 3. Boss Battle: Incident Response */}
        {activeView === 'boss' && (
          <BossChallengeView
            progress={progress}
            onVictory={handleBossVictory}
          />
        )}

        {/* 4. Official LPIC Exam Simulation */}
        {activeView === 'exam' && (
          <ExamSimulatorView
            progress={progress}
            onSaveExamResult={handleSaveExamResult}
          />
        )}

        {/* 5. Real Linux Container Sandbox */}
        {activeView === 'containers' && (
          <ContainerManagerView
            progress={progress}
            onUpdateActiveContainer={(cid) => setProgress((p) => ({ ...p, activeContainerId: cid }))}
            vfs={vfsRef.current}
            history={history}
            onExecuteCommand={handleExecuteCommand}
            onClearTerminal={() => setHistory([])}
            cwd={cwd}
            currentUser={currentUser}
            engine={engineRef.current}
          />
        )}

        {/* 6. Global Leaderboards & Daily Streaks */}
        {activeView === 'leaderboard' && (
          <LeaderboardView
            progress={progress}
          />
        )}

        {/* 7. Learning Curve & Course Analytics */}
        {activeView === 'analytics' && (
          <CourseAnalyticsView
            progress={progress}
            onNavigateToLevel={(lvl) => {
              setSelectedLevel(lvl);
              const firstForLevel = CHALLENGES.find((c) => c.lpicLevel === lvl) || CHALLENGES[0];
              setCurrentChallenge(firstForLevel);
              setActiveView('quests');
            }}
          />
        )}

        {/* 8. Admin CMS & Challenge Studio */}
        {activeView === 'cms' && (
          <CmsStudioView
            progress={progress}
            onAddCustomChallenge={(c) => {
              setProgress((p) => ({
                ...p,
                customChallenges: [...(p.customChallenges || []), c],
              }));
            }}
            onDeleteCustomChallenge={(cid) => {
              setProgress((p) => ({
                ...p,
                customChallenges: (p.customChallenges || []).filter((c) => c.id !== cid),
              }));
            }}
            onPlayChallenge={handleLaunchChallenge}
          />
        )}
      </main>

      {/* Challenge Completed Celebration Banner Modal */}
      {justCompletedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-gradient-to-b from-[#141926] to-[#0e111a] border border-emerald-500/50 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20 animate-bounce">
              🐱
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
                Quest Purr-fect!
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-2">
                {justCompletedChallenge.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Verified! You earned <strong className="text-emerald-400">+{justCompletedChallenge.xp} XP</strong> toward your LPIC Certification.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                id="celebration-stay-btn"
                onClick={() => setJustCompletedChallenge(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Keep Exploring
              </button>
              <button
                id="celebration-next-btn"
                onClick={() => {
                  setJustCompletedChallenge(null);
                  handleNextChallenge();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1"
              >
                <span>Next Mission</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Badge Unlocked Notification Toast */}
      {newlyEarnedBadge && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#121724] border border-amber-500/50 rounded-2xl p-4 shadow-2xl shadow-amber-500/10 flex items-center gap-3 animate-slide-up max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">New Badge Earned!</div>
            <div className="text-xs font-bold text-slate-100 truncate">{newlyEarnedBadge}</div>
          </div>
          <button
            onClick={() => {
              setNewlyEarnedBadge(null);
              setIsCertificateModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold transition flex-shrink-0"
          >
            View
          </button>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        progress={progress}
        onUpdateProgress={setProgress}
        currentUser={firebaseUser}
        onCloudSynced={() => {
          // Cloud sync feedback
        }}
      />

      {/* Mini Nano File Editor Modal */}
      <NanoModal
        isOpen={nanoState.isOpen}
        filePath={nanoState.path}
        initialContent={nanoState.content}
        onSave={handleNanoSave}
        onClose={() => setNanoState({ isOpen: false, path: '', content: '' })}
      />

      {/* Official Certificate & Badges Modal */}
      <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        progress={progress}
        onUpdateUserName={(name) => setProgress((p) => ({ ...p, userName: name }))}
      />

      {/* Commander Whiskers AI Mentor Dialogue Modal */}
      <AiMentorModal
        isOpen={isMentorModalOpen}
        onClose={() => setIsMentorModalOpen(false)}
        currentChallenge={currentChallenge}
        terminalHistory={history}
      />
    </div>
  );
}
