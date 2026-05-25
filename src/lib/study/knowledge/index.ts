import { GS1_HISTORY_KNOWLEDGE } from "./gs1-history";
import { GS2_POLITY_GOV_KNOWLEDGE } from "./gs2-polity-gov";
import { GS3_ECONOMY_KNOWLEDGE } from "./gs3-economy";

export const COURSE_KNOWLEDGE = [
  ...GS1_HISTORY_KNOWLEDGE,
  ...GS2_POLITY_GOV_KNOWLEDGE,
  ...GS3_ECONOMY_KNOWLEDGE,
];

export const COURSE_KNOWLEDGE_BY_KEY = new Map(COURSE_KNOWLEDGE.map((topic) => [topic.key, topic]));
