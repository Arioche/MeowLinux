import React, { useState } from 'react';
import { Challenge, LPICLevelId, VerificationCondition, UserProgress } from '../types';
import { CHALLENGES } from '../data/lpicCurriculum';
import { Settings, Plus, Search, Filter, CheckCircle2, Download, Upload, Trash2, Play, Sparkles, BookOpen } from 'lucide-react';
import { soundFx } from '../lib/audio';

interface CmsStudioViewProps {
  progress: UserProgress;
  onAddCustomChallenge: (challenge: Challenge) => void;
  onDeleteCustomChallenge: (challengeId: string) => void;
  onPlayChallenge: (challenge: Challenge) => void;
}

export const CmsStudioView: React.FC<CmsStudioViewProps> = ({
  progress,
  onAddCustomChallenge,
  onDeleteCustomChallenge,
  onPlayChallenge,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);

  // Form state for creating a new challenge
  const [newTitle, setNewTitle] = useState('');
  const [newLevel, setNewLevel] = useState<LPICLevelId>('essentials');
  const [newCode, setNewCode] = useState('Topic 1.5');
  const [newCodename, setNewCodename] = useState('Operation Catnip Patrol');
  const [newDifficulty, setNewDifficulty] = useState<'Kitten' | 'Intermediate' | 'Advanced' | 'Master'>('Intermediate');
  const [newXp, setNewXp] = useState(75);
  const [newScenario, setNewScenario] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newVerificationPath, setNewVerificationPath] = useState('');
  const [newVerificationType, setNewVerificationType] = useState<'cwd' | 'file_exists' | 'file_contains' | 'file_permissions' | 'command_output'>('file_exists');
  const [newVerificationContent, setNewVerificationContent] = useState('');
  const [newVerificationPerms, setNewVerificationPerms] = useState('');

  const allChallenges = [...CHALLENGES, ...(progress.customChallenges || [])];

  const filteredChallenges = allChallenges.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lpicCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.scenario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevelFilter === 'all' || c.lpicLevel === selectedLevelFilter;
    return matchesSearch && matchesLevel;
  });

  const handleSaveChallenge = () => {
    if (!newTitle.trim() || !newObjective.trim()) {
      alert('Please provide a challenge title and objective.');
      return;
    }

    const verifications: VerificationCondition[] = [
      {
        type: newVerificationType,
        path: newVerificationPath.trim() || undefined,
        contentMatch: newVerificationContent.trim() || undefined,
        permissionsMatch: newVerificationPerms.trim() || undefined,
        description: `Verified condition: ${newVerificationType} ${newVerificationPath || ''}`,
      },
    ];

    const customC: Challenge = {
      id: `custom-${Date.now()}`,
      lpicLevel: newLevel,
      lpicCode: newCode,
      title: newTitle,
      catCodename: newCodename,
      difficulty: newDifficulty,
      xp: newXp,
      scenario: newScenario || 'Custom user scenario designed in Challenge Studio.',
      objective: newObjective,
      tasks: newTaskInput ? newTaskInput.split('\n').filter(Boolean) : ['Complete the objective using shell commands'],
      initialCwd: '/home/meow',
      initialFilesystem: {},
      verifications,
      hints: ['Use standard Linux commands to fulfill the verification condition.'],
      lpicExamNotes: `Custom Mission mapped to ${newCode}.`,
      suggestedCommands: ['ls -la', 'pwd'],
      isCustom: true,
    };

    onAddCustomChallenge(customC);
    soundFx.playSuccess();
    setIsCreating(false);

    // Reset form
    setNewTitle('');
    setNewScenario('');
    setNewObjective('');
    setNewTaskInput('');
    setNewVerificationPath('');
  };

  const handleExportCurriculum = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(progress.customChallenges || [], null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'meowlinux-custom-quests.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      soundFx.playSuccess();
    } catch {
      soundFx.playError();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Studio Banner */}
      <div className="bg-gradient-to-r from-[#171424] via-[#101420] to-[#1d162e] border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Admin / Content Management System</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
            Challenge Studio & Curriculum CMS
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Create, test, and publish custom LPIC interactive missions. Configure automated filesystem verification rules, custom scenarios, and export quest packs for the community.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <button
            id="create-challenge-modal-btn"
            onClick={() => setIsCreating(true)}
            className="py-3 px-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-slate-100 font-bold text-xs transition shadow-lg shadow-purple-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Design New Mission</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111624] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search missions by title, LPIC topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-medium focus:outline-none"
          >
            <option value="all">All LPIC Levels ({allChallenges.length})</option>
            <option value="essentials">Linux Essentials</option>
            <option value="lpic1-101">LPIC-1 101</option>
            <option value="lpic1-102">LPIC-1 102</option>
            <option value="lpic2">LPIC-2</option>
            <option value="lpic3">LPIC-3</option>
          </select>

          <button
            onClick={handleExportCurriculum}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Pack</span>
          </button>
        </div>
      </div>

      {/* Curriculum Table */}
      <div className="bg-[#111420] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800/80">
          {filteredChallenges.map((c) => (
            <div
              key={c.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {c.lpicCode}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase font-semibold">
                    {c.lpicLevel}
                  </span>
                  {c.isCustom && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Custom Studio Mission
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-100 truncate">
                  {c.title}
                </h4>

                <p className="text-xs text-slate-400 line-clamp-1 max-w-3xl">
                  {c.objective}
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                  +{c.xp} XP
                </span>

                <button
                  onClick={() => {
                    soundFx.playEnter();
                    onPlayChallenge(c);
                  }}
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Run</span>
                </button>

                {c.isCustom && (
                  <button
                    onClick={() => onDeleteCustomChallenge(c.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Challenge Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#111420] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Author New Interactive Challenge</span>
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-400 font-semibold">Challenge Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Catnip Log Rotation with gzip"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">LPIC Track</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as LPICLevelId)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="essentials">Linux Essentials</option>
                  <option value="lpic1-101">LPIC-1: 101</option>
                  <option value="lpic1-102">LPIC-1: 102</option>
                  <option value="lpic2">LPIC-2</option>
                  <option value="lpic3">LPIC-3</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">LPIC Objective Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-400 font-semibold">Mission Scenario</label>
                <textarea
                  rows={2}
                  value={newScenario}
                  onChange={(e) => setNewScenario(e.target.value)}
                  placeholder="Describe the crisis or context..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-400 font-semibold">Core Objective</label>
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="What must the player accomplish?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Automated Verification Engine Config */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 sm:col-span-2">
                <span className="text-xs font-bold text-slate-200 block">Automated Verification Engine:</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Check Rule Type</label>
                    <select
                      value={newVerificationType}
                      onChange={(e) => setNewVerificationType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                    >
                      <option value="file_exists">File Exists</option>
                      <option value="file_contains">File Contains Text</option>
                      <option value="file_permissions">File Permissions (Octal)</option>
                      <option value="cwd">Current Directory</option>
                      <option value="command_output">Command Successfully Executed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Target VFS Path</label>
                    <input
                      type="text"
                      value={newVerificationPath}
                      onChange={(e) => setNewVerificationPath(e.target.value)}
                      placeholder="/home/meow/test.txt"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                    />
                  </div>

                  {newVerificationType === 'file_contains' && (
                    <div className="sm:col-span-2">
                      <label className="text-slate-400 font-medium block mb-1">Target String Match</label>
                      <input
                        type="text"
                        value={newVerificationContent}
                        onChange={(e) => setNewVerificationContent(e.target.value)}
                        placeholder="Expected substring..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                      />
                    </div>
                  )}

                  {newVerificationType === 'file_permissions' && (
                    <div className="sm:col-span-2">
                      <label className="text-slate-400 font-medium block mb-1">Octal Permissions (e.g. 755, 600)</label>
                      <input
                        type="text"
                        value={newVerificationPerms}
                        onChange={(e) => setNewVerificationPerms(e.target.value)}
                        placeholder="755"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                id="save-new-mission-btn"
                onClick={handleSaveChallenge}
                className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-slate-100 text-xs font-bold transition shadow-lg shadow-purple-600/20"
              >
                Publish Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
