import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const explainers = [
  {
    topicKeys: ["gs2_polity_judiciary", "gs2_polity_supreme_court"],
    notes: judiciaryExplainer(),
  },
];

let updated = 0;
for (const item of explainers) {
  for (const key of item.topicKeys) {
    const { error } = await supabase.from("topics").update({ structured_notes: item.notes, content_quality: "publish_ready" }).eq("key", key);
    if (error) {
      const { error: fallbackError } = await supabase.from("topics").update({ structured_notes: item.notes }).eq("key", key);
      if (fallbackError) throw fallbackError;
    }
    updated += 1;
    console.log(`Updated 13-year-old NCERT explainer: ${key}`);
  }
}

console.log(JSON.stringify({ updated, format: "easy-explanation + analogies + concise-notes + short-notes" }, null, 2));

function judiciaryExplainer() {
  return `ClearUPSC 13-year-old NCERT Explainer
Topic: Judiciary
NCERT base: Class 11 Political Science, Indian Constitution at Work, Chapter 6: Judiciary
Method used: Original easy-language explanation based on the chapter's ideas. This is not a copy of the NCERT text. It turns the chapter into a clear learning path: understand -> remember -> revise -> write.

PART A - EASY CHAPTER EXPLANATION

0. The whole chapter in one simple story

Imagine India is a very large school.

The Constitution is the school rulebook.
The Parliament is like the student council that makes new rules.
The executive is like the principal and teachers who run the school every day.
The judiciary is like a fair referee plus a rulebook expert.

If two students fight, the referee solves the dispute.
If the principal acts unfairly, the referee checks the rulebook.
If the student council makes a rule that violates the school constitution, the referee can cancel it.
If a weak student cannot complain, another student can help bring the issue to the referee.

That is the core idea of the judiciary in India.

The judiciary is not just a place where private disputes are settled. It is also a constitutional institution that protects rule of law, rights, democracy, and the balance between Parliament, executive and citizens.

1. Why do we need courts at all?

Every society will have disputes. People fight over property, contracts, crime, rights, jobs, money, pollution, elections, government decisions and many other things.

If every person decides justice for himself, strong people will dominate weak people. That becomes jungle rule.

So society needs a neutral body that says: "We will not use muscle power, money power or political power. We will use law."

That neutral body is the judiciary.

Easy analogy:
In cricket, if every team decided for itself whether a player is out, the match would become chaos. So there is an umpire. Courts are the constitutional umpires of public life.

UPSC meaning:
Judiciary protects rule of law. Rule of law means everyone is under the same law: rich or poor, man or woman, powerful or weak, government or citizen.

2. What is rule of law?

Rule of law means law is above personal power.

It means:
- A minister cannot do whatever he wants.
- A police officer cannot punish anyone without legal authority.
- A rich person cannot escape law just because he has money.
- A poor person should also get protection from law.
- Government power must follow the Constitution.

Easy analogy:
In a game, even the captain must follow the rules. If the captain says, "I am powerful, so no rules for me," the game is no longer fair. Rule of law keeps the game fair.

Prelims trap:
Rule of law does not mean everyone becomes equal in income or status. It means everyone is subject to law and protected by law.

3. Why must the judiciary be independent?

If courts are controlled by politicians, then citizens cannot get justice against the government.

Suppose a citizen says: "The government has violated my right."
If the judge is afraid of the government, the judge may not give a fair decision.

So courts must be independent from:
- executive pressure
- legislative pressure
- party politics
- media pressure
- public anger
- rich and powerful people

But independence does not mean judges can do anything they want. Judges are also bound by the Constitution, legal traditions, precedents, reason and accountability.

Easy analogy:
A school exam checker should not be controlled by the student whose paper is being checked. But the checker must still follow the marking scheme. That is judicial independence with accountability.

4. What does independence of judiciary actually mean?

It has three main meanings:

First, other organs of government should not stop courts from doing justice.

Second, other organs should not interfere in court decisions.

Third, judges should decide without fear or favour.

"Without fear" means they should not fear punishment for honest decisions.
"Without favour" means they should not favour friends, political parties or powerful people.

UPSC line:
Independent judiciary is necessary for constitutionalism because it prevents arbitrary power and protects rights.

5. How does the Constitution protect judicial independence?

The chapter gives several protections.

Protection 1: Appointment is insulated from open party politics.
The legislature does not directly vote to appoint judges. The idea is to reduce party-political capture.

Protection 2: Judges have fixed tenure.
They usually hold office until retirement age. This gives security.

Protection 3: Removal is very difficult.
Judges can be removed only for proven misbehaviour or incapacity, and Parliament must approve it by special majority. This stops governments from removing judges just because they dislike a judgment.

Protection 4: Salaries and allowances are protected.
If judges depended on the legislature for salary approval every year, politicians could pressure them financially.

Protection 5: Conduct of judges is not freely discussed in Parliament.
This prevents daily political attack on judges, except during formal removal proceedings.

Protection 6: Contempt power.
Courts can punish serious acts that obstruct justice or lower the authority of courts. But this power must be used carefully because public accountability also matters.

Easy analogy:
Judges are like exam referees in a national competition. You protect their tenure, salary and independence so that they can give decisions fairly even when powerful teams are angry.

6. Independence does not mean no accountability

This is important.

Some students think: "If judiciary is independent, judges answer to nobody."
Wrong.

Judiciary is accountable to:
- the Constitution
- legal reasoning
- precedents
- public trust
- democratic values
- written judgments
- review and appeal
- removal procedure in extreme cases

So the correct UPSC answer is balanced:
Judicial independence is necessary, but it should not become judicial arbitrariness.

7. Appointment of judges: why is it controversial?

Who becomes a judge matters because judges interpret the Constitution.

Two judges may read the same law but understand it differently. Their legal philosophy affects judgments.

Some judges may believe in active judiciary.
Some may believe courts should be restrained.
Some may give more importance to rights.
Some may give more importance to state power.

So appointment is politically sensitive.

Easy analogy:
If a school chooses a strict referee, the match changes. If it chooses a lenient referee, the match changes. The rulebook is same, but interpretation matters.

8. Appointment of Chief Justice of India

There was a convention that the senior-most Supreme Court judge becomes Chief Justice of India.

But the convention was broken twice:
- A.N. Ray was appointed CJI in 1973, superseding three senior judges.
- M.H. Beg was appointed superseding H.R. Khanna.

Why this matters:
It shows that appointment can become politically controversial. Seniority convention helps reduce political manipulation.

UPSC angle:
Judicial appointment debates are about balancing independence, accountability, transparency and separation of powers.

9. Appointment of Supreme Court and High Court judges

The Constitution says judges are appointed by the President after consultation.

Earlier, the executive had more influence because the Council of Ministers advises the President.

But between 1982 and 1998, the Supreme Court changed the meaning of consultation through major cases. Eventually, the Court developed the collegium system.

Collegium means:
The Chief Justice of India and senior judges recommend names for appointment.

Simple meaning:
Judges got a greater role in choosing judges.

Why this happened:
To protect judicial independence from excessive executive control.

Criticism:
Collegium can be opaque. People ask: Where is transparency? Where is accountability?

Balanced answer:
Appointment needs both independence from politics and transparency in selection.

10. Removal of judges

A Supreme Court or High Court judge can be removed only for:
- proven misbehaviour
- incapacity

The procedure is very difficult. A motion must pass both Houses of Parliament by special majority.

Why difficult?
If removal were easy, the government could threaten judges.

Why still possible?
Because judges must not be above accountability.

Easy analogy:
You do not fire a referee just because one team is angry. But if the referee cheats, there must be a process to remove him.

11. V. Ramaswami case

Justice V. Ramaswami was accused of misuse of office and public funds. A parliamentary motion for removal failed because it did not get the required support.

Why UPSC cares:
This example shows that removal of judges is practically very difficult. It protects independence but can also make accountability hard.

12. Structure of Indian judiciary

India has a single integrated judicial system.

This means we do not have completely separate state and central court systems like some federations.

The structure is like a pyramid:

Top: Supreme Court of India
Middle: High Courts
Below: District Courts
Base: Subordinate Courts

Easy analogy:
Think of it like a school system:
Class teacher solves small issues.
Head of department handles bigger appeals.
Principal handles the most important school-level matters.
The education board gives final interpretation.

In India:
Subordinate courts handle ordinary civil and criminal cases.
District courts handle district-level serious matters and appeals.
High Courts supervise lower courts and protect rights.
Supreme Court sits at the top and its decisions bind all courts.

13. Supreme Court as a powerful but limited court

The Supreme Court is very powerful, but not unlimited.

It works within the Constitution.

This is important because India is not governed by judges. India is governed by the Constitution.

The Supreme Court has different kinds of jurisdiction.
Jurisdiction means "area of power."

Easy analogy:
In a hospital, a heart doctor, eye doctor and emergency doctor have different areas of responsibility. Jurisdiction tells us which court can handle which matter.

14. Original jurisdiction

Original jurisdiction means a case starts directly in the Supreme Court.

For example:
- dispute between Union and State
- dispute between two States

Why direct Supreme Court?
Because these are federal disputes. A lower court should not decide fights between governments.

Easy analogy:
If two class monitors fight, the class teacher can handle it. But if two school houses fight over school rules, it may go directly to the principal.

UPSC point:
Original jurisdiction makes Supreme Court an umpire of federalism.

15. Writ jurisdiction

If a fundamental right is violated, a person can go directly to Supreme Court under Article 32.

High Courts can issue writs under Article 226.

Writ means a special court order.

The five famous writs:

Habeas Corpus: produce the detained person before court.
Mandamus: command a public authority to do its duty.
Prohibition: stop a lower court/tribunal from exceeding power.
Certiorari: transfer/quash an order of a lower court/tribunal.
Quo Warranto: ask by what authority someone holds a public office.

Easy analogy:
Writs are emergency tools in the court's toolbox. When rights are in danger, the court does not wait politely; it can issue a direct command.

16. Appellate jurisdiction

Appeal means asking a higher court to recheck a lower court's decision.

The Supreme Court is the highest court of appeal.

Cases can come from High Courts in civil, criminal and constitutional matters.

Why appeals matter:
Lower courts can misunderstand law, evidence or constitutional meaning. Higher courts correct errors.

Easy analogy:
If a teacher marks your answer wrongly, you ask a senior teacher to recheck. That is appeal.

17. Advisory jurisdiction

The President can ask the Supreme Court for advice on questions of law or public importance.

But:
The Supreme Court is not bound to give advice.
The President is not bound to accept it.

Then why useful?
Because government can get legal clarity before acting, avoiding future disputes.

Easy analogy:
Before building a bridge, the government asks engineers if the design is safe. It is advice, but it can prevent disaster.

18. Special powers and binding nature

Supreme Court decisions bind all courts in India.

Article 144 says authorities must act in aid of the Supreme Court.

Article 137 allows Supreme Court to review its own judgments.

Why review itself?
Because courts can also make mistakes. Law develops. Facts and reasoning may need correction.

Balanced point:
Finality is important, but justice is more important. Review power balances both.

19. Judicial activism

Judicial activism means courts take an active role in protecting rights and correcting governance failures.

Earlier, courts usually waited for an affected person to file a case.
Later, courts started hearing matters even when someone else filed on behalf of poor or voiceless people.

This changed Indian democracy.

Easy analogy:
Earlier the hospital treated only patients who could walk to the counter. PIL allowed someone to bring the case of a patient who could not even reach the hospital.

20. Public Interest Litigation (PIL)

PIL means a case filed for public interest, often by someone who is not personally harmed but is raising an issue for others.

It became important around 1979.

Examples:
- undertrial prisoners kept in jail for long periods
- prison torture
- bonded labour
- environmental protection
- rights of poor and disadvantaged groups

Why PIL matters:
Poor people often cannot approach courts due to money, knowledge, fear or distance. PIL gives them indirect access.

21. Early PIL examples

Hussainara Khatoon case:
Concerned undertrial prisoners in Bihar who had spent long years in jail. It helped strengthen the idea of speedy justice and rights of prisoners.

Sunil Batra case:
A prisoner's letter about torture was treated as a petition. It helped expand access to justice.

UPSC value:
These cases show the judiciary's role in making rights real for people who are otherwise invisible.

22. PIL expanded the meaning of rights

Through PIL, courts expanded rights into areas like:
- clean air
- unpolluted water
- decent living conditions
- humane prison conditions
- protection from exploitation

This is linked to Article 21: right to life.

Easy analogy:
Right to life is not just "you are alive." It means life with dignity, basic conditions and protection from cruelty.

23. Good effects of judicial activism

Judicial activism:
- made courts more accessible
- helped poor and disadvantaged groups
- forced executive accountability
- expanded rights
- improved transparency in elections
- pushed action on environment and corruption

Example:
Courts asked candidates to disclose assets, income and education so voters can make informed choices.

24. Negative side of judicial activism

Too many PILs can overburden courts.

Sometimes courts may enter areas that belong to executive or legislature.

Examples:
pollution control, investigation, electoral reform, administrative decisions.

The problem:
If judiciary starts running administration, separation of powers becomes weak.

Balanced answer:
Judicial activism is useful when rights are violated and institutions fail. But courts must avoid becoming a super-executive or super-legislature.

25. Judiciary and rights

The Constitution gives courts two powerful rights-protection tools.

Tool 1: Writs
Article 32 lets Supreme Court restore fundamental rights.
Article 226 lets High Courts issue writs too.

Tool 2: Judicial review
Courts can declare a law unconstitutional if it violates the Constitution.

Easy analogy:
Writ is like an emergency rescue order.
Judicial review is like checking whether a new school rule violates the school constitution.

26. Judicial review

Judicial review means courts examine whether a law or executive action is constitutional.

If a law violates fundamental rights or federal distribution of powers, courts can strike it down.

The term "judicial review" is not directly written in the Constitution, but the power flows from the written Constitution, fundamental rights and court powers.

UPSC line:
Judicial review makes the judiciary the interpreter and guardian of the Constitution.

27. Judicial review in federal disputes

Suppose Parliament makes a law on a matter that belongs to the State List.
States can challenge it.
The Supreme Court can examine whether Parliament crossed its constitutional boundary.

So judicial review protects:
- rights
- federalism
- constitutional limits

28. Judiciary and Parliament

India follows limited separation of powers.

Parliament makes laws.
Executive implements laws.
Judiciary settles disputes and checks constitutionality.

But these organs often interact and sometimes clash.

Why clash happens:
Parliament wants policy power.
Judiciary wants constitutional limits respected.
Executive wants administrative flexibility.

29. Right to property conflict

Early after the Constitution, Parliament wanted land reforms.
This required limiting private property rights.

Courts initially protected fundamental rights strongly.
Parliament amended the Constitution.
The conflict became: Can Parliament amend fundamental rights?

This led to major constitutional cases.

30. Kesavananda Bharati case and Basic Structure

In 1973, Supreme Court gave the basic structure doctrine.

Meaning:
Parliament can amend the Constitution, but cannot destroy its basic structure.

Basic structure is not a closed list, but includes ideas like supremacy of Constitution, rule of law, judicial review, federalism, secularism, democracy and separation of powers.

Easy analogy:
You can renovate a house: paint walls, change furniture, repair rooms. But you cannot remove the foundation and still call it the same house.

Constitutional amendments are renovation.
Basic structure is the foundation.

31. Why basic structure matters

It prevents constitutional destruction through legal-looking amendments.

A government with majority cannot use amendment power to remove democracy, rights, judicial review or constitutional identity.

UPSC line:
Basic structure doctrine is a judicially evolved limitation on Parliament's amending power and a core tool of constitutionalism in India.

32. Continuing tension between courts and legislatures

Some issues remain sensitive:
- Can courts examine legislative privileges?
- Can courts interfere in internal functioning of legislatures?
- Can legislatures criticise judges?
- Can courts issue directions affecting legislative business?

Why delicate?
Because every organ must respect the others.

Easy analogy:
In a group project, one student writes, one presents, one checks errors. If the checker starts writing everything, conflict happens. But if the writer breaks the rules, the checker must speak.

33. Final meaning of the chapter

The Indian judiciary is powerful because it:
- protects rule of law
- protects fundamental rights
- interprets the Constitution
- resolves federal disputes
- checks unconstitutional laws
- expands access through PIL
- balances Parliament and executive

But its power must stay within constitutional limits.

Best UPSC conclusion:
Indian democracy depends on a delicate balance. Judiciary must be independent enough to protect the Constitution, but restrained enough to respect democratic institutions.

PART B - ANALOGY MAP

1. Constitution = rulebook of the game.
2. Parliament = rule-making team.
3. Executive = team that runs daily operations.
4. Judiciary = referee plus rulebook interpreter.
5. Rule of law = same rules for captain and new player.
6. Judicial independence = referee not hired or fired by one team.
7. Judicial accountability = referee still follows rulebook and review.
8. Writs = emergency tools to protect rights.
9. Appeal = rechecking a wrongly marked answer.
10. Judicial review = checking whether a new rule violates the main rulebook.
11. PIL = someone speaking for a person who cannot reach the court.
12. Basic structure = foundation of a house; renovate, but do not destroy.

PART C - CONCISE UPSC NOTES

Definition:
Judiciary is the organ of government that interprets law, settles disputes, protects rights, and checks whether state action follows the Constitution.

Need for judiciary:
- settles disputes
- protects rule of law
- safeguards rights
- prevents arbitrary power
- maintains constitutional supremacy
- keeps democracy from becoming majority dictatorship

Independence of judiciary:
Meaning:
- no interference from executive/legislature
- judges decide without fear or favour
- decisions based on Constitution and law

Safeguards:
- appointment process insulated from direct party vote
- fixed tenure
- difficult removal
- protected salary and allowances
- contempt power
- conduct of judges not discussed except during removal

Accountability:
- Constitution
- precedents
- reasoned judgments
- review/appeal
- removal for proven misbehaviour/incapacity

Appointment:
- President appoints judges after consultation.
- Collegium system evolved through Supreme Court decisions.
- CJI + senior judges have major role.
- Debate: independence vs transparency/accountability.

Removal:
- proven misbehaviour/incapacity
- special majority in both Houses
- example: V. Ramaswami case shows difficulty of removal

Structure:
- Supreme Court
- High Courts
- District Courts
- Subordinate Courts
- Single integrated judicial system

Supreme Court jurisdictions:
- Original: Union-State and State-State disputes
- Writ: protection of fundamental rights
- Appellate: appeals from lower courts
- Advisory: advice to President
- Special leave: discretionary appeal power
- Review: power to review own judgments

Judicial activism:
Active role by courts in rights protection and governance accountability.

PIL:
Public Interest Litigation allows public-spirited citizens/groups to move court for public causes or rights of disadvantaged people.

Benefits of PIL:
- access to justice
- helps poor/disadvantaged
- expands rights
- forces executive accountability
- protects environment and human dignity

Concerns:
- court overreach
- overburdened judiciary
- blurred separation of powers
- misuse as private interest litigation

Judicial review:
Power of courts to examine constitutionality of laws/executive actions.
Protects fundamental rights and federal distribution of powers.

Judiciary-Parliament conflict:
Major issues:
- property rights
- amendment power
- fundamental rights vs directive principles
- judicial review
- legislative privileges

Kesavananda Bharati:
Parliament can amend Constitution but cannot alter basic structure.

Balanced conclusion:
Judiciary is guardian of the Constitution, but it must function within constitutional limits and respect separation of powers.

PART D - SHORT NOTES FOR LAST-DAY REVISION

Judiciary = courts + constitutional guardian.

Main roles:
1. settle disputes
2. protect rule of law
3. protect rights
4. interpret Constitution
5. check unconstitutional laws
6. balance Union-State disputes

Independent judiciary means:
No fear, no favour, no political pressure.

Independence safeguards:
fixed tenure, difficult removal, protected salaries, no easy parliamentary criticism, contempt power.

But independence is not unlimited power. Courts are accountable to Constitution and reasoned judgments.

Supreme Court jurisdiction:
Original = federal disputes.
Writ = rights protection.
Appellate = appeal court.
Advisory = President asks legal advice.
Review = recheck own judgment.

PIL:
Public interest case filed for rights/public good, often for people who cannot approach court.

Judicial activism:
Court becomes active in rights/governance issues. Good for justice, risky if it becomes overreach.

Judicial review:
Court checks if law/action violates Constitution.

Basic structure:
Parliament can amend, but cannot destroy Constitution's foundation.

Best analogy:
Constitution = rulebook.
Judiciary = referee.
Judicial review = checking if a new rule breaks the main rulebook.
Basic structure = foundation of the house.

PART E - 150-WORD MAINS ANSWER TEMPLATE

The judiciary is a vital organ of Indian democracy because it protects rule of law, fundamental rights and constitutional supremacy. An independent judiciary ensures that disputes are settled according to law and that executive or legislative power does not become arbitrary.

Its independence is protected through fixed tenure, difficult removal procedure, protected salaries, limited parliamentary discussion on judges' conduct and contempt powers. The Supreme Court exercises original, writ, appellate, advisory and review jurisdictions. Through writs and judicial review, it protects rights and checks unconstitutional laws.

Judicial activism and PIL have expanded access to justice, especially for prisoners, workers, poor communities and environmental causes. However, excessive activism can blur separation of powers and create tension with Parliament and executive.

Thus, the judiciary must remain independent, rights-oriented and constitutionally restrained. Its legitimacy lies in balancing activism with institutional discipline.

PART F - QUESTIONS A STUDENT SHOULD NOW BE ABLE TO ANSWER

1. Why is judicial independence necessary?
2. How is judicial independence protected in India?
3. Is judiciary completely unaccountable? Explain.
4. What is original jurisdiction of Supreme Court?
5. Difference between writ jurisdiction and judicial review.
6. How did PIL expand access to justice?
7. Discuss benefits and risks of judicial activism.
8. Explain basic structure doctrine with examples.
9. Why do judiciary and Parliament sometimes clash?
10. Is the judiciary a guardian of the Constitution? Discuss.

PART G - EXAM DATA BANK: ARTICLES, CASES, TERMS, FACTS

Use this section when you need hard data for Prelims, Mains introductions, and answer enrichment.

1. Constitutional Articles: Supreme Court

Article 124: Establishment and constitution of the Supreme Court; appointment of Supreme Court judges.
Article 124(2): Judges appointed by the President after consultation.
Article 124(4): Removal of Supreme Court judge by special majority on proved misbehaviour or incapacity.
Article 125: Salaries and allowances of Supreme Court judges.
Article 129: Supreme Court is a court of record and has contempt power.
Article 131: Original jurisdiction of Supreme Court in Union-State and State-State disputes.
Article 132: Appellate jurisdiction in constitutional cases.
Article 133: Appellate jurisdiction in civil cases.
Article 134: Appellate jurisdiction in criminal cases.
Article 136: Special Leave Petition power; Supreme Court may grant special leave to appeal.
Article 137: Supreme Court can review its own judgments.
Article 141: Law declared by Supreme Court is binding on all courts in India.
Article 142: Supreme Court can pass orders necessary for complete justice.
Article 143: President can seek Supreme Court's advisory opinion.
Article 144: All civil and judicial authorities must act in aid of Supreme Court.

2. Constitutional Articles: High Courts and lower courts

Article 214: High Court for each State.
Article 215: High Court is a court of record and has contempt power.
Article 216: Constitution of High Courts.
Article 217: Appointment and conditions of office of High Court judges.
Article 221: Salaries of High Court judges.
Article 226: High Courts can issue writs. Wider than Article 32 because it can be used for fundamental rights and other legal rights.
Article 227: High Court's superintendence over subordinate courts.
Article 233: Appointment of district judges.
Article 235: Control over subordinate courts.

3. Rights-related articles

Article 13: Laws inconsistent with fundamental rights can be declared void.
Article 21: Right to life and personal liberty; expanded through judicial interpretation.
Article 32: Right to constitutional remedies; Dr. B.R. Ambedkar called it the heart and soul of the Constitution.
Article 226: High Court writ power; broader than Article 32.

4. Five writs in simple language

Habeas Corpus: "Show the body." Court asks authority to produce a detained person. Used against illegal detention.
Mandamus: "We command." Court orders a public authority to perform a legal duty.
Prohibition: Higher court stops a lower court/tribunal from exceeding jurisdiction.
Certiorari: Higher court quashes or transfers an order of lower court/tribunal.
Quo Warranto: "By what authority?" Court checks whether a person legally holds a public office.

Memory trick:
Habeas = human freedom.
Mandamus = mandatory duty.
Prohibition = prevent wrong jurisdiction.
Certiorari = cancel wrong order.
Quo Warranto = question the office-holder.

5. Important cases and doctrines

Kesavananda Bharati v State of Kerala, 1973:
Created Basic Structure doctrine. Parliament can amend the Constitution but cannot destroy its basic structure.

Golaknath v State of Punjab, 1967:
Held that Parliament could not amend fundamental rights. Later modified by Kesavananda.

Minerva Mills v Union of India, 1980:
Reaffirmed Basic Structure and balance between Fundamental Rights and Directive Principles.

S.P. Gupta v Union of India, 1981:
First Judges Case. Gave greater say to executive in appointments at that time.

Supreme Court Advocates-on-Record Association v Union of India, 1993:
Second Judges Case. Established judicial primacy in appointments and strengthened collegium idea.

Re Presidential Reference, 1998:
Third Judges Case. Clarified collegium consultation and expanded collective role of senior judges.

Supreme Court Advocates-on-Record Association v Union of India, 2015:
NJAC case. Supreme Court struck down the National Judicial Appointments Commission as violating judicial independence/basic structure.

Hussainara Khatoon v State of Bihar, 1979:
Important PIL/speedy trial case involving undertrial prisoners.

Sunil Batra v Delhi Administration, 1980:
Important prisoners' rights case; letter treated as petition.

Bandhua Mukti Morcha v Union of India, 1984:
Bonded labour and PIL; expanded access to justice for disadvantaged groups.

Maneka Gandhi v Union of India, 1978:
Expanded Article 21; procedure affecting life and liberty must be just, fair and reasonable.

Vishaka v State of Rajasthan, 1997:
Court framed guidelines against sexual harassment at workplace before legislation existed.

I.R. Coelho v State of Tamil Nadu, 2007:
Laws placed in Ninth Schedule after 24 April 1973 can be reviewed if they violate Basic Structure.

6. Important doctrines and phrases

Rule of Law:
Government and citizens are both subject to law. No arbitrary power.

Separation of Powers:
Legislature makes law, executive implements law, judiciary interprets law. In India it is limited separation with checks and balances.

Checks and Balances:
Each organ checks the excesses of others.

Judicial Review:
Court's power to test laws/actions against the Constitution.

Judicial Activism:
Active role of courts in protecting rights and correcting governance failures.

Judicial Overreach:
When courts enter policy/executive domain beyond constitutional necessity.

Public Interest Litigation:
Litigation filed for public good or on behalf of those unable to approach court.

Basic Structure:
Core identity/foundation of Constitution that Parliament cannot destroy by amendment.

Court of Record:
Court's records have evidentiary value and the court can punish for contempt.

7. Appointment and removal: data points

Supreme Court judge retirement age: 65 years.
High Court judge retirement age: 62 years.
Supreme Court judge removal ground: proved misbehaviour or incapacity.
Removal needs special majority in both Houses.
Justice V. Ramaswami removal motion failed despite serious findings because required majority threshold was not met.

8. Difference table for Prelims

Article 32 vs Article 226:
Article 32 is itself a fundamental right; Article 226 is constitutional but not a fundamental right.
Article 32 is only for fundamental rights; Article 226 is for fundamental rights and other legal rights.
Article 32 goes to Supreme Court; Article 226 goes to High Court.
High Court writ jurisdiction is wider in subject matter.

Original vs Appellate jurisdiction:
Original means case starts in Supreme Court.
Appellate means Supreme Court hears appeal from lower court.

Judicial review vs writ:
Writ gives remedy/order.
Judicial review checks constitutionality of law/action.

Judicial activism vs PIL:
PIL is one tool.
Judicial activism is the broader active approach of courts.

9. Common UPSC traps

Trap 1: Saying judicial review is explicitly mentioned as a phrase in the Constitution. The power exists, but the exact phrase is not used.
Trap 2: Saying Article 32 and Article 226 are identical. High Court writ power is wider.
Trap 3: Saying advisory opinion under Article 143 is binding. It is not binding.
Trap 4: Saying Supreme Court cannot review its own judgments. Article 137 allows review.
Trap 5: Saying PIL can be filed only by personally affected persons. PIL relaxed locus standi.
Trap 6: Saying judiciary is independent and therefore unaccountable. It is accountable to Constitution, law, reasons and removal process.
Trap 7: Saying Parliament has unlimited amendment power. Basic Structure limits it.
Trap 8: Saying every policy issue should be handled by courts. That can become overreach.

10. Mains enrichment examples

Use PIL examples:
- undertrial prisoners
- bonded labour
- prison reform
- environmental protection
- electoral transparency

Use current relevance:
- judicial pendency
- access to justice
- tribunalisation
- collegium transparency debate
- separation of powers debate
- technology and e-courts
- legal aid
- undertrial prisoners

Use balanced keywords:
- independence with accountability
- activism with restraint
- rights with institutional discipline
- constitutional supremacy with democratic legitimacy

PART H - FULL STUDY NOTES: HOW TO WRITE THIS TOPIC IN UPSC LANGUAGE

1. Introduction options

Option 1:
The judiciary is the guardian of the Constitution and the final interpreter of law in India.

Option 2:
An independent judiciary is essential for rule of law because it protects citizens against arbitrary state action.

Option 3:
In a constitutional democracy, courts do not merely settle disputes; they preserve the balance between rights, institutions and state power.

2. Body framework for any judiciary answer

Use the acronym RIB-CAP:

R - Rule of law
I - Independence of judiciary
B - Basic structure and constitutional limits
C - Citizens' rights and writs
A - Activism/PIL/access to justice
P - Parliament-judiciary balance

3. Points in favour of strong judiciary

- protects fundamental rights
- checks arbitrary laws
- strengthens constitutional supremacy
- protects federal balance
- gives voice to disadvantaged groups through PIL
- ensures executive accountability
- develops constitutional morality

4. Concerns about judiciary

- pendency and delay
- high cost of litigation
- limited access for poor
- opacity in appointments
- judicial overreach
- contempt power concerns
- underrepresentation in higher judiciary
- implementation gap after judgments

5. Reforms and way forward

- transparent appointments without political capture
- reduce pendency through vacancies, technology and process reform
- strengthen legal aid
- expand e-courts
- improve district judiciary
- use PIL responsibly
- maintain separation of powers
- publish data on case disposal and vacancies
- improve diversity in judiciary

6. Best conclusion

The judiciary must remain independent enough to protect constitutional values and restrained enough to respect democratic separation of powers. Its credibility depends on both courage and accountability.
`;
}
