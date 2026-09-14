import React, { useState, useEffect, useRef } from 'react';
import { BOSS_INCIDENT } from '../data/bossIncident';
import { UserProgress, TerminalEntry } from '../types';
import { Terminal } from './Terminal';
import { VirtualFileSystem } from '../lib/vfs';
import { TerminalEngine, CommandContext } from '../lib/terminalEngine';
import { soundFx } from '../lib/audio';
import { AlertTriangle, ShieldAlert, CheckCircle2, RotateCcw, Flame, Trophy, Play, Clock, Sparkles } from 'lucide-react';

interface BossChallengeViewProps {
  progress: UserProgress;
  onVictory: (xpEarned: number, badgeId: string) => void;
}

export const BossChallengeView: React.FC<BossChallengeViewProps> = ({
  progress,
  onVictory,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(BOSS_INCIDENT.timeLimitSeconds);
  const [stagesStatus, setStagesStatus] = useState<boolean[]>([false, false, false, false]);
  const [isVictory, setIsVictory] = useState(false);
  const [isDefeat, setIsDefeat] = useState(false);

  // Dedicated Boss Terminal State
  const [cwd, setCwd] = useState<string>('/home/meow');
  const [currentUser, setCurrentUser] = useState<string>('meow');
  const [history, setHistory] = useState<TerminalEntry[]>([
    {
      id: 'boss-init-0',
      output: `🚨 EMERGENCY BROADCAST: CLUSTER ALERT LEVEL RED 🚨\nHost 'catnip-prod-01' is failing automated probes.\nType 'ps aux', 'df -h', 'ls -la /etc/shadow', or 'systemctl status nginx' to assess damage.\nResolve all 4 incident phases before the timer expires!`,
      type: 'error',
    },
  ]);

  const vfsRef = useRef<VirtualFileSystem>(new VirtualFileSystem());
  const engineRef = useRef<TerminalEngine>(new TerminalEngine());

  // Initialize Boss filesystem environment
  const resetBossEnvironment = () => {
    const vfs = new VirtualFileSystem();
    // 1. Rogue process already defined in TerminalEngine default processes (PID 9942: cryptocat-miner)
    engineRef.current.processes.push({
      pid: 9942,
      user: 'nobody',
      cpu: 99.8,
      mem: 32.4,
      vsz: 1842900,
      rss: 412000,
      tty: '?',
      stat: 'R',
      start: '02:40',
      time: '12:45',
      command: '/usr/local/bin/cryptocat-miner --hashrate=unlimited',
    });

    // 2. Large log file filling the disk
    vfs.setFile('/var/log/catnip.log', 'CRITICAL FATAL CORRUPTION '.repeat(500), '/');

    // 3. World writable /etc/shadow
    vfs.setFile('/etc/shadow', 'root:$6$meowhash$purr...:19700:0:99999:7:::\nmeow:$6$whisker$claw...:19700:0:99999:7:::\n', '/', {
      permissions: 'rwxrwxrwx', // 777!
      owner: 'root',
      group: 'shadow',
    });

    // 4. Inactive Nginx service
    engineRef.current.services.nginx = { status: 'inactive', enabled: false };

    vfsRef.current = vfs;
    setCwd('/home/meow');
    setCurrentUser('meow');
    setStagesStatus([false, false, false, false]);
    setTimeLeft(BOSS_INCIDENT.timeLimitSeconds);
    setIsVictory(false);
    setIsDefeat(false);
  };

  // Start incident
  const startIncident = () => {
    resetBossEnvironment();
    setIsActive(true);
    soundFx.playEnter();
  };

  // Timer loop
  useEffect(() => {
    if (!isActive || isVictory || isDefeat) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDefeat(true);
          soundFx.playError();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isVictory, isDefeat]);

  // Check stage conditions
  const checkStages = (lastCmd: string) => {
    const vfs = vfsRef.current;
    const engine = engineRef.current;
    const newStatus = [...stagesStatus];

    // Stage 1: Has cryptocat-miner been killed?
    const hasMiner = engine.processes.some((p) => p.pid === 9942 || p.command.includes('cryptocat-miner'));
    if (!hasMiner) {
      newStatus[0] = true;
    }

    // Stage 2: Has /var/log/catnip.log been removed or emptied?
    const logNode = vfs.getNode('/var/log/catnip.log');
    if (!logNode || (logNode.type === 'file' && logNode.content.trim().length === 0)) {
      newStatus[1] = true;
    }

    // Stage 3: Is /etc/shadow protected (600 or 640)?
    const shadowNode = vfs.getNode('/etc/shadow');
    if (shadowNode && (shadowNode.permissions === 'rw-------' || shadowNode.permissions === 'rw-r-----')) {
      newStatus[2] = true;
    }

    // Stage 4: Is nginx service active?
    if (engine.services.nginx && engine.services.nginx.status === 'active') {
      newStatus[3] = true;
    }

    setStagesStatus(newStatus);

    // If all 4 resolved!
    if (newStatus.every(Boolean) && !isVictory) {
      setIsVictory(true);
      setIsActive(false);
      soundFx.playSuccess();
      onVictory(250, 'badge-boss-meltdown');
    }
  };

  const handleExecuteCommand = (rawCmd: string) => {
    const cmdId = `boss-cmd-${Date.now()}`;
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
      env: { USER: currentUser, HOME: '/home/meow', PWD: cwd },
    };

    const result = engineRef.current.execute(rawCmd, ctx);

    if (result.cleared) {
      setHistory([]);
      return;
    }

    if (result.newCwd) {
      setCwd(result.newCwd);
    }

    const outEntry: TerminalEntry = {
      id: `boss-out-${Date.now()}`,
      output: result.output,
      type: result.type || 'output',
      timestamp: Date.now(),
    };

    setHistory((prev) => [...prev, cmdEntry, ...(result.output ? [outEntry] : [])]);

    if (isActive) {
      setTimeout(() => checkStages(rawCmd), 100);
    }
  };

  const resolvedCount = stagesStatus.filter(Boolean).length;
  const stabilityPct = Math.round((resolvedCount / 4) * 100);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Incident Command Header */}
      <div className="bg-gradient-to-r from-rose-950/40 via-[#14121a] to-rose-950/20 border border-rose-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Sev-1 Production War Room</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1 flex items-center gap-2">
            <span>{BOSS_INCIDENT.title}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              Boss Battle
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {BOSS_INCIDENT.subtitle}
          </p>
        </div>

        {/* Action / Status Panel */}
        <div className="flex items-center gap-4 self-stretch md:self-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1.5 text-xl sm:text-2xl font-mono font-black text-rose-400">
              <Clock className="w-5 h-5 text-rose-400" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Time Remaining</div>
          </div>

          <div className="h-10 w-px bg-slate-800" />

          <div>
            {!isActive && !isVictory ? (
              <button
                id="start-boss-incident-btn"
                onClick={startIncident}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-100 font-bold text-xs transition shadow-lg shadow-rose-600/30 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Sound Alarm & Begin</span>
              </button>
            ) : (
              <button
                id="reset-boss-incident-btn"
                onClick={resetBossEnvironment}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Incident</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cluster Stability Meter */}
      <div className="bg-[#111420] border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Cluster Production Health Status</span>
          </span>
          <span className={stabilityPct === 100 ? 'text-emerald-400' : 'text-rose-400'}>
            {stabilityPct}% Operational ({resolvedCount}/4 Anomalies Mitigated)
          </span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              stabilityPct === 100
                ? 'bg-emerald-500 shadow-md shadow-emerald-500/50'
                : stabilityPct >= 50
                ? 'bg-amber-500'
                : 'bg-rose-500 animate-pulse'
            }`}
            style={{ width: `${Math.max(5, stabilityPct)}%` }}
          />
        </div>
      </div>

      {/* Grid: 4 Incident Stages vs Emergency Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stages Checklist */}
        <div className="lg:col-span-5 space-y-3">
          {BOSS_INCIDENT.stages.map((stage, idx) => {
            const isResolved = stagesStatus[idx];
            return (
              <div
                key={stage.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isResolved
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                    : 'bg-[#101420] border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isResolved ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {stage.id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200">
                      {stage.name}
                    </h4>
                  </div>
                  {isResolved ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Mitigated</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded uppercase">
                      Active Threat
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                  {stage.symptom}
                </p>

                <div className="mt-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">Objective: </span>
                  <span className="text-slate-200 font-semibold">{stage.task}</span>
                </div>

                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Hint: {stage.hint}
                </div>
              </div>
            );
          })}
        </div>

        {/* Emergency Live Terminal Console */}
        <div className="lg:col-span-7 flex flex-col h-[520px]">
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

      {/* Victory Modal */}
      {isVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-gradient-to-b from-[#141926] to-[#0e111a] border border-emerald-500/50 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20 animate-bounce">
              🏆
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
                Incident Stabilized!
              </span>
              <h3 className="text-2xl font-black text-slate-100 mt-2">
                Meltdown Hero!
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                You eradicated the rogue miner, purged the disk overflow, hardened `/etc/shadow`, and restored Nginx back to full health in <strong className="text-emerald-400">{formatTime(BOSS_INCIDENT.timeLimitSeconds - timeLeft)}</strong>!
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-amber-400 font-bold flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>+250 XP & &apos;Meltdown Hero&apos; Boss Badge Awarded!</span>
              </div>
            </div>

            <button
              onClick={() => setIsVictory(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              Collect Rewards & Return to HQ
            </button>
          </div>
        </div>
      )}

      {/* Defeat Modal */}
      {isDefeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#13111a] border border-rose-500/50 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center text-3xl">
              😿
            </div>
            <div>
              <h3 className="text-xl font-bold text-rose-400">
                Catnip Cluster Outage!
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                The timer expired before all cascading anomalies were neutralized. Commander Whiskers dispatched the backup standby team.
              </p>
            </div>

            <button
              onClick={resetBossEnvironment}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-100 font-bold text-xs transition shadow-lg shadow-rose-600/20"
            >
              Retry Incident Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
