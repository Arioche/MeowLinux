export type LPICLevelId = 'essentials' | 'lpic1-101' | 'lpic1-102' | 'lpic2' | 'lpic3';

export interface VFSFile {
  type: 'file';
  name: string;
  content: string;
  permissions: string; // e.g., "rw-r--r--"
  owner: string;       // e.g., "meow"
  group: string;       // e.g., "meow"
  size?: number;
  modified?: string;
}

export interface VFSDirectory {
  type: 'dir';
  name: string;
  permissions: string; // e.g., "rwxr-xr-x"
  owner: string;
  group: string;
  children: Record<string, VFSNode>;
}

export type VFSNode = VFSFile | VFSDirectory;

export interface TerminalEntry {
  id: string;
  cmd?: string;
  output: string;
  type?: 'command' | 'output' | 'error' | 'success' | 'system' | 'ascii';
  timestamp?: number;
}

export interface VerificationCondition {
  type: 'cwd' | 'file_exists' | 'file_contains' | 'file_permissions' | 'file_missing' | 'command_output' | 'custom_check';
  path?: string;
  contentMatch?: string | RegExp;
  permissionsMatch?: string; // e.g., "755", "600"
  description: string;
}

export interface Challenge {
  id: string;
  lpicLevel: LPICLevelId;
  lpicCode: string; // e.g., "Topic 101.1", "Linux Essentials 1.2"
  title: string;
  catCodename: string; // e.g. "Operation Whisker Watch"
  difficulty: 'Kitten' | 'Intermediate' | 'Advanced' | 'Master';
  xp: number;
  scenario: string;
  objective: string;
  tasks: string[];
  initialCwd: string;
  initialFilesystem: Record<string, any>;
  verifications: VerificationCondition[];
  hints: string[];
  lpicExamNotes: string;
  suggestedCommands: string[];
  isCustom?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  lpicLevel?: LPICLevelId;
  description: string;
  iconName: string;
  color: string;
  category: 'certification' | 'special' | 'skill' | 'streak' | 'boss';
  requirementText: string;
  requiredChallengesCount?: number;
  specialConditionId?: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  type: 'run_commands' | 'complete_mission' | 'inspect_logs' | 'pipe_command' | 'chmod_audit';
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
}

export interface SkillNode {
  id: string;
  branch: 'storage' | 'processes' | 'networking' | 'scripting' | 'security';
  title: string;
  description: string;
  lpicTopic: string;
  requiredXp: number;
  prereqs: string[];
  icon: string;
  linkedChallengeId?: string;
}

export interface ExamQuestion {
  id: string;
  domain: string;
  type: 'multiple_choice' | 'multi_select' | 'fill_blank';
  question: string;
  codeSnippet?: string;
  options?: { id: string; text: string }[];
  correctAnswers: string[]; // option IDs or accepted exact string inputs
  explanation: string;
  lpicObjective: string;
}

export interface ExamResult {
  id: string;
  examId: 'essentials' | 'lpic1-101' | 'lpic1-102';
  examTitle: string;
  score: number; // 200 - 800 scale
  passed: boolean;
  date: string;
  totalQuestions: number;
  correctCount: number;
  domainBreakdown: { domain: string; correct: number; total: number; percentage: number }[];
}

export interface BossStage {
  id: number;
  title: string;
  alert: string;
  task: string;
  hint: string;
  targetCommandCheck: (cmd: string, vfs: any) => boolean;
  resolved: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  title: string;
  level: number;
  xp: number;
  streak: number;
  examScore: number;
  country: string;
  isUser?: boolean;
}

export interface ContainerPreset {
  id: string;
  name: string;
  distro: string;
  tag: string;
  kernel: string;
  pkgManager: string;
  shell: string;
  desc: string;
  icon: string;
}

export interface UserProgress {
  xp: number;
  completedChallenges: string[]; // challenge IDs
  earnedBadges: string[];        // badge IDs
  streak: number;
  longestStreak: number;
  freezeTokens: number;
  lastActiveDate: string;
  streakHistory: string[]; // date strings
  unlockedLevels: LPICLevelId[];
  soundEnabled: boolean;
  userName: string;
  callsign: string;
  userBio: string;
  avatarId: string;
  preferredShell: string;
  favoriteBadgeId: string;
  totalCommandsRun: number;
  completedBossBattles: string[];
  examHistory: ExamResult[];
  unlockedSkills: string[];
  activeContainerId: string;
  customChallenges: Challenge[];
  dailyQuests: DailyQuest[];
  lastDailyResetDate: string;
}
