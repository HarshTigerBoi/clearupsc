export type BadgeId =
  | "first_step"
  | "week_warrior"
  | "month_champion"
  | "century"
  | "mcq_master"
  | "perfect_score"
  | "mock_hero"
  | "essay_writer"
  | "night_owl"
  | "early_bird"
  | "polity_pro"
  | "history_buff"
  | "economy_expert"
  | "mistake_crusher"
  | "topper_track";

export interface Badge {
  id: BadgeId;
  title: string;
  description: string;
  icon: string;
  accent: "orange" | "green" | "blue" | "red" | "purple";
}

export interface BadgeMetrics {
  completedTopics: number;
  currentStreak: number;
  totalXp: number;
  mcqAttempts: number;
  perfectProveIts: number;
  mockAttempts: number;
  answerSubmissions: number;
  nightStudyCount: number;
  earlyStudyCount: number;
  polityCompleted: number;
  polityTotal: number;
  historyCompleted: number;
  historyTotal: number;
  economyCompleted: number;
  economyTotal: number;
  resolvedMistakes: number;
}

export const BADGES: Badge[] = [
  { id: "first_step", title: "First Step", description: "Complete your first topic.", icon: "01", accent: "orange" },
  { id: "week_warrior", title: "Week Warrior", description: "Keep a 7 day study streak.", icon: "7D", accent: "green" },
  { id: "month_champion", title: "Month Champion", description: "Keep a 30 day study streak.", icon: "30", accent: "green" },
  { id: "century", title: "Century", description: "Complete 100 topics.", icon: "100", accent: "orange" },
  { id: "mcq_master", title: "MCQ Master", description: "Attempt 500 MCQs.", icon: "MCQ", accent: "blue" },
  { id: "perfect_score", title: "Perfect Score", description: "Score 5/5 on Prove It 10 times.", icon: "5/5", accent: "green" },
  { id: "mock_hero", title: "Mock Hero", description: "Complete your first full mock test.", icon: "M", accent: "purple" },
  { id: "essay_writer", title: "Essay Writer", description: "Submit your first essay or Mains answer.", icon: "EW", accent: "blue" },
  { id: "night_owl", title: "Night Owl", description: "Study after 10pm five times.", icon: "PM", accent: "purple" },
  { id: "early_bird", title: "Early Bird", description: "Study before 7am five times.", icon: "AM", accent: "orange" },
  { id: "polity_pro", title: "Polity Pro", description: "Complete every GS2 Polity topic.", icon: "GS2", accent: "blue" },
  { id: "history_buff", title: "History Buff", description: "Complete every GS1 History topic.", icon: "H", accent: "orange" },
  { id: "economy_expert", title: "Economy Expert", description: "Complete every GS3 Economy topic.", icon: "ECO", accent: "green" },
  { id: "mistake_crusher", title: "Mistake Crusher", description: "Resolve 50 mistakes from the journal.", icon: "50", accent: "red" },
  { id: "topper_track", title: "Topper Track", description: "Reach 10,000 XP.", icon: "TT", accent: "purple" },
];

export const BADGE_BY_ID = new Map(BADGES.map((badge) => [badge.id, badge]));

export function getEligibleBadges(metrics: BadgeMetrics): Badge[] {
  return BADGES.filter((badge) => {
    switch (badge.id) {
      case "first_step":
        return metrics.completedTopics >= 1;
      case "week_warrior":
        return metrics.currentStreak >= 7;
      case "month_champion":
        return metrics.currentStreak >= 30;
      case "century":
        return metrics.completedTopics >= 100;
      case "mcq_master":
        return metrics.mcqAttempts >= 500;
      case "perfect_score":
        return metrics.perfectProveIts >= 10;
      case "mock_hero":
        return metrics.mockAttempts >= 1;
      case "essay_writer":
        return metrics.answerSubmissions >= 1;
      case "night_owl":
        return metrics.nightStudyCount >= 5;
      case "early_bird":
        return metrics.earlyStudyCount >= 5;
      case "polity_pro":
        return metrics.polityTotal > 0 && metrics.polityCompleted >= metrics.polityTotal;
      case "history_buff":
        return metrics.historyTotal > 0 && metrics.historyCompleted >= metrics.historyTotal;
      case "economy_expert":
        return metrics.economyTotal > 0 && metrics.economyCompleted >= metrics.economyTotal;
      case "mistake_crusher":
        return metrics.resolvedMistakes >= 50;
      case "topper_track":
        return metrics.totalXp >= 10000;
      default:
        return false;
    }
  });
}

export function emptyBadgeMetrics(totalXp = 0): BadgeMetrics {
  return {
    completedTopics: 0,
    currentStreak: 0,
    totalXp,
    mcqAttempts: 0,
    perfectProveIts: 0,
    mockAttempts: 0,
    answerSubmissions: 0,
    nightStudyCount: 0,
    earlyStudyCount: 0,
    polityCompleted: 0,
    polityTotal: 0,
    historyCompleted: 0,
    historyTotal: 0,
    economyCompleted: 0,
    economyTotal: 0,
    resolvedMistakes: 0,
  };
}
