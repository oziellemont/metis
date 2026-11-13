/**
 * Landing de MÊTIS CEO en inglés (metis.ceo/en). Misma forma que el español (tipo Copy de ./content).
 * Titulares: frases que propuso Oziel (30-oct). «The decisions are simulated. The learning is real.» queda fuera
 * hasta tener evidencia que la respalde. Lo que no existe no se menciona, igual que en español.
 * El simulador está en español: se dice con claridad en el primer bloque y en las preguntas frecuentes.
 */
import type { CaseOption, Copy, StageState, TodayItem } from "./content";
import { ACADEMY as ES_ACADEMY, PATH as PATH_ES } from "./content";

/** Módulos de Academy en inglés, en el mismo orden que en español. */
const EN_MOD: [string, string][] = [
  ["CEO mindset", "How someone who carries the responsibility thinks."],
  ["Leading people", "Each person needs something different from you."],
  ["Conversations", "Saying the hard thing so it is heard."],
  ["Teams", "Trust, useful conflict and commitment."],
  ["Alignment", "From strategy to what everyone does on Monday."],
  ["Negotiation", "Interests, alternatives and relationships that last."],
  ["Communication", "Start with the end and deliver bad news."],
  ["Culture and ethics", "What you tolerate is your real code."],
  ["Finance", "Allocate capital and never run out of cash."],
  ["Innovation", "Bet small, learn fast, close on time."],
  ["Strategy", "Choose, and have the character to say no."],
  ["Crisis", "People first, facts next, one voice."],
  ["Governance and the board", "No surprises, always with options."],
];

