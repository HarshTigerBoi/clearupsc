import type { DafEntry, InterviewQuestion } from "@/types";

export async function generateInterviewQuestions(daf: DafEntry): Promise<InterviewQuestion[]> {
  if (process.env.ANTHROPIC_API_KEY) {
    // Adapter seam for Claude DAF-based generation.
  }

  const state = daf.stateOfDomicile || "your state";
  const hometown = daf.hometown || state;
  const optional = daf.optionalSubject || "your optional subject";
  const hobby = daf.hobbies[0] || "your hobby";
  const service = daf.servicePreference[0] || "your preferred service";

  return [
    { id: "iq-1", question: `Tell us about yourself in a way that is not already written in your DAF.`, category: "Introductory", whyAsked: "Tests self-awareness and communication." },
    { id: "iq-2", question: `Why do you want to join the civil services now?`, category: "Motivation", whyAsked: "Tests service motivation and clarity." },
    { id: "iq-3", question: `What is ${hometown} known for, and what is one governance issue there?`, category: "Hometown", whyAsked: "Tests local awareness." },
    { id: "iq-4", question: `What is one major development challenge in ${state}?`, category: "State", whyAsked: "Tests state-specific understanding." },
    { id: "iq-5", question: `How has ${daf.graduationSubject || "your education"} prepared you for administration?`, category: "Education", whyAsked: "Links academic background to governance." },
    { id: "iq-6", question: `Why did you choose ${daf.graduationSubject || "your degree"} if you want ${service}?`, category: "Education", whyAsked: "Tests career coherence." },
    { id: "iq-7", question: `What did you learn from ${daf.workExperience || "your work experience"} that is useful in public service?`, category: "Work experience", whyAsked: "Connects professional exposure to administration." },
    { id: "iq-8", question: `How can ${hobby} improve your personality as an administrator?`, category: "Hobby", whyAsked: "Checks authenticity of DAF hobbies." },
    { id: "iq-9", question: `Tell us one technical detail about ${hobby} that a casual person would not know.`, category: "Hobby depth", whyAsked: "Tests whether the hobby is genuine." },
    { id: "iq-10", question: `Which concept from ${optional} is most useful for public policy?`, category: "Optional", whyAsked: "Connects optional knowledge to administration." },
    { id: "iq-11", question: `How is ${optional} relevant to governance in India?`, category: "Optional", whyAsked: "Tests applied optional understanding." },
    { id: "iq-12", question: "Should civil servants be politically neutral or socially opinionated?", category: "Philosophical", whyAsked: "Tests balance and constitutional values." },
    { id: "iq-13", question: "How would you handle public criticism of your district administration on social media?", category: "Administrative scenario", whyAsked: "Tests composure and communication." },
    { id: "iq-14", question: "What does integrity mean when rules and public welfare seem to conflict?", category: "Ethics", whyAsked: "Checks decision-making maturity." },
    { id: "iq-15", question: "Name one current national issue that may affect your preferred service.", category: "Current affairs", whyAsked: "Tests service preference awareness." },
    { id: "iq-16", question: "How would you improve last-mile delivery of welfare schemes?", category: "Administration", whyAsked: "Tests implementation lens." },
    { id: "iq-17", question: "Tell us about one failure and what it taught you.", category: "Personality", whyAsked: "Checks humility and learning ability." },
    { id: "iq-18", question: `How would your family background influence your approach to public service?`, category: "Personal background", whyAsked: "Tests groundedness." },
    { id: "iq-19", question: `What did you learn from places you have visited, such as ${daf.visitedPlaces || "different parts of India"}?`, category: "Exposure", whyAsked: "Tests observation and cultural sensitivity." },
    { id: "iq-20", question: "If selected, what habit would you deliberately build in your first year?", category: "Self-awareness", whyAsked: "Tests growth mindset." },
  ].slice(0, 20);
}
