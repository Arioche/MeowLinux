import { DailyQuest } from '../types';

export const DEFAULT_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'daily-01',
    title: 'Diagnostic Whisker Run',
    description: 'Execute at least 5 terminal commands to inspect system state',
    type: 'run_commands',
    target: 5,
    progress: 0,
    xpReward: 30,
    completed: false,
    claimed: false,
  },
  {
    id: 'daily-02',
    title: 'Log Prowler',
    description: 'Examine logs in /var/log or use grep to filter output',
    type: 'inspect_logs',
    target: 1,
    progress: 0,
    xpReward: 45,
    completed: false,
    claimed: false,
  },
  {
    id: 'daily-03',
    title: 'LPIC Mission Mastery',
    description: 'Successfully verify any LPIC certification challenge',
    type: 'complete_mission',
    target: 1,
    progress: 0,
    xpReward: 60,
    completed: false,
    claimed: false,
  },
];
