import { VirtualFileSystem } from './vfs';
import { VFSNode, VFSFile, VFSDirectory } from '../types';
import { soundFx } from './audio';

export interface CommandContext {
  vfs: VirtualFileSystem;
  cwd: string;
  setCwd: (newCwd: string) => void;
  currentUser: string;
  setCurrentUser: (user: string) => void;
  env: Record<string, string>;
  openNanoEditor?: (filePath: string, initialContent: string) => void;
  onSpecialAction?: (actionId: string, meta?: any) => void;
}

export interface CommandResult {
  output: string;
  type?: 'command' | 'output' | 'error' | 'success' | 'system' | 'ascii';
  newCwd?: string;
  newUser?: string;
  cleared?: boolean;
}

// Simulated active processes
export interface ProcessInfo {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  vsz: number;
  rss: number;
  tty: string;
  stat: string;
  start: string;
  time: string;
  command: string;
}

export class TerminalEngine {
  public processes: ProcessInfo[] = [
    { pid: 1, user: 'root', cpu: 0.0, mem: 0.2, vsz: 168920, rss: 11420, tty: '?', stat: 'Ss', start: '09:00', time: '0:03', command: '/sbin/init splash' },
    { pid: 2, user: 'root', cpu: 0.0, mem: 0.0, vsz: 0, rss: 0, tty: '?', stat: 'S', start: '09:00', time: '0:00', command: '[kthreadd]' },
    { pid: 412, user: 'root', cpu: 0.0, mem: 0.1, vsz: 7820, rss: 2400, tty: '?', stat: 'Ss', start: '09:14', time: '0:00', command: '/usr/sbin/cron -f' },
    { pid: 1024, user: 'root', cpu: 0.0, mem: 0.3, vsz: 15480, rss: 6920, tty: '?', stat: 'Ss', start: '09:15', time: '0:01', command: 'sshd: /usr/sbin/sshd -D [listener]' },
    { pid: 1410, user: 'meow', cpu: 0.1, mem: 0.4, vsz: 18240, rss: 8200, tty: 'pts/0', stat: 'Ss', start: '10:02', time: '0:02', command: '-bash' },
    { pid: 2048, user: 'www-data', cpu: 0.0, mem: 0.5, vsz: 54100, rss: 12400, tty: '?', stat: 'S', start: '10:10', time: '0:01', command: 'nginx: worker process' },
    { pid: 4096, user: 'meow', cpu: 98.4, mem: 14.8, vsz: 842100, rss: 154000, tty: 'pts/0', stat: 'R+', start: '10:12', time: '14:22', command: 'laser-pointer --infinite-loop --speed=max' },
  ];

  public services: Record<string, { status: 'active' | 'inactive' | 'failed'; enabled: boolean }> = {
    nginx: { status: 'inactive', enabled: false },
    ssh: { status: 'active', enabled: true },
    sshd: { status: 'active', enabled: true },
    cron: { status: 'active', enabled: true },
    systemd: { status: 'active', enabled: true },
    ufw: { status: 'inactive', enabled: false },
  };

  public ufwRules: string[] = [];

