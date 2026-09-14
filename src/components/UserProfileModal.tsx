import React, { useState, useEffect } from 'react';
import { UserProgress } from '../types';
import { BADGES } from '../data/badges';
import {
  X,
  User as UserIcon,
  Edit3,
  Download,
  Upload,
  Check,
  Cloud,
  CloudCheck,
  LogOut,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { soundFx } from '../lib/audio';
import { auth, googleProvider, githubProvider, syncProgressToCloud, fetchUserProgressFromCloud } from '../lib/firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  currentUser: User | null;
  onCloudSynced?: () => void;
}

const AVATARS = ['🐱', '🐧', '😸', '🐯', '👽', '🦁', '🐾', '😼'];
const SHELLS = ['/bin/bash', '/bin/zsh', '/usr/bin/fish', '/bin/sh'];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  progress,
  onUpdateProgress,
  currentUser,
  onCloudSynced,
}) => {
  const [userName, setUserName] = useState(progress.userName || 'Candidate SysAdmin');
  const [callsign, setCallsign] = useState(progress.callsign || 'Junior Whisker SysAdmin');
  const [userBio, setUserBio] = useState(progress.userBio || 'Pursuing LPIC-1 certification through gamified terminal drills.');
  const [avatarId, setAvatarId] = useState(progress.avatarId || '🐱');
  const [preferredShell, setPreferredShell] = useState(progress.preferredShell || '/bin/bash');
  const [favoriteBadgeId, setFavoriteBadgeId] = useState(progress.favoriteBadgeId || 'badge-first-step');
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUserName(progress.userName || 'Candidate SysAdmin');
      setCallsign(progress.callsign || 'Junior Whisker SysAdmin');
      setUserBio(progress.userBio || '');
      setAvatarId(progress.avatarId || '🐱');
      setPreferredShell(progress.preferredShell || '/bin/bash');
      setFavoriteBadgeId(progress.favoriteBadgeId || 'badge-first-step');
      setSyncMessage(null);
      setAuthError(null);
    }
  }, [isOpen, progress]);

  if (!isOpen) return null;

  const handleSignInGoogle = async () => {
    try {
      setAuthError(null);
      setIsSyncing(true);
      const res = await signInWithPopup(auth, googleProvider);
      soundFx.playSuccess();
      if (res.user) {
        // Check if there is existing data in cloud
        const cloudData = await fetchUserProgressFromCloud(res.user.uid);
        if (cloudData) {
          onUpdateProgress((prev) => ({
            ...prev,
            ...cloudData,
            userName: cloudData.userName || res.user.displayName || prev.userName,
          }));
          setSyncMessage('Cloud progress loaded successfully!');
        } else {
          // Push current progress up to cloud
          const updated = {
            ...progress,
            userName: res.user.displayName || progress.userName,
          };
          await syncProgressToCloud(res.user, updated);
          setSyncMessage('Initial cloud profile created!');
        }
        if (onCloudSynced) onCloudSynced();
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      soundFx.playError();
      setAuthError(err?.message || 'Failed to sign in with Google');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignInGithub = async () => {
    try {
      setAuthError(null);
      setIsSyncing(true);
      const res = await signInWithPopup(auth, githubProvider);
      soundFx.playSuccess();
      if (res.user) {
        const cloudData = await fetchUserProgressFromCloud(res.user.uid);
        if (cloudData) {
          onUpdateProgress((prev) => ({
            ...prev,
            ...cloudData,
            userName: cloudData.userName || res.user.displayName || prev.userName,
          }));
          setSyncMessage('GitHub cloud progress loaded successfully!');
        } else {
          const updated = {
            ...progress,
            userName: res.user.displayName || progress.userName,
          };
          await syncProgressToCloud(res.user, updated);
          setSyncMessage('Initial GitHub sysadmin profile created!');
        }
        if (onCloudSynced) onCloudSynced();
      }
    } catch (err: any) {
      console.error('GitHub Sign-In Error:', err);
      soundFx.playError();
      if (err?.code === 'auth/operation-not-allowed') {
        setAuthError('GitHub authentication requires enabling the GitHub provider in Firebase Console. Google login is ready.');
      } else {
        setAuthError(err?.message || 'Failed to sign in with GitHub');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      soundFx.playKeypress();
      setSyncMessage('Signed out. Local saves are active.');
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign out');
    }
  };

  const handleManualCloudSync = async () => {
    if (!currentUser) return;
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      const currentSnapshot: UserProgress = {
        ...progress,
        userName,
        callsign,
        userBio,
        avatarId,
        preferredShell,
        favoriteBadgeId,
      };
      await syncProgressToCloud(currentUser, currentSnapshot);
      soundFx.playSuccess();
      setSyncMessage('Synced to Firestore cloud successfully!');
      if (onCloudSynced) onCloudSynced();
    } catch (err: any) {
      soundFx.playError();
      setSyncMessage(`Sync failed: ${err?.message || 'Error saving to cloud'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!currentUser) return;
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      const cloudData = await fetchUserProgressFromCloud(currentUser.uid);
      if (cloudData) {
        onUpdateProgress((prev) => ({ ...prev, ...cloudData }));
        soundFx.playSuccess();
        setSyncMessage('Profile & drill achievements restored from cloud!');
      } else {
        setSyncMessage('No cloud backup found for this account.');
      }
    } catch (err: any) {
      soundFx.playError();
      setSyncMessage(`Restore failed: ${err?.message || 'Error reading from cloud'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProfile = async () => {
    soundFx.playSuccess();
    const updatedProgress = {
      ...progress,
      userName,
      callsign,
      userBio,
      avatarId,
      preferredShell,
      favoriteBadgeId,
    };
    onUpdateProgress(() => updatedProgress);
    setIsSaved(true);

    if (currentUser) {
      try {
        await syncProgressToCloud(currentUser, updatedProgress);
        if (onCloudSynced) onCloudSynced();
      } catch (err) {
        console.error('Background cloud sync error:', err);
      }
    }

    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportData = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(progress, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `meowlinux-profile-${userName.toLowerCase().replace(/\s+/g, '-')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      soundFx.playSuccess();
    } catch {
      soundFx.playError();
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed.xp === 'number') {
            onUpdateProgress(() => parsed);
            soundFx.playSuccess();
            setSyncMessage('Progress and profile imported successfully!');
          }
        } catch {
          soundFx.playError();
          setAuthError('Invalid profile JSON file.');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#111420] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Cat Sysadmin Profile & Cloud Account</h3>
              <p className="text-xs text-slate-400">Manage identity, Google account, and persistent progress sync</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Account Authentication Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-[#141b2d] border border-slate-800/90 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {currentUser ? (
                currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google Account'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl border border-emerald-500/40 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'G'}
                  </div>
                )
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center">
                  <Cloud className="w-5 h-5" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    {currentUser ? currentUser.displayName || 'Google Account' : 'Guest / Local Session'}
                  </span>
                  {currentUser ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                      <CloudCheck className="w-3 h-3" /> Cloud Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      Unauthenticated
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[280px] sm:max-w-md">
                  {currentUser
                    ? currentUser.email || `UID: ${currentUser.uid.slice(0, 12)}...`
                    : 'Sign in with Google to automatically back up badges, streaks, and terminal progress.'}
                </p>
              </div>
            </div>

            {/* Auth Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualCloudSync}
                    disabled={isSyncing}
                    className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                    title="Upload current achievements to Firestore"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                  <button
                    onClick={handleRestoreFromCloud}
                    disabled={isSyncing}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                    title="Pull remote progress down"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <button
                    onClick={handleSignInGoogle}
                    disabled={isSyncing}
                    className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    onClick={handleSignInGithub}
                    disabled={isSyncing}
                    className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Feedback messages */}
          {syncMessage && (
            <div className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 flex-shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          {authError && (
            <div className="text-[11px] text-rose-400 font-medium bg-rose-950/40 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}
        </div>

        {/* Avatar & Callsign Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-emerald-500/40 flex items-center justify-center text-4xl shadow-lg">
              {avatarId}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Choose Feline Avatar:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    onClick={() => {
                      soundFx.playKeypress();
                      setAvatarId(av);
                    }}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                      avatarId === av
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">Username / Full Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">SysAdmin Callsign / Title</label>
            <input
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-slate-400 font-semibold">Bio / Aspirations</label>
            <textarea
              rows={2}
              value={userBio}
              onChange={(e) => setUserBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">Preferred Shell Environment</label>
            <select
              value={preferredShell}
              onChange={(e) => setPreferredShell(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {SHELLS.map((sh) => (
                <option key={sh} value={sh}>
                  {sh}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">Pinned Showcase Badge</label>
            <select
              value={favoriteBadgeId}
              onChange={(e) => setFavoriteBadgeId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {BADGES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({progress.earnedBadges.includes(b.id) ? 'Earned' : 'Locked'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Local JSON Backup & Restore */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-300 block">Offline Backup & JSON Export:</span>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={handleExportData}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Progress JSON</span>
            </button>

            <label className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Progress JSON</span>
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Close
          </button>
          <button
            onClick={handleSaveProfile}
            className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{isSaved ? 'Saved & Synced!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
