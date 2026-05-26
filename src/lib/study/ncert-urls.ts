export const NCERT_URL_MAP = {
  "Class 6 History: Our Pasts I": "https://ncert.nic.in/textbook.php?fess1=0,11",
  "Class 7 History: Our Pasts II": "https://ncert.nic.in/textbook.php?gess2=0,10",
  "Class 8 History: Our Pasts III": "https://ncert.nic.in/textbook.php?hess3=0,12",
  "Class 9 History: India and Contemporary World I": "https://ncert.nic.in/textbook.php?iess2=0,5",
  "Class 10 History: India and Contemporary World II": "https://ncert.nic.in/textbook.php?jess2=0,5",
  "Class 11 History: Themes in World History": "https://ncert.nic.in/textbook.php?lhis1=0,15",
  "Class 12 History: Themes in Indian History I": "https://ncert.nic.in/textbook.php?mhis1=0,15",
  "Class 12 History: Themes in Indian History II": "https://ncert.nic.in/textbook.php?mhis2=0,15",
  "Class 12 History: Themes in Indian History III": "https://ncert.nic.in/textbook.php?mhis3=0,15",
  "Class 6 Geography: The Earth Our Habitat": "https://ncert.nic.in/textbook.php?fess2=0,8",
  "Class 7 Geography: Our Environment": "https://ncert.nic.in/textbook.php?gess3=0,10",
  "Class 8 Geography: Resources and Development": "https://ncert.nic.in/textbook.php?hess4=0,6",
  "Class 9 Geography: Contemporary India I": "https://ncert.nic.in/textbook.php?iess3=0,6",
  "Class 10 Geography: Contemporary India II": "https://ncert.nic.in/textbook.php?jess3=0,7",
  "Class 11 Geography: Fundamentals of Physical Geography": "https://ncert.nic.in/textbook.php?legy1=0,8",
  "Class 11 Geography: India Physical Environment": "https://ncert.nic.in/textbook.php?legy2=0,8",
  "Class 12 Geography: Fundamentals of Human Geography": "https://ncert.nic.in/textbook.php?megy1=0,10",
  "Class 12 Geography: India People and Economy": "https://ncert.nic.in/textbook.php?megy2=0,12",
  "Class 6 Political Science: Social and Political Life I": "https://ncert.nic.in/textbook.php?fess3=0,9",
  "Class 7 Political Science: Social and Political Life II": "https://ncert.nic.in/textbook.php?gess4=0,9",
  "Class 8 Political Science: Social and Political Life III": "https://ncert.nic.in/textbook.php?hess5=0,10",
  "Class 9 Political Science: Democratic Politics I": "https://ncert.nic.in/textbook.php?iess4=0,5",
  "Class 10 Political Science: Democratic Politics II": "https://ncert.nic.in/textbook.php?jess4=0,8",
  "Class 11 Political Science: Indian Constitution at Work": "https://ncert.nic.in/textbook.php?leps1=0,10",
  "Class 11 Political Science: Political Theory": "https://ncert.nic.in/textbook.php?leps2=0,10",
  "Class 12 Political Science: Contemporary World Politics": "https://ncert.nic.in/textbook.php?meps1=0,9",
  "Class 12 Political Science: Politics in India Since Independence": "https://ncert.nic.in/textbook.php?meps2=0,9",
  "Class 9 Economics: Economics": "https://ncert.nic.in/textbook.php?iess1=0,5",
  "Class 10 Economics: Understanding Economic Development": "https://ncert.nic.in/textbook.php?jess1=0,5",
  "Class 11 Economics: Indian Economic Development": "https://ncert.nic.in/textbook.php?leco1=0,10",
  "Class 11 Economics: Statistics for Economics": "https://ncert.nic.in/textbook.php?kest1=0,9",
  "Class 12 Economics: Introductory Microeconomics": "https://ncert.nic.in/textbook.php?leec1=0,6",
  "Class 12 Economics: Introductory Macroeconomics": "https://ncert.nic.in/textbook.php?leec2=0,6",
  "Class 11 Sociology: Introducing Sociology": "https://ncert.nic.in/textbook.php?lesy1=0,5",
  "Class 11 Sociology: Understanding Society": "https://ncert.nic.in/textbook.php?lesy2=0,5",
  "Class 12 Sociology: Indian Society": "https://ncert.nic.in/textbook.php?lesy3=0,7",
  "Class 12 Sociology: Social Change and Development in India": "https://ncert.nic.in/textbook.php?lesy4=0,8",
  "Class 9 Science: Science": "https://ncert.nic.in/textbook.php?iesc1=0,15",
  "Class 10 Science: Science": "https://ncert.nic.in/textbook.php?jesc1=0,16",
  "Class 11 Biology: Biology": "https://ncert.nic.in/textbook.php?kebo1=0,22",
  "Class 12 Biology: Biology": "https://ncert.nic.in/textbook.php?lebo1=0,16",
  "Class 11 Chemistry: Chemistry Part I": "https://ncert.nic.in/textbook.php?kech1=0,9",
  "Class 11 Chemistry: Chemistry Part II": "https://ncert.nic.in/textbook.php?kech2=0,5",
  "Class 12 Chemistry: Chemistry Part I": "https://ncert.nic.in/textbook.php?lech1=0,9",
  "Class 12 Chemistry: Chemistry Part II": "https://ncert.nic.in/textbook.php?lech2=0,7",
  "Class 11 Physics: Physics Part I": "https://ncert.nic.in/textbook.php?keph1=0,8",
  "Class 11 Physics: Physics Part II": "https://ncert.nic.in/textbook.php?keph2=0,7",
  "Class 12 Physics: Physics Part I": "https://ncert.nic.in/textbook.php?leph1=0,8",
  "Class 12 Physics: Physics Part II": "https://ncert.nic.in/textbook.php?leph2=0,6",
  "Class 11 Art: An Introduction to Indian Art Part I": "https://ncert.nic.in/textbook.php?kefa1=0,8",
  "Class 12 Art: An Introduction to Indian Art Part II": "https://ncert.nic.in/textbook.php?lefa1=0,8",
} as const;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

const URL_ENTRIES = Object.entries(NCERT_URL_MAP).map(([label, url]) => ({
  label,
  url,
  normalized: normalize(label),
}));

export function findNcertUrlForText(value: string) {
  const normalized = normalize(value);
  if (!normalized) return null;
  const direct = URL_ENTRIES.find((entry) => normalized.includes(entry.normalized) || entry.normalized.includes(normalized));
  if (direct) return direct.url;

  const scored = URL_ENTRIES.map((entry) => {
    const score = entry.normalized.split(" ").filter((word) => word.length > 3 && normalized.includes(word)).length;
    return { ...entry, score };
  })
    .filter((entry) => entry.score >= 3)
    .sort((a, b) => b.score - a.score)[0];

  return scored?.url ?? null;
}
