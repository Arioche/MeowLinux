import React, { useState } from 'react';
import { UserProgress, Badge, LPICLevelId } from '../types';
import { BADGES } from '../data/badges';
import { LPIC_LEVEL_INFO, CHALLENGES } from '../data/lpicCurriculum';
import { Award, Printer, X, CheckCircle2, Lock, Sparkles, Shield, Trophy, FileCheck } from 'lucide-react';
import { soundFx } from '../lib/audio';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  onUpdateUserName: (name: string) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  progress,
  onUpdateUserName,
}) => {
  const [activeTab, setActiveTab] = useState<'certificate' | 'badges'>('certificate');
  const [selectedCertLevel, setSelectedCertLevel] = useState<LPICLevelId>('essentials');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(progress.userName || 'Candidate SysAdmin');

  if (!isOpen) return null;

  const currentLevelMeta = LPIC_LEVEL_INFO.find((lvl) => lvl.id === selectedCertLevel);
  const tierChallenges = CHALLENGES.filter((c) => c.lpicLevel === selectedCertLevel);
  const completedTierChallenges = tierChallenges.filter((c) => progress.completedChallenges.includes(c.id));
  const isTierCertified = completedTierChallenges.length === tierChallenges.length && tierChallenges.length > 0;

  const handlePrint = () => {
    soundFx.playEnter();
    window.print();
  };

  const handleSaveName = () => {
    onUpdateUserName(tempName);
    setEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#11141f] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:px-6 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Certification Center & Badges</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-mono">
                  {progress.earnedBadges.length} / {BADGES.length} Badges
                </span>
              </h3>
              <p className="text-xs text-slate-400">Accredited by MeowLinux & The Linux Cat Institute</p>
            </div>
          </div>

          <button
            id="close-cert-modal-btn"
            onClick={() => {
              soundFx.playKeypress();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Certificate Diploma vs Badges Showcase */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/40 px-6 gap-4 text-xs font-semibold">
          <button
            id="tab-view-certificate-btn"
            onClick={() => {
              soundFx.playKeypress();
              setActiveTab('certificate');
            }}
            className={`py-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'certificate'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Official LPIC Diploma</span>
          </button>
          <button
            id="tab-view-badges-btn"
            onClick={() => {
              soundFx.playKeypress();
              setActiveTab('badges');
            }}
            className={`py-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'badges'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Earned Badges & Medals ({progress.earnedBadges.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'certificate' ? (
            <div className="space-y-6">
              {/* Certificate Tier Picker */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {LPIC_LEVEL_INFO.map((tier) => {
                  const isSelected = selectedCertLevel === tier.id;
                  const tierDone = CHALLENGES.filter((c) => c.lpicLevel === tier.id).every((c) =>
                    progress.completedChallenges.includes(c.id)
                  );

                  return (
                    <button
                      key={tier.id}
                      onClick={() => {
                        soundFx.playKeypress();
                        setSelectedCertLevel(tier.id as LPICLevelId);
                      }}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tierDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{tier.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Certificate Sheet Display (Printable Document) */}
              <div
                id="printable-certificate"
                className="relative bg-gradient-to-b from-[#181d2c] to-[#0f121d] border-4 border-double border-amber-500/60 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-5 overflow-hidden select-none"
              >
                {/* Decorative Feline Watermark Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                  <span className="text-[280px]">🐱</span>
                </div>

                {/* Institute Header */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm sm:text-base tracking-widest uppercase">
                    <span>🐾 LINUX CAT INSTITUTE • MEOWLINUX 🐾</span>
                  </div>
                  <span className="text-[10px] text-slate-400 tracking-widest uppercase font-mono">
                    GLOBAL LPIC SYSADMIN ACCREDITATION BOARD
                  </span>
                </div>

                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />

                {/* Main Heading */}
                <div>
                  <h4 className="text-xl sm:text-3xl font-extrabold text-slate-100 tracking-tight font-serif">
                    Certificate of Competency
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    This document proudly verifies that the candidate has conquered real Linux terminal quests:
                  </p>
                </div>

                {/* Candidate Name */}
                <div className="py-2">
                  {editingName ? (
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="bg-slate-900 border border-amber-500/50 rounded-xl px-4 py-1.5 text-center text-lg sm:text-2xl font-bold text-amber-300 font-serif outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingName(true)}
                      className="cursor-pointer group inline-flex items-center gap-2"
                      title="Click to edit candidate name"
                    >
                      <h3 className="text-2xl sm:text-4xl font-extrabold text-amber-300 font-serif tracking-wide border-b-2 border-amber-500/40 pb-1 group-hover:border-amber-400 transition">
                        {progress.userName || 'Candidate SysAdmin'}
                      </h3>
                      <span className="text-[10px] text-slate-500 group-hover:text-amber-400 font-sans">✎ Edit</span>
                    </div>
                  )}
                </div>

                {/* Qualification Details */}
                <div className="max-w-xl mx-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Has successfully fulfilled all hands-on terminal requirements and verification benchmarks for:
                  <div className="text-base sm:text-lg font-bold text-emerald-400 mt-1">
                    {currentLevelMeta?.name} ({currentLevelMeta?.code})
                  </div>
                  <div className="text-xs text-slate-400 italic mt-0.5">
                    "{currentLevelMeta?.description}"
                  </div>
                </div>

                {/* Bottom Signatures & Seal */}
                <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-left">
                  {/* Left: Credential ID */}
                  <div className="text-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Credential ID</span>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      LPIC-MEOW-{selectedCertLevel.toUpperCase()}-{progress.xp}-AUTH
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Issued: Sep 12, 2026</span>
                  </div>

                  {/* Center: Gold Foil Badge Seal */}
                  <div className="relative flex items-center justify-center mx-auto">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-1 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-slate-950 border border-amber-300/40 flex flex-col items-center justify-center">
                        <Award className="w-6 h-6 text-amber-400" />
                        <span className="text-[8px] font-bold text-amber-300 uppercase tracking-tighter">LPIC SEAL</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Signature */}
                  <div className="text-right text-xs">
                    <span className="font-serif italic text-amber-300 text-sm block">Commander Whiskers</span>
                    <div className="w-32 h-px bg-slate-700 ml-auto my-0.5" />
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      Chief LPIC Feline Proctor
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400">
                  {isTierCertified ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> All {tierChallenges.length} challenges verified! Certificate unlocked.
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium flex items-center gap-1.5">
                      <Lock className="w-4 h-4" /> Complete {completedTierChallenges.length}/{tierChallenges.length} missions to certify.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="print-certificate-btn"
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-md shadow-amber-500/20"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / PDF Diploma</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Badges Showcase Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {BADGES.map((badge) => {
                const isEarned = progress.earnedBadges.includes(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
                      isEarned
                        ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                    }`}
                  >
                    {/* Badge Icon Emblem */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                        isEarned
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {isEarned ? (
                        <Award className="w-6 h-6 text-amber-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    {/* Badge Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {badge.category}
                        </span>
                        {isEarned && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-semibold">
                            Earned
                          </span>
                        )}
                      </div>
                      <h4 className={`text-sm font-bold mt-0.5 ${isEarned ? 'text-slate-100' : 'text-slate-400'}`}>
                        {badge.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{badge.description}</p>
                      <div className="mt-2 text-[11px] text-amber-400/90 font-medium">
                        ✦ {badge.requirementText}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