  // Parse input line into pipeline commands and redirects
  public execute(rawInput: string, ctx: CommandContext): CommandResult {
    const input = rawInput.trim();
    if (!input) {
      return { output: '' };
    }

    if (input === 'clear') {
      return { output: '', cleared: true };
    }

    // Check for sudo
    let isSudo = false;
    let actualInput = input;
    if (actualInput.startsWith('sudo ')) {
      isSudo = true;
      actualInput = actualInput.substring(5).trim();
      ctx.onSpecialAction?.('sudo_used');
    }

    // Safety check for rm -rf /
    if (actualInput.match(/^rm\s+(-rf|-fr|--recursive)\s+(\/|\/\*)$/)) {
      soundFx.playError();
      return {
        output: `🐾 [CAT PROTECTION PROTOCOL ACTIVATED]\nCommander Whiskers pounces onto your paws!\n"Hold your claws, young sysadmin! Running 'rm -rf /' would delete the entire feline universe!"`,
        type: 'error',
      };
    }

    // Check for redirection: > or >>
    let redirectFile: string | null = null;
    let redirectAppend = false;

    const redirectAppendMatch = actualInput.match(/^(.*?)\s*>>\s*(.+)$/);
    const redirectWriteMatch = actualInput.match(/^(.*?)\s*>\s*(.+)$/);

    if (redirectAppendMatch) {
      actualInput = redirectAppendMatch[1].trim();
      redirectFile = redirectAppendMatch[2].trim();
      redirectAppend = true;
    } else if (redirectWriteMatch) {
      actualInput = redirectWriteMatch[1].trim();
      redirectFile = redirectWriteMatch[2].trim();
      redirectAppend = false;
    }

    // Check for pipes: cmd1 | cmd2 | cmd3
    const pipeCommands = actualInput.split('|').map((c) => c.trim()).filter(Boolean);
    if (pipeCommands.length > 1) {
      ctx.onSpecialAction?.('pipe_used');
    }

    let pipelineInput = '';
    let lastResult: CommandResult = { output: '' };

    for (let i = 0; i < pipeCommands.length; i++) {
      const cmdStr = pipeCommands[i];
      lastResult = this.runSingleCommand(cmdStr, pipelineInput, isSudo, ctx);
      pipelineInput = lastResult.output;
      if (lastResult.type === 'error' && !lastResult.output) {
        break;
      }
    }

    // Handle redirection file write if specified
    if (redirectFile && lastResult.output) {
      const resolvedTarget = ctx.vfs.resolvePath(redirectFile, ctx.cwd);
      let existingContent = '';
      if (redirectAppend) {
        const existingNode = ctx.vfs.getNode(resolvedTarget);
        if (existingNode && existingNode.type === 'file') {
          existingContent = existingNode.content ? existingNode.content + '\n' : '';
        }
      }
      ctx.vfs.setFile(resolvedTarget, existingContent + lastResult.output, ctx.cwd);
      return {
        output: '',
        type: 'output',
        newCwd: lastResult.newCwd,
      };
    }

    return lastResult;
  }

  private runSingleCommand(
    commandLine: string,
    stdin: string,
    isSudo: boolean,
    ctx: CommandContext
  ): CommandResult {
    const tokens = this.tokenize(commandLine);
    if (tokens.length === 0) return { output: '' };

    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);
    const effectiveUser = isSudo ? 'root' : ctx.currentUser;

