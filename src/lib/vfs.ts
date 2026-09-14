import { VFSNode, VFSFile, VFSDirectory } from '../types';

export class VirtualFileSystem {
  public root: VFSDirectory;

  constructor(initialData?: VFSDirectory) {
    if (initialData) {
      this.root = JSON.parse(JSON.stringify(initialData));
    } else {
      this.root = this.createDefaultFHS();
    }
  }

  // Generate standard Linux Filesystem Hierarchy (FHS)
  public createDefaultFHS(): VFSDirectory {
    return {
      type: 'dir',
      name: '',
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
      children: {
        bin: {
          type: 'dir',
          name: 'bin',
          permissions: 'rwxr-xr-x',
          owner: 'root',
          group: 'root',
          children: {
            bash: { type: 'file', name: 'bash', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: '#!/bin/bash binary' },
            ls: { type: 'file', name: 'ls', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'ls binary' },
            cat: { type: 'file', name: 'cat', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'cat binary' },
            grep: { type: 'file', name: 'grep', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'grep binary' },
            chmod: { type: 'file', name: 'chmod', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'chmod binary' },
            chown: { type: 'file', name: 'chown', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'chown binary' },
            tar: { type: 'file', name: 'tar', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'tar binary' },
            systemctl: { type: 'file', name: 'systemctl', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'systemctl binary' },
          },
        },
        etc: {
          type: 'dir',
          name: 'etc',
          permissions: 'rwxr-xr-x',
          owner: 'root',
          group: 'root',
          children: {
            'os-release': {
              type: 'file',
              name: 'os-release',
              permissions: 'rw-r--r--',
              owner: 'root',
              group: 'root',
              content: `NAME="MeowLinux"\nVERSION="2026.1 (Calico LTS)"\nID=meowlinux\nID_LIKE=debian\nPRETTY_NAME="MeowLinux 2026.1 LPIC Academy"\nVERSION_CODENAME=catnip\nHOME_URL="https://meowlinux.academy"`,
            },
            hostname: {
              type: 'file',
              name: 'hostname',
              permissions: 'rw-r--r--',
              owner: 'root',
              group: 'root',
              content: 'catnip-srv01\n',
            },
            passwd: {
              type: 'file',
              name: 'passwd',
              permissions: 'rw-r--r--',
              owner: 'root',
              group: 'root',
              content: `root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nmeow:x:1000:1000:Whiskers McPaws:/home/meow:/bin/bash\nnginx:x:1001:1001:Nginx Web Server:/var/www:/usr/sbin/nologin`,
            },
            shadow: {
              type: 'file',
              name: 'shadow',
              permissions: 'rw-------', // secure by default unless challenge overrides
              owner: 'root',
              group: 'shadow',
              content: `root:$6$rounds=4096$catnip$k8Z...:19412:0:99999:7:::\nmeow:$6$rounds=4096$tuna$j29...:19412:0:99999:7:::`,
            },
            group: {
              type: 'file',
              name: 'group',
              permissions: 'rw-r--r--',
              owner: 'root',
              group: 'root',
              content: `root:x:0:\nsudo:x:27:meow\nmeow:x:1000:\nshadow:x:42:meow\nwheel:x:999:meow`,
            },
            'resolv.conf': {
              type: 'file',
              name: 'resolv.conf',
              permissions: 'rw-r--r--',
              owner: 'root',
              group: 'root',
              content: `nameserver 1.1.1.1\nnameserver 8.8.8.8\nsearch meowlinux.local`,
            },
            ssh: {
              type: 'dir',
              name: 'ssh',
              permissions: 'rwxr-xr-x',
              owner: 'root',
              group: 'root',
              children: {
                sshd_config: {
                  type: 'file',
                  name: 'sshd_config',
                  permissions: 'rw-r--r--',
                  owner: 'root',
                  group: 'root',
                  content: `# SSH Server Configuration\nPort 22\nPermitRootLogin yes\nPasswordAuthentication yes\nMaxAuthTries 6\nChallengeResponseAuthentication no\nUsePAM yes`,
                },
              },
            },
          },
        },
        home: {
          type: 'dir',
          name: 'home',
          permissions: 'rwxr-xr-x',
          owner: 'root',
          group: 'root',
          children: {
            meow: {
              type: 'dir',
              name: 'meow',
              permissions: 'rwxr-xr-x',
              owner: 'meow',
              group: 'meow',
              children: {
                '.bashrc': {
                  type: 'file',
                  name: '.bashrc',
                  permissions: 'rw-r--r--',
                  owner: 'meow',
                  group: 'meow',
                  content: `# MeowLinux Bash Profile\nexport PS1="\\[\\033[01;32m\\]\\u@catnip\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ "\nalias ll="ls -la"\nalias l="ls -CF"\nalias meow="echo '🐾 Meow! Keep your paws on the keyboard!'"`,
                },
                'welcome.txt': {
                  type: 'file',
                  name: 'welcome.txt',
                  permissions: 'rw-r--r--',
                  owner: 'meow',
                  group: 'meow',
                  content: `=============================================\n  🐾 WELCOME TO MEOWLINUX LPIC ACADEMY 🐾\n=============================================\n\nSharpen your claws on real Linux administration!\nSelect an LPIC quest or type commands freely.\n\nQuick Commands:\n  help        - Show available commands & tips\n  pwd         - Print working directory\n  ls -la      - List all files with permissions\n  cat <file>  - Display file contents\n  meow        - Hear your cat companion purr\n`,
                },
                projects: {
                  type: 'dir',
                  name: 'projects',
                  permissions: 'rwxr-xr-x',
                  owner: 'meow',
                  group: 'meow',
                  children: {},
                },
              },
            },
          },
        },
        root: {
          type: 'dir',
          name: 'root',
          permissions: 'rwx------',
          owner: 'root',
          group: 'root',
          children: {
            '.bashrc': {
              type: 'file',
              name: '.bashrc',
              permissions: 'rw-r--r--',
              owner: 'root',
              group: 'root',
              content: `export PS1="\\[\\033[01;31m\\]\\u@catnip\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\# "`,
            },
          },
        },
        var: {
          type: 'dir',
          name: 'var',
          permissions: 'rwxr-xr-x',
          owner: 'root',
          group: 'root',
          children: {
            log: {
              type: 'dir',
              name: 'log',
              permissions: 'rwxr-xr-x',
              owner: 'root',
              group: 'root',
              children: {
                syslog: {
                  type: 'file',
                  name: 'syslog',
                  permissions: 'rw-r-----',
                  owner: 'root',
                  group: 'adm',
                  content: `Sep 12 09:14:02 catnip-srv01 kernel: [    0.000000] Linux version 6.6.0-meow (gcc 13.2.0)\nSep 12 09:14:02 catnip-srv01 systemd[1]: Starting Network Time Synchronization...\nSep 12 09:14:03 catnip-srv01 systemd[1]: Started Daily apt download activities.\nSep 12 09:14:10 catnip-srv01 cron[412]: (CRON) INFO (pid checks)\nSep 12 09:15:00 catnip-srv01 sshd[1024]: Server listening on 0.0.0.0 port 22.`,
                },
                'auth.log': {
                  type: 'file',
                  name: 'auth.log',
                  permissions: 'rw-r-----',
                  owner: 'root',
                  group: 'adm',
                  content: `Sep 12 10:02:11 catnip-srv01 sshd[1410]: Accepted publickey for meow from 192.168.1.100 port 52341 ssh2\nSep 12 10:05:22 catnip-srv01 sshd[1422]: Failed password for invalid user dog from 203.0.113.45 port 39121 ssh2\nSep 12 10:05:25 catnip-srv01 sshd[1424]: Failed password for invalid user dog from 203.0.113.45 port 39123 ssh2\nSep 12 10:05:29 catnip-srv01 sshd[1426]: Failed password for invalid user admin from 203.0.113.45 port 39125 ssh2\nSep 12 10:08:40 catnip-srv01 sudo: meow : TTY=pts/0 ; PWD=/home/meow ; USER=root ; COMMAND=/bin/cat /etc/shadow`,
                },
                nginx: {
                  type: 'dir',
                  name: 'nginx',
                  permissions: 'rwxr-xr-x',
                  owner: 'root',
                  group: 'root',
                  children: {
                    'access.log': {
                      type: 'file',
                      name: 'access.log',
                      permissions: 'rw-r--r--',
                      owner: 'nginx',
                      group: 'adm',
                      content: `192.168.1.50 - - [12/Sep/2026:11:00:12 +0000] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0"\n192.168.1.50 - - [12/Sep/2026:11:00:14 +0000] "GET /catnip.png HTTP/1.1" 200 45210 "-" "Mozilla/5.0"\n203.0.113.19 - - [12/Sep/2026:11:02:01 +0000] "POST /login HTTP/1.1" 401 142 "-" "curl/7.88"`,
                    },
                  },
                },
              },
            },
            www: {
              type: 'dir',
              name: 'www',
              permissions: 'rwxr-xr-x',
              owner: 'root',
              group: 'root',
              children: {
                html: {
                  type: 'dir',
                  name: 'html',
                  permissions: 'rwxr-xr-x',
                  owner: 'www-data',
                  group: 'www-data',
                  children: {
                    'index.html': {
                      type: 'file',
                      name: 'index.html',
                      permissions: 'rw-r--r--',
                      owner: 'www-data',
                      group: 'www-data',
                      content: `<!DOCTYPE html><html><body><h1>MeowLinux Nginx Default Page</h1><p>Running Purr-fectly!</p></body></html>`,
                    },
                  },
                },
              },
            },
          },
        },
        tmp: {
          type: 'dir',
          name: 'tmp',
          permissions: 'rwxrwxrwt',
          owner: 'root',
          group: 'root',
          children: {},
        },
        usr: {
          type: 'dir',
          name: 'usr',
          permissions: 'rwxr-xr-x',
          owner: 'root',
          group: 'root',
          children: {
            bin: {
              type: 'dir',
              name: 'bin',
              permissions: 'rwxr-xr-x',
              owner: 'root',
              group: 'root',
              children: {
                nano: { type: 'file', name: 'nano', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'nano editor' },
                vim: { type: 'file', name: 'vim', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'vim editor' },
                curl: { type: 'file', name: 'curl', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'curl client' },
                grep: { type: 'file', name: 'grep', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', content: 'grep tool' },
              },
            },
          },
        },
      },
    };
  }

  // Normalize path string relative to current working directory
  public resolvePath(targetPath: string, cwd: string = '/home/meow'): string {
    let raw = targetPath.trim();
    if (raw === '~' || raw.startsWith('~/')) {
      raw = raw.replace(/^~/, '/home/meow');
    }

    let segments: string[];
    if (raw.startsWith('/')) {
      segments = raw.split('/').filter(Boolean);
    } else {
      const cwdSegments = cwd.split('/').filter(Boolean);
      const targetSegments = raw.split('/').filter(Boolean);
      segments = [...cwdSegments, ...targetSegments];
    }

    const resolved: string[] = [];
    for (const seg of segments) {
      if (seg === '.') continue;
      if (seg === '..') {
        resolved.pop();
      } else {
        resolved.push(seg);
      }
    }

    return '/' + resolved.join('/');
  }

  // Get a node by path
  public getNode(path: string, cwd: string = '/home/meow'): VFSNode | null {
    const resolved = this.resolvePath(path, cwd);
    if (resolved === '/') return this.root;

    const parts = resolved.split('/').filter(Boolean);
    let curr: VFSNode = this.root;

    for (const part of parts) {
      if (curr.type !== 'dir') return null;
      const next = curr.children[part];
      if (!next) return null;
      curr = next;
    }

    return curr;
  }

  // Create or overwrite file
  public setFile(
    path: string,
    content: string,
    cwd: string = '/home/meow',
    options?: { permissions?: string; owner?: string; group?: string }
  ): boolean {
    const resolved = this.resolvePath(path, cwd);
    const parts = resolved.split('/').filter(Boolean);
    if (parts.length === 0) return false;

    const fileName = parts.pop()!;
    const parentPath = '/' + parts.join('/');
    const parentNode = this.getNode(parentPath, '/');

    if (!parentNode || parentNode.type !== 'dir') return false;

    const existing = parentNode.children[fileName];
    if (existing && existing.type === 'dir') return false;

    parentNode.children[fileName] = {
      type: 'file',
      name: fileName,
      content,
      permissions: options?.permissions || (existing ? existing.permissions : 'rw-r--r--'),
      owner: options?.owner || (existing ? existing.owner : 'meow'),
      group: options?.group || (existing ? existing.group : 'meow'),
      size: content.length,
      modified: new Date().toISOString(),
    };
    return true;
  }

  // Create directory (support mkdir -p)
  public createDirectory(
    path: string,
    cwd: string = '/home/meow',
    options?: { recursive?: boolean; permissions?: string; owner?: string; group?: string }
  ): boolean {
    const resolved = this.resolvePath(path, cwd);
    const parts = resolved.split('/').filter(Boolean);
    if (parts.length === 0) return true;

    let curr: VFSDirectory = this.root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const next = curr.children[part];
      if (!next) {
        if (i < parts.length - 1 && !options?.recursive) {
          return false;
        }
        const newDir: VFSDirectory = {
          type: 'dir',
          name: part,
          permissions: options?.permissions || 'rwxr-xr-x',
          owner: options?.owner || 'meow',
          group: options?.group || 'meow',
          children: {},
        };
        curr.children[part] = newDir;
        curr = newDir;
      } else if (next.type === 'dir') {
        curr = next;
      } else {
        return false; // Collision with existing file
      }
    }
    return true;
  }

