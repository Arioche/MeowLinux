import { Badge } from '../types';

export const BADGES: Badge[] = [
  // Certification Badges
  {
    id: 'badge-essentials',
    title: 'Linux Essentials Collar',
    lpicLevel: 'essentials',
    description: 'Awarded for mastering fundamental Linux navigation, FHS filesystem hierarchy, and core command-line tools.',
    iconName: 'Sparkles',
    color: '#f59e0b', // amber
    category: 'certification',
    requirementText: 'Complete all Linux Essentials missions',
    requiredChallengesCount: 4,
  },
  {
    id: 'badge-lpic1-101',
    title: 'LPIC-1: Hardware Whiskers',
    lpicLevel: 'lpic1-101',
    description: 'Certified in Linux system architecture, hardware discovery, package managers, and process management.',
    iconName: 'Cpu',
    color: '#10b981', // emerald
    category: 'certification',
    requirementText: 'Complete all LPIC-1 101 missions',
    requiredChallengesCount: 3,
  },
  {
    id: 'badge-lpic1-102',
    title: 'LPIC-1: Certified Catdministrator',
    lpicLevel: 'lpic1-102',
    description: 'Certified in GNU & Unix commands, pipes, permissions, archives, and system configuration.',
    iconName: 'ShieldCheck',
    color: '#3b82f6', // blue
    category: 'certification',
    requirementText: 'Complete all LPIC-1 102 missions',
    requiredChallengesCount: 3,
  },
  {
    id: 'badge-lpic2',
    title: 'LPIC-2: Senior Whisker Engineer',
    lpicLevel: 'lpic2',
    description: 'Certified in enterprise kernel parameters, systemd daemons, and service maintenance.',
    iconName: 'Zap',
    color: '#8b5cf6', // purple
    category: 'certification',
    requirementText: 'Complete all LPIC-2 missions',
    requiredChallengesCount: 2,
  },
  {
    id: 'badge-lpic3',
    title: 'LPIC-3: Root Guardian Panther',
    lpicLevel: 'lpic3',
    description: 'The highest feline honor: enterprise security hardening, SSH lockdown, and bastion firewalling.',
    iconName: 'Flame',
    color: '#f43f5e', // rose
    category: 'certification',
    requirementText: 'Complete all LPIC-3 missions',
    requiredChallengesCount: 2,
  },

  // Skill & Special Achievement Badges
  {
    id: 'badge-first-step',
    title: 'First Paws',
    description: 'Embarked upon the journey to Linux certification by finishing your first terminal challenge.',
    iconName: 'Footprints',
    color: '#06b6d4', // cyan
    category: 'skill',
    requirementText: 'Complete any 1 mission',
    specialConditionId: 'first_challenge',
  },
  {
    id: 'badge-boss-meltdown',
    title: 'Meltdown Hero',
    description: 'Rescued the cluster from total downtime during Operation Midnight Meltdown crisis!',
    iconName: 'AlertTriangle',
    color: '#ef4444', // red
    category: 'boss',
    requirementText: 'Complete Boss Incident Challenge',
    specialConditionId: 'boss_meltdown',
  },
  {
    id: 'badge-exam-pro',
    title: 'LPIC Certified Prodigy',
    description: 'Achieved a passing score (>= 500 / 800) on an official LPIC Certification practice exam.',
    iconName: 'Award',
    color: '#10b981', // emerald
    category: 'certification',
    requirementText: 'Score 500+ on any LPIC Exam Simulation',
    specialConditionId: 'exam_passed',
  },
  {
    id: 'badge-streak-7',
    title: '7-Day Purr Streak',
    description: 'Maintained 7 consecutive days of daily sysadmin training and terminal drills.',
    iconName: 'Flame',
    color: '#f97316', // orange
    category: 'streak',
    requirementText: 'Achieve a 7-day login streak',
    specialConditionId: 'streak_7',
  },
  {
    id: 'badge-cat-lover',
    title: 'True Meow-nix Purrist',
    description: 'Executed feline commands (`meow`, `purr`, or `cat`) in the terminal.',
    iconName: 'Heart',
    color: '#ec4899', // pink
    category: 'special',
    requirementText: 'Run feline easter eggs in the terminal',
    specialConditionId: 'meow_command',
  },
  {
    id: 'badge-pipe-master',
    title: 'Pipeline Sorcerer',
    description: 'Chained output streams seamlessly using Unix pipe operators (`|`).',
    iconName: 'Workflow',
    color: '#6366f1', // indigo
    category: 'skill',
    requirementText: 'Use pipe operator in terminal commands',
    specialConditionId: 'pipe_used',
  },
  {
    id: 'badge-sudo-claw',
    title: 'Root Claws',
    description: 'Exercised superuser administrative authority with `sudo`.',
    iconName: 'KeyRound',
    color: '#eab308', // yellow
    category: 'special',
    requirementText: 'Execute a command using sudo',
    specialConditionId: 'sudo_used',
  },
];
