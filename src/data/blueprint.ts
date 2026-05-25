import {
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  FilePenLine,
  Flame,
  GraduationCap,
  Landmark,
  MessageSquareText,
  Newspaper,
  Repeat,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

export const blueprintProblems = [
  {
    title: "No feedback on Mains answers",
    current: "Human evaluators cost ₹5,000+/month and often take 3-7 days.",
    solution: "Rubric-based AI evaluation in seconds with content, structure, clarity, depth and presentation scores.",
  },
  {
    title: "Forgetting what you studied",
    current: "Static notes make a two-year syllabus leak out of memory.",
    solution: "A spaced repetition queue turns weak topics into scheduled revision cards.",
  },
  {
    title: "Planning paralysis",
    current: "Aspirants waste time deciding what to study every day.",
    solution: "An adaptive planner converts syllabus progress into a daily task list.",
  },
  {
    title: "Optional confusion",
    current: "Coaching centres push what they sell, not what fits the student.",
    solution: "A six-question selector ranks optional subjects by fit, overlap and effort.",
  },
  {
    title: "Interview uncertainty",
    current: "Mock panels are costly and not always personalised to your DAF.",
    solution: "DAF-based AI interview drills generate questions from your background, hobbies and service preference.",
  },
];

export const productModules = [
  {
    icon: CalendarCheck,
    title: "Adaptive Daily Planner",
    href: "/planner",
    label: "Plan",
    detail: "Daily task cards recalculated from exam date, hours available, weak subjects and unfinished work.",
  },
  {
    icon: FilePenLine,
    title: "AI Answer Evaluation",
    href: "/answer-writing/practice",
    label: "Evaluate",
    detail: "Mains answer editor with timer, word count and a five-dimension UPSC rubric score card.",
  },
  {
    icon: Repeat,
    title: "Spaced Revision Cards",
    href: "/flashcards",
    label: "Revise",
    detail: "SM-2 style recall ratings so facts return before you forget them.",
  },
  {
    icon: ClipboardCheck,
    title: "UPSC-pattern Practice",
    href: "/practice",
    label: "Practice",
    detail: "10-question sprints with source labels, instant explanations and subject-wise score breakdown.",
  },
  {
    icon: Newspaper,
    title: "Current Affairs Engine",
    href: "/current-affairs",
    label: "Read",
    detail: "Daily digest format: summary, UPSC angle, prelims hook and mains answer linkage.",
  },
  {
    icon: MessageSquareText,
    title: "DAF Mock Interview",
    href: "/interview",
    label: "Speak",
    detail: "Personalised interview question sets based on graduation, state, hobbies and service preference.",
  },
];

export const dashboardStats = [
  { label: "Syllabus completion", value: "37%", helper: "+8 topics this week", icon: BookOpenCheck },
  { label: "Study streak", value: "14 days", helper: "1 freeze available", icon: Flame },
  { label: "Mock score trend", value: "92 → 108", helper: "Prelims target: 120+", icon: Trophy },
  { label: "Cards due today", value: "24", helper: "12 high-priority", icon: Brain },
];

export const todayPlan = [
  { time: "07:00", task: "Revise Modern History: Gandhi era", type: "Revise", minutes: 45 },
  { time: "08:00", task: "GS3 Economy: Inflation and monetary policy", type: "Read", minutes: 60 },
  { time: "10:00", task: "Prelims practice sprint: Economy mixed", type: "Practice", minutes: 35 },
  { time: "18:30", task: "Mains answer: federalism and local bodies", type: "Answer", minutes: 25 },
  { time: "21:00", task: "Current affairs recall and 20 flashcards", type: "Recall", minutes: 30 },
];

export const currentAffairs = [
  {
    date: "Today",
    title: "Heat action plans and urban governance",
    tags: ["GS2", "GS3", "Disaster Management"],
    summary: "Indian cities are increasingly using heat action plans to coordinate health alerts, water supply, labour safety and public awareness during heat waves.",
    upscAngle: "Link to climate adaptation, urban local bodies, public health capacity and vulnerable workers.",
  },
  {
    date: "Yesterday",
    title: "Semiconductor manufacturing incentives",
    tags: ["GS3", "Economy", "Science & Tech"],
    summary: "India's chip ecosystem depends on fabrication, design talent, reliable power, clean water, supply-chain depth and predictable policy incentives.",
    upscAngle: "Useful for industrial policy, strategic autonomy, electronics imports and employment questions.",
  },
  {
    date: "This week",
    title: "Wetland restoration and flood buffering",
    tags: ["Environment", "Biodiversity", "Geography"],
    summary: "Wetlands store excess rainwater, recharge groundwater, support biodiversity and reduce urban flood intensity when protected from encroachment.",
    upscAngle: "Connect Ramsar sites, ecosystem services, urban planning and climate resilience.",
  },
];

export const flashcards = [
  {
    question: "What is the basic structure doctrine?",
    answer: "Parliament may amend the Constitution, but cannot destroy its essential features such as rule of law, judicial review, secularism and federalism.",
    topic: "Polity",
  },
  {
    question: "Why does inflation hurt poor households more?",
    answer: "Poor households spend a larger share of income on essentials, so price rises reduce real purchasing power faster.",
    topic: "Economy",
  },
  {
    question: "What is an ecotone?",
    answer: "A transition zone between two ecosystems, often rich in species because organisms from both sides overlap.",
    topic: "Environment",
  },
];

export const answerRubric = [
  { label: "Content accuracy", score: 32, max: 40 },
  { label: "Structure", score: 20, max: 25 },
  { label: "Clarity", score: 16, max: 20 },
  { label: "Depth and analysis", score: 7, max: 10 },
  { label: "Presentation", score: 4, max: 5 },
];

export const pricingPlans = [
  {
    name: "Free",
    price: "₹0",
    description: "Start planning without paying.",
    features: ["Optional selector", "Syllabus tracker", "Limited pattern practice", "Basic dashboard"],
    icon: ShieldCheck,
  },
  {
    name: "Starter",
    price: "₹499/mo",
    description: "For serious Prelims practice.",
    features: ["Full practice bank", "Daily current affairs", "Sectional mock tests", "Progress analytics"],
    icon: CreditCard,
  },
  {
    name: "Pro",
    price: "₹1,499/mo",
    description: "The main rank-improvement engine.",
    features: ["AI answer evaluation", "Adaptive planner", "Spaced repetition", "Unlimited flashcards"],
    icon: GraduationCap,
    highlighted: true,
  },
  {
    name: "Premium",
    price: "₹2,999/mo",
    description: "For interview and final polish.",
    features: ["DAF mock interview", "Premium analytics", "Interview history", "Mentor-ready reports"],
    icon: Landmark,
  },
];

export const trustMetrics = [
  { label: "Core UPSC stages", value: "3", icon: BarChart3 },
  { label: "Preparation problems mapped", value: "5", icon: ShieldCheck },
  { label: "Daily habits tracked", value: "7", icon: CalendarCheck },
  { label: "Community-ready modules", value: "10", icon: Users },
];