  // Remove file or directory
  public removeNode(path: string, cwd: string = '/home/meow', recursive: boolean = false): boolean {
    const resolved = this.resolvePath(path, cwd);
    if (resolved === '/' || resolved === '/root' || resolved === '/home') return false;

    const parts = resolved.split('/').filter(Boolean);
    const targetName = parts.pop()!;
    const parentPath = '/' + parts.join('/');
    const parentNode = this.getNode(parentPath, '/');

    if (!parentNode || parentNode.type !== 'dir') return false;
    const target = parentNode.children[targetName];
    if (!target) return false;

    if (target.type === 'dir' && Object.keys(target.children).length > 0 && !recursive) {
      return false; // Directory not empty
    }

    delete parentNode.children[targetName];
    return true;
  }

  // Change permissions (handles octal "755", "644", etc.)
  public chmod(path: string, mode: string, cwd: string = '/home/meow'): boolean {
    const node = this.getNode(path, cwd);
    if (!node) return false;

    const octalMatch = mode.match(/^([0-7])([0-7])([0-7])$/);
    if (octalMatch) {
      const toRwx = (digit: string) => {
        const n = parseInt(digit, 10);
        return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
      };
      node.permissions = toRwx(octalMatch[1]) + toRwx(octalMatch[2]) + toRwx(octalMatch[3]);
      return true;
    }

    // Symbolic shortcuts (e.g. +x, -w)
    if (mode.includes('+x')) {
      node.permissions = node.permissions.replace(/-/g, (match, offset) => {
        return offset % 3 === 2 ? 'x' : match;
      });
      return true;
    }

    return false;
  }

  // Change owner & group
  public chown(path: string, ownerSpec: string, cwd: string = '/home/meow'): boolean {
    const node = this.getNode(path, cwd);
    if (!node) return false;

    const [user, group] = ownerSpec.split(':');
    if (user) node.owner = user;
    if (group) node.group = group;
    return true;
  }

  // Convert octal mode back from rwx
  public static rwxToOctal(perm: string): string {
    if (!perm || perm.length !== 9) return '644';
    const toDigit = (sub: string) => {
      let d = 0;
      if (sub[0] === 'r') d += 4;
      if (sub[1] === 'w') d += 2;
      if (sub[2] === 'x') d += 1;
      return d.toString();
    };
    return toDigit(perm.slice(0, 3)) + toDigit(perm.slice(3, 6)) + toDigit(perm.slice(6, 9));
  }

  // Deep clone
  public clone(): VirtualFileSystem {
    return new VirtualFileSystem(this.root);
  }
}