    switch (cmd) {
      case 'pwd':
        return { output: ctx.cwd };

      case 'whoami':
        return { output: effectiveUser };

      case 'id':
        return {
          output: effectiveUser === 'root'
            ? 'uid=0(root) gid=0(root) groups=0(root)'
            : 'uid=1000(meow) gid=1000(meow) groups=1000(meow),27(sudo),42(shadow)',
        };

      case 'uname': {
        const hasA = args.includes('-a');
        const hasR = args.includes('-r');
        const hasM = args.includes('-m');
        if (hasA) {
          return { output: 'Linux catnip-srv01 6.6.0-meow #1 SMP PREEMPT_DYNAMIC Sun Sep 12 12:00:00 UTC 2026 x86_64 GNU/Linux' };
        }
        if (hasR) return { output: '6.6.0-meow' };
        if (hasM) return { output: 'x86_64' };
        return { output: 'Linux' };
      }

      case 'uptime':
        return { output: ' 12:34:56 up 42 days, 3:14,  1 user,  load average: 0.12, 0.08, 0.05' };

      case 'date':
        return { output: new Date().toUTCString() };

      case 'free': {
        return {
          output: `               total        used        free      shared  buff/cache   available\nMem:         16384MB      3420MB     11240MB       210MB      1724MB     12450MB\nSwap:         4096MB           0MB      4096MB`,
        };
      }

      case 'df': {
        return {
          output: `Filesystem     1K-blocks      Used Available Use% Mounted on\nudev             8142200         0   8142200   0% /dev\ntmpfs            1638400      1420   1636980   1% /run\n/dev/sda1       61842000  12489200  46182800  22% /\ntmpfs            8192000         0   8192000   0% /dev/shm\n/dev/sda2      124920000  32100400  86419600  28% /home`,
        };
      }

      case 'cd': {
        let target = args[0] || '~';
        if (target === '~') target = effectiveUser === 'root' ? '/root' : '/home/meow';
        const resolved = ctx.vfs.resolvePath(target, ctx.cwd);
        const node = ctx.vfs.getNode(resolved);

        if (!node) {
          soundFx.playError();
          return { output: `bash: cd: ${target}: No such file or directory`, type: 'error' };
        }
        if (node.type !== 'dir') {
          soundFx.playError();
          return { output: `bash: cd: ${target}: Not a directory`, type: 'error' };
        }
        if (resolved === '/root' && effectiveUser !== 'root') {
          soundFx.playError();
          return { output: `bash: cd: /root: Permission denied`, type: 'error' };
        }
        return { output: '', newCwd: resolved };
      }

      case 'ls': {
        let showAll = false;
        let showLong = false;
        let targetPath = ctx.cwd;

        for (const arg of args) {
          if (arg.startsWith('-')) {
            if (arg.includes('a')) showAll = true;
            if (arg.includes('l')) showLong = true;
          } else {
            targetPath = arg;
          }
        }

        const resolved = ctx.vfs.resolvePath(targetPath, ctx.cwd);
        const node = ctx.vfs.getNode(resolved);

        if (!node) {
          soundFx.playError();
          return { output: `ls: cannot access '${targetPath}': No such file or directory`, type: 'error' };
        }

        if (node.type === 'file') {
          return { output: showLong ? `${node.permissions} 1 ${node.owner} ${node.group} ${node.size || node.content.length} Sep 12 ${node.name}` : node.name };
        }

        const entries = Object.values(node.children);
        const filtered = showAll ? entries : entries.filter((e) => !e.name.startsWith('.'));

        if (showLong) {
          const lines = [`total ${filtered.length * 4}`];
          for (const item of filtered) {
            const isDir = item.type === 'dir';
            const permPrefix = isDir ? 'd' : '-';
            const size = isDir ? 4096 : (item.size || item.content.length);
            lines.push(`${permPrefix}${item.permissions} 1 ${item.owner} ${item.group} ${size.toString().padStart(6, ' ')} Sep 12 ${item.name}${isDir ? '/' : ''}`);
          }
          return { output: lines.join('\n') };
        } else {
          const names = filtered.map((e) => (e.type === 'dir' ? `${e.name}/` : e.name));
          return { output: names.join('  ') };
        }
      }

      case 'cat': {
        ctx.onSpecialAction?.('cat_command');
        if (args.length === 0) {
          if (stdin) return { output: stdin };
          // Easter egg when cat is typed alone
          return {
            output: `  /\\_/\\\n ( o.o )  MEOW! I am the 'cat' command!\n  > ^ <   Pass a file path to inspect, e.g. 'cat /etc/os-release'`,
            type: 'ascii',
          };
        }

        const target = args[0];
        if (target === '/dev/yarn') {
          return { output: '🧶 Soft, infinite skein of yarn unravels endlessly in the console...' };
        }

        const resolved = ctx.vfs.resolvePath(target, ctx.cwd);
        const node = ctx.vfs.getNode(resolved);

        if (!node) {
          soundFx.playError();
          return { output: `cat: ${target}: No such file or directory`, type: 'error' };
        }
        if (node.type === 'dir') {
          soundFx.playError();
          return { output: `cat: ${target}: Is a directory`, type: 'error' };
        }

        // Permission check for shadow file
        if (resolved === '/etc/shadow' && effectiveUser !== 'root') {
          soundFx.playError();
          return { output: `cat: /etc/shadow: Permission denied (Requires root or shadow group)`, type: 'error' };
        }

        return { output: node.content };
      }

      case 'head': {
        let count = 10;
        let fileIdx = 0;
        if (args[0] === '-n' && args[1]) {
          count = parseInt(args[1], 10) || 10;
          fileIdx = 2;
        }

        let content = stdin;
        if (args[fileIdx]) {
          const resolved = ctx.vfs.resolvePath(args[fileIdx], ctx.cwd);
          const node = ctx.vfs.getNode(resolved);
          if (!node || node.type !== 'file') return { output: `head: cannot open '${args[fileIdx]}'`, type: 'error' };
          content = node.content;
        }
        const lines = content.split('\n');
        return { output: lines.slice(0, count).join('\n') };
      }

      case 'tail': {
        let count = 10;
        let fileIdx = 0;
        if (args[0] === '-n' && args[1]) {
          count = parseInt(args[1], 10) || 10;
          fileIdx = 2;
        }

        let content = stdin;
        if (args[fileIdx]) {
          const resolved = ctx.vfs.resolvePath(args[fileIdx], ctx.cwd);
          const node = ctx.vfs.getNode(resolved);
          if (!node || node.type !== 'file') return { output: `tail: cannot open '${args[fileIdx]}'`, type: 'error' };
          content = node.content;
        }
        const lines = content.split('\n');
        return { output: lines.slice(-count).join('\n') };
      }

      case 'grep': {
        let caseInsensitive = false;
        let invertMatch = false;
        let pattern = '';
        let filePath = '';

        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (arg === '-i') caseInsensitive = true;
          else if (arg === '-v') invertMatch = true;
          else if (!pattern) {
            pattern = arg.replace(/^["']|["']$/g, '');
          } else if (!filePath) {
            filePath = arg;
          }
        }

        let text = stdin;
        if (filePath) {
          const resolved = ctx.vfs.resolvePath(filePath, ctx.cwd);
          const node = ctx.vfs.getNode(resolved);
          if (!node || node.type !== 'file') {
            soundFx.playError();
            return { output: `grep: ${filePath}: No such file or directory`, type: 'error' };
          }
          text = node.content;
        }

        if (!pattern) return { output: text };

        const lines = text.split('\n');
        const regex = new RegExp(pattern, caseInsensitive ? 'i' : '');
        const matched = lines.filter((l) => (invertMatch ? !regex.test(l) : regex.test(l)));

        return { output: matched.join('\n') };
      }

      case 'mkdir': {
        let recursive = false;
        let paths: string[] = [];

        for (const arg of args) {
          if (arg === '-p') recursive = true;
          else paths.push(arg);
        }

        if (paths.length === 0) return { output: 'mkdir: missing operand', type: 'error' };

        for (const p of paths) {
          const ok = ctx.vfs.createDirectory(p, ctx.cwd, { recursive, owner: effectiveUser, group: effectiveUser });
          if (!ok) {
            soundFx.playError();
            return { output: `mkdir: cannot create directory '${p}': No such file or directory`, type: 'error' };
          }
        }
        return { output: '' };
      }

      case 'touch': {
        if (args.length === 0) return { output: 'touch: missing file operand', type: 'error' };
        for (const p of args) {
          const resolved = ctx.vfs.resolvePath(p, ctx.cwd);
          const existing = ctx.vfs.getNode(resolved);
          if (!existing) {
            ctx.vfs.setFile(p, '', ctx.cwd, { owner: effectiveUser, group: effectiveUser });
          }
        }
        return { output: '' };
      }

      case 'rm': {
        let recursive = false;
        let targets: string[] = [];

        for (const arg of args) {
          if (arg.startsWith('-')) {
            if (arg.includes('r') || arg.includes('R')) recursive = true;
          } else {
            targets.push(arg);
          }
        }

        if (targets.length === 0) return { output: 'rm: missing operand', type: 'error' };

        for (const target of targets) {
          const resolved = ctx.vfs.resolvePath(target, ctx.cwd);
          const ok = ctx.vfs.removeNode(resolved, ctx.cwd, recursive);
          if (!ok) {
            soundFx.playError();
            return { output: `rm: cannot remove '${target}': No such file or directory or is a directory`, type: 'error' };
          }
        }
        return { output: '' };
      }

      case 'cp': {
        if (args.length < 2) return { output: 'cp: missing file operand', type: 'error' };
        const src = args[0];
        const dest = args[1];

        const srcNode = ctx.vfs.getNode(src, ctx.cwd);
        if (!srcNode || srcNode.type !== 'file') {
          soundFx.playError();
          return { output: `cp: cannot stat '${src}': No such file`, type: 'error' };
        }

        let destResolved = ctx.vfs.resolvePath(dest, ctx.cwd);
        const destNode = ctx.vfs.getNode(destResolved);
        if (destNode && destNode.type === 'dir') {
          destResolved = `${destResolved}/${srcNode.name}`.replace(/\/+/g, '/');
        }

        ctx.vfs.setFile(destResolved, srcNode.content, '/', {
          permissions: srcNode.permissions,
          owner: effectiveUser,
          group: effectiveUser,
        });
        return { output: '' };
      }

      case 'mv': {
        if (args.length < 2) return { output: 'mv: missing file operand', type: 'error' };
        const src = args[0];
        const dest = args[1];

        const srcNode = ctx.vfs.getNode(src, ctx.cwd);
        if (!srcNode) {
          soundFx.playError();
          return { output: `mv: cannot stat '${src}': No such file or directory`, type: 'error' };
        }

        let destResolved = ctx.vfs.resolvePath(dest, ctx.cwd);
        const destNode = ctx.vfs.getNode(destResolved);
        if (destNode && destNode.type === 'dir') {
          destResolved = `${destResolved}/${srcNode.name}`.replace(/\/+/g, '/');
        }

        if (srcNode.type === 'file') {
          ctx.vfs.setFile(destResolved, srcNode.content, '/', {
            permissions: srcNode.permissions,
            owner: srcNode.owner,
            group: srcNode.group,
          });
          ctx.vfs.removeNode(src, ctx.cwd, false);
        }
        return { output: '' };
      }

      case 'chmod': {
        if (args.length < 2) return { output: 'chmod: missing operand', type: 'error' };
        const mode = args[0];
        const path = args[1];
        const ok = ctx.vfs.chmod(path, mode, ctx.cwd);
        if (!ok) {
          soundFx.playError();
          return { output: `chmod: cannot access '${path}': No such file or directory`, type: 'error' };
        }
        return { output: '' };
      }

      case 'chown': {
        if (args.length < 2) return { output: 'chown: missing operand', type: 'error' };
        const ownerSpec = args[0];
        const path = args[1];
        const ok = ctx.vfs.chown(path, ownerSpec, ctx.cwd);
        if (!ok) {
          soundFx.playError();
          return { output: `chown: cannot access '${path}': No such file or directory`, type: 'error' };
        }
        return { output: '' };
      }

      case 'find': {
        let namePattern = '';
        let startPath = args[0] && !args[0].startsWith('-') ? args[0] : '.';

        for (let i = 0; i < args.length; i++) {
          if (args[i] === '-name' && args[i + 1]) {
            namePattern = args[i + 1].replace(/^["']|["']$/g, '');
          }
        }

        const resolved = ctx.vfs.resolvePath(startPath, ctx.cwd);
        const rootNode = ctx.vfs.getNode(resolved);
        if (!rootNode) return { output: `find: '${startPath}': No such file or directory`, type: 'error' };

        const results: string[] = [];
        const walk = (node: VFSNode, curPath: string) => {
          let match = true;
          if (namePattern) {
            if (namePattern.startsWith('*.') && node.name.endsWith(namePattern.substring(1))) {
              match = true;
            } else if (node.name === namePattern) {
              match = true;
            } else {
              match = false;
            }
          }
          if (match) results.push(curPath);

          if (node.type === 'dir') {
            for (const child of Object.values(node.children)) {
              const childPath = `${curPath}/${child.name}`.replace(/\/+/g, '/');
              walk(child, childPath);
            }
          }
        };

        walk(rootNode, startPath === '.' ? '.' : resolved);
        return { output: results.join('\n') };
      }

      case 'echo': {
        let text = args.join(' ');
        // Environment variable substitution
        text = text.replace(/\$USER/g, effectiveUser);
        text = text.replace(/\$HOME/g, effectiveUser === 'root' ? '/root' : '/home/meow');
        text = text.replace(/\$PWD/g, ctx.cwd);
        text = text.replace(/^["']|["']$/g, '');
        return { output: text };
      }

      case 'ps': {
        const header = 'USER       PID  %CPU %MEM   VSZ   RSS TTY      STAT START   TIME COMMAND';
        const lines = [header];
        for (const p of this.processes) {
          lines.push(
            `${p.user.padEnd(8)} ${p.pid.toString().padStart(6)} ${p.cpu.toFixed(1).padStart(5)} ${p.mem.toFixed(1).padStart(4)} ${p.vsz.toString().padStart(7)} ${p.rss.toString().padStart(5)} ${p.tty.padEnd(8)} ${p.stat.padEnd(4)} ${p.start} ${p.time.padStart(6)} ${p.command}`
          );
        }
        return { output: lines.join('\n') };
      }

      case 'kill': {
        let pidStr = args[args.length - 1];
        const pid = parseInt(pidStr, 10);
        const idx = this.processes.findIndex((p) => p.pid === pid);
        if (idx !== -1) {
          const removed = this.processes.splice(idx, 1)[0];
          return { output: `[1]+  Terminated              ${removed.command}` };
        }
        return { output: `bash: kill: (${pidStr}) - No such process`, type: 'error' };
      }

      case 'killall': {
        const name = args[0];
        const initialLen = this.processes.length;
        this.processes = this.processes.filter((p) => !p.command.includes(name));
        if (this.processes.length < initialLen) {
          return { output: `${name}: process terminated` };
        }
        return { output: `${name}: no process found`, type: 'error' };
      }

      case 'tar': {
        // e.g. tar -czvf archive.tar.gz folder
        let create = false;
        let extract = false;
        let archiveFile = '';
        let targetPath = '';

        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (arg.startsWith('-')) {
            if (arg.includes('c')) create = true;
            if (arg.includes('x')) extract = true;
          } else if (!archiveFile) {
            archiveFile = arg;
          } else if (!targetPath) {
            targetPath = arg;
          }
        }

        if (create) {
          if (!archiveFile || !targetPath) return { output: 'tar: missing arguments. Example: tar -czvf archive.tar.gz folder', type: 'error' };
          const resolvedSrc = ctx.vfs.resolvePath(targetPath, ctx.cwd);
          const node = ctx.vfs.getNode(resolvedSrc);
          if (!node) return { output: `tar: ${targetPath}: Cannot stat: No such file or directory`, type: 'error' };

          ctx.vfs.setFile(archiveFile, `[GZIP TAR ARCHIVE PAYLOAD FOR ${targetPath}]`, ctx.cwd);
          return { output: `${targetPath}/\n${targetPath}/file1\n${targetPath}/file2\ntar: Archive created: ${archiveFile}` };
        }

        if (extract) {
          return { output: `tar: Extracted archive ${archiveFile}` };
        }

        return { output: 'tar: specify either -c (create) or -x (extract)' };
      }

      case 'systemctl': {
        const action = args[0];
        const unit = args[1] || 'nginx';
        const cleanUnit = unit.replace(/\.service$/, '');

        if (!action || action === 'status') {
          const s = this.services[cleanUnit] || { status: 'inactive', enabled: false };
          return {
            output: `● ${cleanUnit}.service - ${cleanUnit} daemon service\n     Loaded: loaded (/lib/systemd/system/${cleanUnit}.service; ${s.enabled ? 'enabled' : 'disabled'})\n     Active: ${s.status === 'active' ? 'active (running)' : 'inactive (dead)'} since Sep 12 12:00:00 UTC\n    Process: 2048 ExecStart=/usr/sbin/${cleanUnit} (code=exited, status=0/SUCCESS)\n   Main PID: 2048 (${cleanUnit})`,
          };
        }

        if (action === 'start') {
          if (!this.services[cleanUnit]) this.services[cleanUnit] = { status: 'inactive', enabled: false };
          this.services[cleanUnit].status = 'active';
          return { output: `Started ${cleanUnit}.service` };
        }
        if (action === 'stop') {
          if (this.services[cleanUnit]) this.services[cleanUnit].status = 'inactive';
          return { output: `Stopped ${cleanUnit}.service` };
        }
        if (action === 'restart') {
          if (!this.services[cleanUnit]) this.services[cleanUnit] = { status: 'inactive', enabled: false };
          this.services[cleanUnit].status = 'active';
          return { output: `Restarted ${cleanUnit}.service` };
        }
        if (action === 'enable') {
          if (!this.services[cleanUnit]) this.services[cleanUnit] = { status: 'inactive', enabled: false };
          this.services[cleanUnit].enabled = true;
          return { output: `Created symlink /etc/systemd/system/multi-user.target.wants/${cleanUnit}.service → /lib/systemd/system/${cleanUnit}.service.` };
        }

        return { output: `systemctl: command completed for ${cleanUnit}` };
      }

      case 'nginx': {
        if (args.includes('-t')) {
          return {
            output: `nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful`,
          };
        }
        return { output: 'nginx: [alert] could not open error log file' };
      }

      case 'ufw': {
        const sub = args[0];
        if (sub === 'enable') {
          this.services['ufw'].status = 'active';
          return { output: 'Firewall is active and enabled on system startup' };
        }
        if (sub === 'disable') {
          this.services['ufw'].status = 'inactive';
          return { output: 'Firewall stopped and disabled on system startup' };
        }
        if (sub === 'allow') {
          const rule = args[1] || '22';
          this.ufwRules.push(rule);
          return { output: `Rule added\nRule added (v6)` };
        }
        if (sub === 'status') {
          const isActive = this.services['ufw'].status === 'active';
          if (!isActive) return { output: 'Status: inactive' };
          const rulesOutput = this.ufwRules.map((r) => `${r.padEnd(20)} ALLOW       Anywhere`).join('\n');
          return { output: `Status: active\n\nTo                         Action      From\n--                         ------      ----\n${rulesOutput || '22/tcp                     ALLOW       Anywhere'}` };
        }
        return { output: 'Usage: ufw [--version] [status] [enable|disable] [allow|deny|reject] [delete]' };
      }

      case 'ip': {
        const sub = args[0];
        if (sub === 'a' || sub === 'addr' || !sub) {
          return {
            output: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000\n    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff\n    inet 192.168.1.100/24 brd 192.168.1.255 scope global dynamic eth0`,
          };
        }
        if (sub === 'route' || sub === 'r') {
          return { output: `default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.100 metric 100\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100 metric 100` };
        }
        return { output: 'ip [ addr | link | route ]' };
      }

      case 'nano': {
        const targetPath = args[0] || 'untitled.txt';
        const resolved = ctx.vfs.resolvePath(targetPath, ctx.cwd);
        const node = ctx.vfs.getNode(resolved);
        const content = node && node.type === 'file' ? node.content : '';

        if (ctx.openNanoEditor) {
          ctx.openNanoEditor(resolved, content);
          return { output: `[Opened ${targetPath} in MeowNano editor]` };
        }
        return { output: 'nano: text editor opened' };
      }

      case 'vim':
      case 'vi': {
        return {
          output: `🐾 [CAT VIM WISDOM]\nTo exit vim without panic, press Esc, then type :wq (write and quit) or :q! (quit without saving)!\n(Pro-tip: Try 'nano <filename>' for our friendly built-in feline visual editor!)`,
        };
      }

      case 'meow':
      case 'purr': {
        soundFx.playMeow();
        ctx.onSpecialAction?.('cat_command');
        const meows = [
          `🐾 *MEOW!* Commander Whiskers stretches lazily and purrs approvingly!`,
          `🐾 *PRRR-ROW!* High paws! Your Linux shell mastery is growing stronger!`,
          `🐾 *Purrrr...* Kernel memory allocated for 1 bowl of premium tuna!`,
          `🐾 *Chirp-mew!* Did someone say root privileges and catnip treats?!`,
        ];
        return {
          output: meows[Math.floor(Math.random() * meows.length)],
          type: 'success',
        };
      }

      case 'help':
      case 'man': {
        return {
          output: `========================================================================\n                 🐾 MEOWLINUX SHELL COMMAND DIRECTORY 🐾\n========================================================================\nNAVIGATION:       pwd, ls, ls -la, cd <dir>, cd ..\nFILE CREATION:    touch <file>, mkdir -p <dir>, echo "text" > <file>\nFILE OPERATIONS:  cat, head, tail, cp, mv, rm, find . -name "*.txt"\nPERMISSIONS:      chmod 755 / 600 <file>, chown user:group <file>\nPIPES & STREAMS:  cmd1 | cmd2, cmd > file.txt, cmd >> file.txt, grep "str"\nPROCESS MGMT:     ps aux, top, kill <PID>, killall <name>\nSYSTEM & NETWORK: uname -a, df -h, free -h, uptime, ip a, systemctl, ufw\nTEXT EDITORS:     nano <file> (Visual nano text editor modal)\nFELINE COMMANDS:  meow, purr, cat (without args)\n\nTip: Use UP/DOWN arrows for history, TAB for autocompletion, 'clear' to reset!`,
        };
      }

      default:
        soundFx.playError();
        return {
          output: `bash: ${cmd}: command not found. Type 'help' to see available commands!`,
          type: 'error',
        };
    }
  }

  // Tokenize preserving quoted strings
  private tokenize(line: string): string[] {
    const tokens: string[] = [];
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match[1] !== undefined) {
        tokens.push(match[1]);
      } else if (match[2] !== undefined) {
        tokens.push(match[2]);
      } else {
        tokens.push(match[0]);
      }
    }

    return tokens;
  }

  // Auto-complete suggestion for tab key
  public autocomplete(currentInput: string, cwd: string, vfs: VirtualFileSystem): { completed: string; suggestions: string[] } {
    const trimmed = currentInput.trimStart();
    const parts = trimmed.split(/\s+/);

    const standardCommands = [
      'pwd', 'ls', 'cd', 'cat', 'head', 'tail', 'grep', 'mkdir', 'touch', 'rm',
      'cp', 'mv', 'chmod', 'chown', 'find', 'echo', 'clear', 'whoami', 'id',
      'uname', 'uptime', 'free', 'df', 'ps', 'kill', 'killall', 'tar',
      'systemctl', 'nginx', 'ufw', 'ip', 'nano', 'vim', 'meow', 'purr', 'help',
    ];

    if (parts.length <= 1) {
      const prefix = parts[0] || '';
      const matches = standardCommands.filter((c) => c.startsWith(prefix));
      if (matches.length === 1) {
        return { completed: matches[0] + ' ', suggestions: [] };
      }
      return { completed: currentInput, suggestions: matches };
    }

    // Path completion
    const lastArg = parts[parts.length - 1];
    const slashIdx = lastArg.lastIndexOf('/');
    let searchDir = cwd;
    let filePrefix = lastArg;

    if (slashIdx !== -1) {
      const dirPart = lastArg.substring(0, slashIdx) || '/';
      searchDir = vfs.resolvePath(dirPart, cwd);
      filePrefix = lastArg.substring(slashIdx + 1);
    }

    const dirNode = vfs.getNode(searchDir);
    if (!dirNode || dirNode.type !== 'dir') {
      return { completed: currentInput, suggestions: [] };
    }

    const fileMatches = Object.keys(dirNode.children).filter((name) => name.startsWith(filePrefix));
    if (fileMatches.length === 1) {
      const matched = fileMatches[0];
      const isDir = dirNode.children[matched].type === 'dir';
      const replacement = slashIdx !== -1
        ? lastArg.substring(0, slashIdx + 1) + matched + (isDir ? '/' : ' ')
        : matched + (isDir ? '/' : ' ');
      parts[parts.length - 1] = replacement;
      return { completed: parts.join(' '), suggestions: [] };
    }

    return { completed: currentInput, suggestions: fileMatches };
  }
}
