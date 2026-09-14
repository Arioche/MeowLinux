import React, { useState } from 'react';
import { CONTAINER_PRESETS } from '../data/containerPresets';
import { ContainerPreset, UserProgress, TerminalEntry } from '../types';
import { VirtualFileSystem } from '../lib/vfs';
import { Terminal } from './Terminal';
import { soundFx } from '../lib/audio';
import { Server, Cpu, HardDrive, Network, RotateCcw, Download, Upload, Folder, File, ChevronRight, ChevronDown, Check, Terminal as TerminalIcon } from 'lucide-react';

interface ContainerManagerViewProps {
  progress: UserProgress;
  onUpdateActiveContainer: (containerId: string) => void;
  vfs: VirtualFileSystem;
  history: TerminalEntry[];
  onExecuteCommand: (cmd: string) => void;
  onClearTerminal: () => void;
  cwd: string;
  currentUser: string;
  engine: any;
}

export const ContainerManagerView: React.FC<ContainerManagerViewProps> = ({
  progress,
  onUpdateActiveContainer,
  vfs,
  history,
  onExecuteCommand,
  onClearTerminal,
  cwd,
  currentUser,
  engine,
}) => {
  const [activePresetId, setActivePresetId] = useState<string>(progress.activeContainerId || 'ubuntu-2404');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>('/etc/os-release');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({
    '/': true,
    '/etc': true,
    '/home': true,
    '/home/meow': true,
    '/var': true,
    '/var/log': true,
  });

  const activePreset = CONTAINER_PRESETS.find((p) => p.id === activePresetId) || CONTAINER_PRESETS[1];

  const handleSelectPreset = (preset: ContainerPreset) => {
    soundFx.playEnter();
    setActivePresetId(preset.id);
    onUpdateActiveContainer(preset.id);
  };

  const handleToggleDir = (path: string) => {
    setExpandedDirs((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleSelectFile = (path: string) => {
    const node = vfs.getNode(path);
    if (node && node.type === 'file') {
      setSelectedFilePath(path);
      setPreviewContent(node.content);
      soundFx.playKeypress();
    }
  };

  // Export container VFS as JSON snapshot
  const handleExportSnapshot = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vfs.root, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `meowlinux-${activePreset.id}-snapshot.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      soundFx.playSuccess();
    } catch {
      soundFx.playError();
    }
  };

  // Recursive directory tree renderer
  const renderDirTree = (dirNode: any, currentPath: string) => {
    if (!dirNode || !dirNode.children) return null;

    const children = Object.values(dirNode.children) as any[];

    return (
      <div className="pl-3 space-y-1">
        {children.map((child: any) => {
          const childPath = currentPath === '/' ? `/${child.name}` : `${currentPath}/${child.name}`;
          const isDir = child.type === 'dir';
          const isExpanded = Boolean(expandedDirs[childPath]);
          const isSelected = selectedFilePath === childPath;

          if (isDir) {
            return (
              <div key={childPath} className="text-xs">
                <div
                  onClick={() => handleToggleDir(childPath)}
                  className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-slate-300 transition"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span className="font-mono text-xs">{child.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">{child.permissions}</span>
                </div>
                {isExpanded && renderDirTree(child, childPath)}
              </div>
            );
          }

          return (
            <div
              key={childPath}
              onClick={() => handleSelectFile(childPath)}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg cursor-pointer transition text-xs ${
                isSelected
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'hover:bg-slate-800/60 text-slate-400'
              }`}
            >
              <span className="w-3.5" />
              <File className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-xs truncate">{child.name}</span>
              <span className="text-[10px] text-slate-500 font-mono ml-auto">
                {child.size || child.content?.length || 0}B
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Container Runtime Specs Banner */}
      <div className="bg-gradient-to-r from-[#111929] via-[#101420] to-[#121c30] border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>Dedicated User Container Sandbox</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
            {activePreset.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {activePreset.desc}
          </p>
        </div>

        {/* Live Container Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 self-stretch md:self-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-xs">
          <div className="text-center p-2 border-r border-slate-800">
            <div className="font-mono font-bold text-emerald-400">ONLINE</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Status</div>
          </div>
          <div className="text-center p-2 border-r border-slate-800">
            <div className="font-mono font-bold text-cyan-400">172.18.0.42</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">IP Address</div>
          </div>
          <div className="text-center p-2 border-r border-slate-800">
            <div className="font-mono font-bold text-amber-400">0.8%</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">CPU Load</div>
          </div>
          <div className="text-center p-2">
            <div className="font-mono font-bold text-purple-400">42MB / 512MB</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">RAM Usage</div>
          </div>
        </div>
      </div>

      {/* Distribution Switcher Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {CONTAINER_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`p-4 rounded-2xl border cursor-pointer transition text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#152033] border-cyan-500/80 shadow-lg ring-1 ring-cyan-500'
                  : 'bg-[#101420] hover:bg-[#131826] border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                    {preset.distro}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-1">
                  {preset.name}
                </h4>
                <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-400">
                  <div>Pkg: <span className="text-slate-200">{preset.pkgManager}</span></div>
                  <div>Shell: <span className="text-slate-200">{preset.shell}</span></div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                {preset.tag}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dual Layout: Real-time File Explorer & Live Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Visual Filesystem Tree & File Preview Drawer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111420] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">VFS Root Explorer</span>
              </div>

              <button
                onClick={handleExportSnapshot}
                className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition flex items-center gap-1"
                title="Export Container VFS JSON Snapshot"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export VFS</span>
              </button>
            </div>

            {/* Tree Navigation Container */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
              <div
                onClick={() => handleToggleDir('/')}
                className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-slate-200"
              >
                {expandedDirs['/'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span className="font-bold">/ (root)</span>
              </div>
              {expandedDirs['/'] && renderDirTree(vfs.root, '/')}
            </div>

            {/* Selected File Inspection Drawer */}
            {selectedFilePath && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                  <span className="text-emerald-400 font-semibold truncate">{selectedFilePath}</span>
                  <span>{previewContent.length} bytes</span>
                </div>
                <pre className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
                  {previewContent || '(empty file)'}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Container Terminal */}
        <div className="lg:col-span-7 flex flex-col h-[520px]">
          <Terminal
            history={history}
            onExecuteCommand={onExecuteCommand}
            onClear={onClearTerminal}
            cwd={cwd}
            currentUser={currentUser}
            onAutocomplete={(input) => engine.autocomplete(input, cwd, vfs)}
          />
        </div>
      </div>
    </div>
  );
};
