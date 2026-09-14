import React, { useState } from 'react';
import { SKILL_NODES, SKILL_BRANCHES } from '../data/skillTreeData';
import { SkillNode, UserProgress } from '../types';
import { CHALLENGES } from '../data/lpicCurriculum';
import { CheckCircle2, Lock, Sparkles, ArrowRight, BookOpen, Layers, Shield, Cpu, Activity, GitCommit, KeyRound, Terminal } from 'lucide-react';
import { soundFx } from '../lib/audio';

interface SkillTreeViewProps {
  progress: UserProgress;
  onSelectChallengeById: (challengeId: string) => void;
}

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({
  progress,
  onSelectChallengeById,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [activeNode, setActiveNode] = useState<SkillNode>(SKILL_NODES[0]);

  // Compute status of a skill node
  const getNodeStatus = (node: SkillNode): 'mastered' | 'unlocked' | 'locked' => {
    // If linked challenge is completed, consider mastered
    if (node.linkedChallengeId && progress.completedChallenges.includes(node.linkedChallengeId)) {
      return 'mastered';
    }

    // Check prerequisites
    const prereqsMet = node.prereqs.every((prereqId) => {
      const prereqNode = SKILL_NODES.find((n) => n.id === prereqId);
      if (!prereqNode) return true;
      if (prereqNode.linkedChallengeId && progress.completedChallenges.includes(prereqNode.linkedChallengeId)) {
        return true;
      }
      return progress.xp >= prereqNode.requiredXp;
    });

    if (prereqsMet && progress.xp >= node.requiredXp) {
      return 'unlocked';
    }

    return 'locked';
  };

  const filteredNodes = selectedBranch === 'all'
    ? SKILL_NODES
    : SKILL_NODES.filter((n) => n.branch === selectedBranch);

  const masteredCount = SKILL_NODES.filter((n) => getNodeStatus(n) === 'mastered').length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-[#131929] via-[#101420] to-[#151c2e] border border-emerald-500/20 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Interactive LPIC Skill Matrix</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
            Cat Sysadmin Tech Tree
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Master prerequisite competencies across Linux Filesystems, Process Control, Networking, Shell Automation, and Bastion Security.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-center px-3 border-r border-slate-800">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {masteredCount}/{SKILL_NODES.length}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Mastered</div>
          </div>
          <div className="text-center px-3">
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {progress.xp}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total XP</div>
          </div>
        </div>
      </div>

      {/* Branch Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedBranch('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedBranch === 'all'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Domains ({SKILL_NODES.length})
        </button>
        {SKILL_BRANCHES.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBranch(b.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedBranch === b.id
                ? 'bg-slate-800 border border-slate-700 text-slate-100 shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${b.bg} ${b.border} border`} />
            <span>{b.name}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Skill Nodes & Active Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nodes Canvas / Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredNodes.map((node) => {
            const status = getNodeStatus(node);
            const isSelected = activeNode.id === node.id;
            const branchMeta = SKILL_BRANCHES.find((b) => b.id === node.branch);

            return (
              <div
                key={node.id}
                onClick={() => {
                  soundFx.playKeypress();
                  setActiveNode(node);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden text-left ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 bg-[#141b2a] border-emerald-500/50 shadow-lg'
                    : 'bg-[#101420] hover:bg-[#131826] border-slate-800'
                }`}
              >
                {/* Branch Accent Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${branchMeta?.bg || 'bg-slate-700'}`} />

                <div className="flex items-start justify-between gap-2 mt-1">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {node.lpicTopic}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                      {node.title}
                    </h4>
                  </div>

                  {status === 'mastered' ? (
                    <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : status === 'unlocked' ? (
                    <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-lg bg-slate-800 text-slate-500 border border-slate-700 flex-shrink-0">
                      <Lock className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {node.description}
                </p>

                <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Req: <strong className="text-slate-300 font-mono">{node.requiredXp} XP</strong>
                  </span>
                  <span
                    className={`font-semibold capitalize ${
                      status === 'mastered'
                        ? 'text-emerald-400'
                        : status === 'unlocked'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Node Detail & Practice Launcher */}
        <div className="lg:col-span-4">
          <div className="bg-[#111624] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {activeNode.lpicTopic}
              </span>
              <span className={`text-xs font-bold capitalize ${
                getNodeStatus(activeNode) === 'mastered'
                  ? 'text-emerald-400'
                  : getNodeStatus(activeNode) === 'unlocked'
                  ? 'text-amber-400'
                  : 'text-slate-500'
              }`}>
                {getNodeStatus(activeNode)}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-100">
                {activeNode.title}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {activeNode.description}
              </p>
            </div>

            {/* Prerequisites breakdown */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-300">Prerequisites & Criteria:</span>
              <div className="space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Required XP Threshold:</span>
                  <span className={`font-mono font-bold ${progress.xp >= activeNode.requiredXp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {progress.xp} / {activeNode.requiredXp} XP
                  </span>
                </div>

                {activeNode.prereqs.length > 0 && (
                  <div>
                    <span className="text-slate-400">Required Parent Skills:</span>
                    <ul className="mt-1 space-y-1 pl-2">
                      {activeNode.prereqs.map((pid) => {
                        const p = SKILL_NODES.find((n) => n.id === pid);
                        const isDone = p?.linkedChallengeId && progress.completedChallenges.includes(p.linkedChallengeId);
                        return (
                          <li key={pid} className="flex items-center gap-1.5">
                            {isDone ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Lock className="w-3 h-3 text-slate-500" />
                            )}
                            <span className={isDone ? 'text-slate-200' : 'text-slate-500'}>{p?.title || pid}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Action button */}
            {activeNode.linkedChallengeId && (
              <button
                id="launch-skill-challenge-btn"
                onClick={() => {
                  soundFx.playSuccess();
                  onSelectChallengeById(activeNode.linkedChallengeId!);
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <span>Launch Interactive Quest</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