export const EN: Copy = {
  lang: "en",
  SEO: {
    title: "MÊTIS CEO | Practice the decisions before they become yours",
    description: "A leadership simulator. Handle real business situations, make decisions and see how they affect results and people, a few minutes a day.",
    ogAlt: "MÊTIS CEO. Every decision shapes the leader you become.",
    locale: "en_US",
  },
  NAV: [
    { href: "#como", label: "How it works" },
    { href: "#academy", label: "Academy" },
    { href: "#camino", label: "Your career" },
  ],
  CTA: "Start free",
  UI: {
    skip: "Skip to content",
    home: "MÊTIS CEO, home",
    mainNav: "Main",
    login: "Sign in",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    switchLabel: "Leer en español",
    switchShort: "ES",
    howEyebrow: "How it works",
    stage: "Chapter",
    stagesLabel: "Company chapters",
    faqTitle: "Frequently asked questions",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    footerNav: "Footer",
    privacy: "Privacy notice",
    terms: "Terms",
    playing: "Continue my career",
  },
  HERO: {
    eyebrow: "Leadership simulator",
    title: "Think and decide like a CEO. A few minutes a day.",
    body: "Live the challenges of running a company: get messages from your team, solve business situations and learn from their consequences to develop your judgment as a leader.",
    motto: "Every decision shapes the leader you become.",
    note: "No card required.",
  },
  CASE: {
    label: "A case from the simulator",
    steps: ["The case", "Context", "Decide", "Result", "Learn"],
    stepOf: "Step {n} of {t}",
    received: "Something just came in",
    from: { name: "Ana Martínez", initials: "AM", role: "Commercial Planning Analyst", tone: "#5B4BE8", time: "8:40" },
    kind: "reporte" as "correo" | "reporte",
    channel: "Report",
    subject: "Q1 forecast · final version (22 slides)",
    to: "To: Chief Executive <direccion@botanascumbre.mx>",
    body: [
      "Good morning, Director,",
      "Here is the Q1 sales forecast you asked me for the board meeting. I included all the detail by SKU, channel, region and month, plus 6 pricing scenarios.",
      "I stayed up a bit late, but I wanted you to have all the information.",
      "Looking forward to your comments.\nAna",
    ],
    context: {
      eyebrow: "Before you decide",
      title: "What you need to know",
      text: "The facts of the matter and who is at stake. Take your time.",
      data: {
        title: "What you see when you open the file",
        rows: [["Slides", "22"], ["Tables", "17 (8-point font)"], ["Conclusion or recommendation", "— none —"], ["Slide 19 of 22", "\u201cPremium chips grow 28% and the traditional line drops 6%\u201d (buried in a table)"]] as [string, string][],
        note: "The board meeting is in 9 days.",
      },
    },
    decide: { eyebrow: "Your decision", ask: "Ana worked hard, but this doesn't work for you. What do you do?", cta: "Make the decision" },
    options: [
      { id: "a", text: "Answer fast and clear: \u201cAna, this won't work for a board. I need 3 slides with a conclusion. By tomorrow.\u201d", reply: ["Understood, Director.", "Sorry."], outcome: "Tomorrow you'll have 3 slides. You'll also have an analyst who won't go the extra mile for you again.", effects: [["Board", 3], ["Team", -4]] },
      { id: "b", text: "Sit with her for 20 minutes: teach her to start with the end, with what the board must decide, and ask for one page.", reply: ["Thank you so much for your time, Director. Nobody had ever explained \u201cstart with the end\u201d to me.", "I saw the key point was on slide 19. I'll send you one page on Thursday. May I propose what to do with the traditional line?"], outcome: "You invest 20 minutes and gain someone who won't need you for this next quarter. The board version arrives on Thursday.", effects: [["Team", 5], ["Board", -1]] },
      { id: "c", text: "Thank her and build the presentation myself tonight. It's faster and the board can't wait for another version.", reply: ["So glad it helped!"], outcome: "The presentation looks good. Ana never learns what was missing and you just bought yourself work for every quarter.", effects: [["Board", 2], ["Team", -1]] },
    ] as CaseOption[],
    result: { decided: "You decided", what: "What happened at Botanas Cumbre" },
    learn: {
      eyebrow: "CEO logbook",
      title: "Start with the end",
      text: "Ana had the big idea (premium +28%, traditional −6%) on slide 19. Executive presentations start with the big picture and a recommendation. And teaching that is worth more than fixing it.",
      notaLabel: "CEO note:",
      nota: "A presentation shouldn't prove you worked hard; it should help the audience understand fast and act better.",
      lessonLabel: "Learn the theory:",
      lesson: "Executive communication · 5 min",
    },
    nav: { back: "Back", next: ["See the context", "Decide", "", "What you learn"], again: "Choose another answer" },
    note: "Day 2 case at Botanas Cumbre, exactly as it appears in the simulator (translated). This sample saves nothing.",
  },
  HOW: {
    title: "What if learning to lead felt like actually leading?",
    body: "At MÊTIS you dive into a company that comes alive with every email, WhatsApp message or call. Make decisions, discover their consequences, gain experience and unlock new challenges while you develop your judgment as a leader. All in a few minutes a day!",
    steps: [
      { n: "01", t: "A situation reaches you", d: "A customer complains, your team needs an answer or the budget falls short. It can arrive at any time of the day." },
      { n: "02", t: "You make a decision", d: "You review the context, choose a path and own its consequences. You won't always have all the information." },
      { n: "03", t: "You learn from what happens", d: "You see how people react, what changes in the business and what you might consider next time." },
    ],
    slides: {
      label: "How a matter arrives and gets resolved",
      tabs: ["The email arrives", "You see it in Today", "You decided"],
      channel: { email: "Email", whatsapp: "WhatsApp", reporte: "Report" },
      inbox: {
        app: "Inbox",
        fromLine: "Sofía Leal · Botanas Cumbre",
        time: "9:14",
        preview: "To keep your two shelf fronts we need 4 additional points of discount and to move to 90 days…",
        decision: "Your decision",
        button: "Reply",
        deadline: "Reply within the next 24 h",
      },
      today: {
        top: "Today · Day 2 at Botanas Cumbre",
        title: "Waiting for your decision",
        inbox: "Inbox",
        items: [
          { initials: "SL", tone: "#171A3A", name: "Sofía Leal", channel: "email", text: "Commercial terms 2027 · Botanas Cumbre", due: "Due in 23 h" },
          { initials: "AM", tone: "#5B4BE8", name: "Ana Martínez", channel: "reporte", text: "Q1 forecast · final version (22 slides)", due: "Due in 23 h" },
          { initials: "HS", tone: "#3A2DB8", name: "Héctor Salinas", channel: "whatsapp", text: "I heard about SuperNorte. I've known Sofía since she was an intern…", due: "Due in 11 h" },
        ] as TodayItem[],
      },
      done: {
        status: "Matter resolved",
        option: "b",
        left: "You have 2 matters left for today.",
      },
      pause: "Pause the sequence",
      play: "Play the sequence",
      caption: "Example with the SuperNorte case at Botanas Cumbre.",
    },
  },
  ACADEMY: {
    eyebrow: "mêtis Academy",
    title: "Learn the theory behind every decision.",
    body: "Every case leaves you a lesson, and you reinforce it with short, interactive lessons: 13 modules and 25 lessons of 4 to 5 minutes. Cases and frameworks are inspired by MBA programs, business schools and management books.",
    listLabel: "mêtis Academy modules",
    link: { t: "From each case to its lesson", d: "When you finish a case, the log tells you what you learned and takes you to the lesson that explains why things happened." },
    lesson: "lesson",
    lessons: "lessons",
    modules: ES_ACADEMY.modules.map((m, i) => ({ ...m, title: EN_MOD[i][0], blurb: EN_MOD[i][1] })),
  },
  PATH: {
    eyebrow: "Your career",
    title: "Leadership isn't a title. It's a practice.",
    body: "From day one you are the Chief Executive of a company that already exists, with its own history, team and board. Every case leaves you a lesson: you understand why things happened and reinforce the theory in mêtis Academy. What changes is the company: depending on what you decide, it stabilizes, builds capability, accelerates, or goes through a crisis and recovers.",
    stateLabel: { inicio: "You start here", capitulo: "Possible chapter" } as Record<StageState, string>,
    stages: PATH_ES.stages.map((s, i) => ({ ...s, name: ["Take charge", "Stabilize", "Build capability", "Accelerate with judgment", "Scale", "Govern complexity"][i], learn: ["Understand what you inherit and prioritize", "Cash, service, costs and execution", "Managers, processes and talent", "Where to invest and where not to", "Several areas, regions or alliances", "More exposure and wider-reaching risks"][i] })),
  },
  FAQ: [
    { q: "Do I need management experience?", a: "No. When you start, we ask about your experience to adjust the help you see and the order of the cases." },
    { q: "How much time do I need each day?", a: "A few minutes. You choose the hours when matters arrive." },
    { q: "How is it different from a course?", a: "There are no answers to memorize. You decide, the company responds and then you understand why." },
    { q: "Do I need to create an account or install anything?", a: "You don't install anything: it runs in the browser. You create an account with Google or your email, and your progress follows you to any device." },
    { q: "Which industries are there?", a: "Consumer goods, auto parts, restaurants, software, retail, logistics and distribution. Your first cases take place in a company from the industry you tell us about when you sign up, if it is one of these; otherwise, in a consumer goods one." },
    { q: "Does it cost anything?", a: "Starting is free and no card is required." },
    { q: "What language is the simulator in?", a: "The simulator is in Spanish, with companies and people set in Mexico. This page is available in English and Spanish." },
  ],
  CLOSE: {
    title: "Tomorrow's leaders start deciding today.",
    body: "Before the title, build the judgment. Practice running a company, one case at a time.",
  },
  FOOTER: { tagline: "Where leadership is practiced, not preached.", place: "Monterrey, N.L., Mexico" },
};

/** Frases que no queremos en la versión en inglés (tono y promesas). Se revisan en las pruebas. */
export const BANNED_EN = ["revolutioniz", "unlock your", "transform your", "supercharge", "next level", "ultimate", "disruptive", "game changer", "game-changer", "cutting-edge", "powered by", "cancel anytime", "free trial", "coming soon", "stay tuned", "soon"];

