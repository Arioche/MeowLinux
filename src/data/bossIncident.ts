export interface IncidentStage {
  id: number;
  name: string;
  symptom: string;
  task: string;
  hint: string;
  expectedKeywords: string[];
}

export const BOSS_INCIDENT = {
  id: 'boss-midnight-meltdown',
  title: 'Operation Midnight Meltdown',
  subtitle: 'High Severity 1 Production Incident: Catnip Database Outage',
  timeLimitSeconds: 300, // 5 minutes
  description: 'An emergency alert sounded at 02:45 UTC! The primary catnip distribution cluster is failing health checks. Multiple cascading anomalies have been detected across CPU, disk space, file permissions, and system services. Stabilize the host before the kittens riot!',
  stages: [
    {
      id: 1,
      name: 'Stage 1: Rogue Mining Process Out of Control',
      symptom: 'CPU is throttling at 100%! A runaway process named `cryptocat-miner` (PID 9942) is hogging all compute cycles.',
      task: 'Locate and terminate the rogue process using `kill -9 9942` or `killall cryptocat-miner`.',
      hint: 'Inspect with `ps aux` and then dispatch SIGKILL: `kill -9 9942`',
      expectedKeywords: ['kill -9 9942', 'killall cryptocat-miner', 'kill 9942'],
    },
    {
      id: 2,
      name: 'Stage 2: Disk Exhaustion in /var/log',
      symptom: 'Disk usage on / partition has hit 100%! An unchecked runaway log file `/var/log/catnip.log` has consumed all remaining inodes and storage.',
      task: 'Clear or remove the bloated log file using `rm /var/log/catnip.log` or `truncate -s 0 /var/log/catnip.log`.',
      hint: 'Check with `df -h` or remove the file with `rm /var/log/catnip.log` or empty it with `echo "" > /var/log/catnip.log`.',
      expectedKeywords: ['/var/log/catnip.log'],
    },
    {
      id: 3,
      name: 'Stage 3: Breached Security Permissions',
      symptom: 'A malicious intrusion script altered `/etc/shadow` to world-writable permissions (777)! System authentication is severely compromised.',
      task: 'Restore secure root-only access to `/etc/shadow` using `chmod 600 /etc/shadow` or `chmod 640 /etc/shadow`.',
      hint: 'Verify with `ls -l /etc/shadow` and remediate with `chmod 600 /etc/shadow` (or `sudo chmod 600 /etc/shadow`).',
      expectedKeywords: ['chmod 600 /etc/shadow', 'chmod 640 /etc/shadow'],
    },
    {
      id: 4,
      name: 'Stage 4: Dead Nginx Gateway Restart',
      symptom: 'The public reverse proxy gateway `nginx` service has crashed due to the earlier resource starvation and is currently inactive.',
      task: 'Start the web service back up using `systemctl start nginx` or `sudo systemctl start nginx`.',
      hint: 'Run `systemctl start nginx` and verify with `systemctl status nginx`.',
      expectedKeywords: ['systemctl start nginx', 'systemctl restart nginx'],
    },
  ],
};
