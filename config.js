/* ============================================================================
 *  WORKPLACE FLOURISHING SCALE — CFA VALIDATION SURVEY
 *  SURVEY CONFIGURATION FILE  (config.js)
 * ----------------------------------------------------------------------------
 *  THIS IS THE ONLY FILE NON-TECHNICAL RESEARCHERS NEED TO EDIT.
 *  See EDITING_ITEMS.md for a plain-language guide.
 *
 *  Quick rules:
 *   - Item text goes in quotes "like this".
 *   - "scale" must match one of the keys in responseScales below.
 *   - "reverse: true" means the item is reverse-worded (scored backwards).
 *   - "instruction" on a block is shown ABOVE EVERY item in that block, so the
 *     reference period / response frame is never lost (set to null for none).
 *   - Do NOT change an item's "id" once data collection has started.
 *   - Commas matter. Every item ends with a comma. Keep the structure intact.
 * ========================================================================== */

const SURVEY_CONFIG = {

  /* ----- STUDY METADATA -------------------------------------------------- */
  study: {
    title: "What helps people flourish at work?",
    subtitle:
      "A short research study on what makes work feel meaningful, healthy, and fulfilling.",
    estimatedMinutes: 15,
    researcher: {
      name: "Rachna Verma",
      designation: "PhD Research Scholar",
      institution: "IIT Kharagpur",
      email: "vermarachna@kgpian.iitkgp.ac.in"
    }
  },

  /* ----- BACKEND --------------------------------------------------------- */
  backend: {
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbx_U4EwcLf3Hg3c7tJo46UWUBfIi81t8mksHWzAxZxhW3fQx_c_E5cKhIXSxLIvRKde/exec",
    sharedSecret: "flourish-2026-Rv7x9k-secret"
  },

  /* ----- INCENTIVE / PRIZE DRAW (participant-friendly wording only) ------ *
   * No data-quality, attention-check, or eligibility language here — the
   * system enforces eligibility internally and invisibly.                  */
  incentive: {
    enabled: true,
    headline: "A small thank-you",
    short: "For every 20 people who take part, one is chosen at random to receive ₹1,000.",
    body:
      "As our way of saying thank you, for every 20 people who take part we " +
      "randomly select one person to receive ₹1,000. Entering is completely " +
      "optional — we'll simply ask on the next screen, and you can take part in " +
      "the study either way."
  },

  /* ----- DATA-QUALITY THRESHOLDS (internal; never shown to participants) - */
  quality: {
    minSecondsPerItem: 1.0,
    tooFastProportionFlag: 0.30,
    longstringFlag: 15,
    longstringHardFlag: 25,
    minResponseSD: 0.50,
    passingQualityScore: 70,
    requireBothAttentionChecks: true
  },

  /* ----- PROGRESS MILESTONES (subtle, shown inside the progress bar) ------ *
   * No pop-up screens. These short words appear in the progress indicator
   * once the percentage passes each threshold. Set to [] to disable.       */
  progressMilestones: [
    { atPercent: 25, label: "Good progress" },
    { atPercent: 50, label: "Over halfway" },
    { atPercent: 75, label: "Nearly there" },
    { atPercent: 90, label: "Almost done" }
  ],

  /* ====================================================================== *
   *  RESPONSE SCALES (anchors low→high; stored code 1..n)
   * ====================================================================== */
  responseScales: {
    likert5_sdsa: {
      label: "Strongly Disagree → Strongly Agree (5-point)",
      anchors: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    likert7_sdsa: {
      label: "Strongly Disagree → Strongly Agree (7-point)",
      anchors: ["Strongly Disagree", "Disagree", "Somewhat Disagree", "Neutral",
                "Somewhat Agree", "Agree", "Strongly Agree"]
    },
    freq6_never_always: {
      label: "Never → Always (6-point frequency)",
      anchors: ["Never", "Rarely", "Sometimes", "Usually", "Almost Always", "Always"]
    },
    freq6_turnover: {
      label: "Never → Extremely often (6-point frequency)",
      anchors: ["Never", "Rarely", "Sometimes", "Somewhat often", "Quite often", "Extremely often"]
    },
    freq5_never_always: {
      label: "Never → Always (5-point frequency)",
      anchors: ["Never", "Rarely", "Sometimes", "Often", "Always"]
    },
    lifesat5: {
      label: "Very Satisfied → Very Dissatisfied (5-point)",
      anchors: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
    },
    proactivity5: {
      label: "Very little → A great deal (5-point)",
      anchors: ["Very little", "A little", "A moderate amount", "Quite a bit", "A great deal"]
    }
  },

  /* ====================================================================== *
   *  SCALE BLOCKS  (order = order of presentation)
   *  NOTE: block "title" is NOT shown to participants (kept for your own
   *  reference and for scoring). "instruction" IS shown above every item.
   *
   *  ►► FAWS RESPONSE FORMAT: set to 7-point (likert7_sdsa).
   *     Confirm this matches the format used in your Phase-1 EFA. ◄◄
   * ====================================================================== */
  blocks: [

    /* ---------- FLOURISHING AT WORK SCALE (50 items, 7-point) ---------- */
    {
      id: "FAWS",
      title: "Flourishing at Work",
      construct: "Flourishing at Work",
      instruction: "Thinking about the job that matters most to you, please indicate how much you agree with each statement.",
      randomizeItems: true,
      groupBy: "dim",      // shuffle WITHIN each sub-dimension; sub-dimensions stay grouped & in order
      score: true,
      items: [
        { id: "FS1", dim: "Financial Security", text: "I feel confident that my income would cover a major unexpected expense.", scale: "likert7_sdsa" },
        { id: "FS2", dim: "Financial Security", text: "I have money in reserve at the end of the month.", scale: "likert7_sdsa" },
        { id: "FS3", dim: "Financial Security", text: "My income is enough to provide for the well-being of my family.", scale: "likert7_sdsa" },
        { id: "FS4", dim: "Financial Security", text: "I am satisfied with what I earn for the work I do.", scale: "likert7_sdsa" },
        { id: "FS5", dim: "Financial Security", text: "My income isn't enough to cover my monthly expenses.", scale: "likert7_sdsa", reverse: true },
        { id: "JS1", dim: "Job Security", text: "I worry about losing my job.", scale: "likert7_sdsa", reverse: true },
        { id: "JS2", dim: "Job Security", text: "I feel confident that my position in this organisation is secure.", scale: "likert7_sdsa" },
        { id: "JS3", dim: "Job Security", text: "I am confident that my organisation will continue to employ me in the foreseeable future.", scale: "likert7_sdsa" },
        { id: "JS4", dim: "Job Security", text: "I do not fear that economic or industry changes will put my job at risk.", scale: "likert7_sdsa" },
        { id: "PMH1", dim: "Physical and Mental Health", text: "My work leaves me physically exhausted.", scale: "likert7_sdsa", reverse: true, note: "Negatively worded; confirm keying direction with the scale authors." },
        { id: "PMH2", dim: "Physical and Mental Health", text: "My job has a negative impact on my physical health.", scale: "likert7_sdsa", reverse: true },
        { id: "PMH3", dim: "Physical and Mental Health", text: "My job has a negative impact on my mental health.", scale: "likert7_sdsa", reverse: true },
        { id: "PMH4", dim: "Physical and Mental Health", text: "I feel excessive levels of stress at work.", scale: "likert7_sdsa", reverse: true },
        { id: "PMH5", dim: "Physical and Mental Health", text: "I often feel frustrated or angry at work.", scale: "likert7_sdsa", reverse: true },
        { id: "WLB1", dim: "Work Life Balance", text: "I have enough time for my personal life outside work.", scale: "likert7_sdsa" },
        { id: "WLB2", dim: "Work Life Balance", text: "My work schedule allows me to rest and recover adequately.", scale: "likert7_sdsa" },
        { id: "WLB3", dim: "Work Life Balance", text: "My job demands negatively affect my personal life.", scale: "likert7_sdsa", reverse: true },
        { id: "WLB4", dim: "Work Life Balance", text: "I can disconnect from work during my personal time.", scale: "likert7_sdsa" },
        { id: "CA1", dim: "Career Advancement", text: "I am advancing rapidly in my career.", scale: "likert7_sdsa" },
        { id: "CA2", dim: "Career Advancement", text: "My career progression is meeting my expectations.", scale: "likert7_sdsa" },
        { id: "CA3", dim: "Career Advancement", text: "I am making steady progress in my career.", scale: "likert7_sdsa" },
        { id: "RR1", dim: "Recognition and Respect", text: "I regularly receive appreciation for the contributions I make at work.", scale: "likert7_sdsa" },
        { id: "RR2", dim: "Recognition and Respect", text: "My contributions at work are valued by others.", scale: "likert7_sdsa" },
        { id: "RR3", dim: "Recognition and Respect", text: "My efforts at work go unacknowledged by others.", scale: "likert7_sdsa", reverse: true },
        { id: "RR4", dim: "Recognition and Respect", text: "I am treated with respect by others with whom I work.", scale: "likert7_sdsa" },
        { id: "RR5", dim: "Recognition and Respect", text: "I feel respected by management in this organisation.", scale: "likert7_sdsa" },
        { id: "LU1", dim: "Lifestyle Upgradation", text: "My job has allowed me to achieve lifestyle milestones that matter to me (e.g., owning a home, travelling, or supporting my family).", scale: "likert7_sdsa" },
        { id: "LU2", dim: "Lifestyle Upgradation", text: "My job has improved my standard of living.", scale: "likert7_sdsa" },
        { id: "LU3", dim: "Lifestyle Upgradation", text: "My income allows me to provide a comfortable quality of life for those who depend on me.", scale: "likert7_sdsa" },
        { id: "LU4", dim: "Lifestyle Upgradation", text: "My work has enabled me to live a lifestyle that reflects my aspirations.", scale: "likert7_sdsa" },
        { id: "EF1", dim: "Emotional Fulfillment", text: "I become so absorbed in my work that I lose track of time.", scale: "likert7_sdsa" },
        { id: "EF2", dim: "Emotional Fulfillment", text: "I feel energized when I am working.", scale: "likert7_sdsa" },
        { id: "EF3", dim: "Emotional Fulfillment", text: "I look forward to going to work each morning.", scale: "likert7_sdsa" },
        { id: "EF4", dim: "Emotional Fulfillment", text: "I find my work deeply fulfilling.", scale: "likert7_sdsa" },
        { id: "EF5", dim: "Emotional Fulfillment", text: "My work makes me happy.", scale: "likert7_sdsa" },
        { id: "EF6", dim: "Emotional Fulfillment", text: "I am satisfied with my job.", scale: "likert7_sdsa" },
        { id: "EF7", dim: "Emotional Fulfillment", text: "I find it difficult to stay motivated at work.", scale: "likert7_sdsa", reverse: true },
        { id: "PF1", dim: "Psychological Fulfillment", text: "I often find myself learning at work.", scale: "likert7_sdsa" },
        { id: "PF2", dim: "Psychological Fulfillment", text: "My job allows me to achieve my full potential.", scale: "likert7_sdsa" },
        { id: "PF3", dim: "Psychological Fulfillment", text: "I am growing a lot as a person through my work.", scale: "likert7_sdsa" },
        { id: "PF4", dim: "Psychological Fulfillment", text: "I feel confident in my ability to handle the challenges my job presents.", scale: "likert7_sdsa" },
        { id: "SF1", dim: "Social Fulfillment", text: "I genuinely feel that I belong to the team or group I work with.", scale: "likert7_sdsa" },
        { id: "SF2", dim: "Social Fulfillment", text: "I feel comfortable being myself around my colleagues.", scale: "likert7_sdsa" },
        { id: "SF3", dim: "Social Fulfillment", text: "My colleagues and I share a genuine sense of connection.", scale: "likert7_sdsa" },
        { id: "SF4", dim: "Social Fulfillment", text: "I feel supported by the people I work with.", scale: "likert7_sdsa" },
        { id: "GG1", dim: "Greater Good", text: "The work that I do contributes to creating value for others (i.e., company, organisation, enterprise, customer/client, society, etc.).", scale: "likert7_sdsa" },
        { id: "GG2", dim: "Greater Good", text: "The work I do serves a greater purpose.", scale: "likert7_sdsa" },
        { id: "GG3", dim: "Greater Good", text: "My work helps in making a real difference in the world.", scale: "likert7_sdsa" },
        { id: "GG4", dim: "Greater Good", text: "My work allows me to make a positive difference in other people's lives.", scale: "likert7_sdsa" },
        { id: "GG5", dim: "Greater Good", text: "My work serves more than just my own interests.", scale: "likert7_sdsa" }
      ]
    },

    /* ---------- VALIDATION BATTERY (34 items, original formats kept) --- */
    {
      id: "PJF", title: "Person–Job Fit", construct: "Person–Job Fit",
      instruction: null, randomizeItems: true, score: true,
      items: [
        { id: "PJF1", text: "I have a good fit with my job.", scale: "likert5_sdsa" },
        { id: "PJF2", text: "The requirements of my job match my specific talents and skills.", scale: "likert5_sdsa" },
        { id: "PJF3", text: "I fit in well with my work environment.", scale: "likert5_sdsa" }
      ]
    },
    {
      id: "TI", title: "Turnover Intention", construct: "Turnover Intention",
      instruction: null, randomizeItems: true, score: true,
      items: [
        { id: "TI1", text: "How often have you seriously considered leaving your current job?", scale: "freq6_turnover" }
      ]
    },
    {
      id: "LS", title: "Life Satisfaction", construct: "Life Satisfaction",
      instruction: null, randomizeItems: true, score: true,
      items: [
        { id: "LS1", text: "In general, how satisfied are you with your life?", scale: "lifesat5", reverse: true, note: "Anchors run Very Satisfied(1)->Very Dissatisfied(5); reverse so higher score = more satisfied." }
      ]
    },
    {
      id: "TW", title: "Thriving from Work", construct: "Thriving from Work",
      instruction: "How often have you generally felt this way about your work over the last month?",
      randomizeItems: true, score: true,
      items: [
        { id: "TW1", text: "I love my job.", scale: "freq6_never_always" },
        { id: "TW2", text: "I am treated fairly at work.", scale: "freq6_never_always" },
        { id: "TW3", text: "I can achieve a healthy balance between my work and my life outside of work.", scale: "freq6_never_always" },
        { id: "TW4", text: "I am paid fairly for the job I do.", scale: "freq6_never_always" },
        { id: "TW5", text: "I am happy with how much input I have in decisions that affect my work.", scale: "freq6_never_always" },
        { id: "TW6", text: "I can easily manage the demands of my job.", scale: "freq6_never_always" },
        { id: "TW7", text: "I feel psychologically safe at work.", scale: "freq6_never_always", note: "Marked * in source; treated as positively keyed (standard scoring). Confirm if reverse is intended." },
        { id: "TW8", text: "I can voice concerns or make suggestions at work without getting into trouble.", scale: "freq6_never_always" }
      ]
    },
    {
      id: "AC", title: "Affective Commitment", construct: "Affective Commitment",
      instruction: null, randomizeItems: true, score: true,
      items: [
        { id: "AC1", text: "I would be very happy to spend the rest of my career with this organization.", scale: "likert7_sdsa" },
        { id: "AC2", text: "I really feel as if this organization's problems are my own.", scale: "likert7_sdsa" },
        { id: "AC3", text: "I do not feel a strong sense of \"belonging\" to my organization.", scale: "likert7_sdsa", reverse: true },
        { id: "AC4", text: "I do not feel \"emotionally attached\" to this organization.", scale: "likert7_sdsa", reverse: true },
        { id: "AC5", text: "I do not feel like \"part of the family\" at my organization.", scale: "likert7_sdsa", reverse: true },
        { id: "AC6", text: "This organization has a great deal of personal meaning for me.", scale: "likert7_sdsa" }
      ]
    },
    {
      id: "DF", title: "Flourishing (Diener)", construct: "Flourishing (Diener)",
      instruction: null, randomizeItems: true, score: true,
      items: [
        { id: "DF1", text: "I lead a purposeful and meaningful life.", scale: "likert7_sdsa" },
        { id: "DF2", text: "My social relationships are supportive and rewarding.", scale: "likert7_sdsa" },
        { id: "DF3", text: "I am engaged and interested in my daily activities.", scale: "likert7_sdsa" },
        { id: "DF4", text: "I actively contribute to the happiness and well-being of others.", scale: "likert7_sdsa" },
        { id: "DF5", text: "I am competent and capable in the activities that are important to me.", scale: "likert7_sdsa" },
        { id: "DF6", text: "I am a good person and live a good life.", scale: "likert7_sdsa" },
        { id: "DF7", text: "I am optimistic about my future.", scale: "likert7_sdsa" },
        { id: "DF8", text: "People respect me.", scale: "likert7_sdsa" }
      ]
    },
    {
      id: "BAT", title: "Burnout (BAT4)", construct: "Burnout (BAT4)",
      instruction: "How often does each statement apply to you?",
      randomizeItems: true, score: true,
      items: [
        { id: "BAT1", text: "At work, I feel mentally exhausted.", scale: "freq5_never_always" },
        { id: "BAT2", text: "I struggle to find any enthusiasm for my work.", scale: "freq5_never_always" },
        { id: "BAT3", text: "When I'm working, I have trouble concentrating.", scale: "freq5_never_always" },
        { id: "BAT4", text: "At work, I may overreact unintentionally.", scale: "freq5_never_always" }
      ]
    },
    {
      id: "TP", title: "Task Proactivity", construct: "Task Proactivity",
      instruction: "Over the past month, to what extent have you done each of the following?",
      randomizeItems: true, score: true,
      items: [
        { id: "TP1", text: "Initiated better ways of doing your core tasks.", scale: "proactivity5" },
        { id: "TP2", text: "Come up with ideas to improve the way in which your core tasks are done.", scale: "proactivity5" },
        { id: "TP3", text: "Made changes to the way your core tasks are done.", scale: "proactivity5" }
      ]
    }
  ],

  /* ====================================================================== *
   *  ATTENTION CHECKS (instructed-response; participant never told these
   *  exist beforehand). Styled to look like ordinary items.
   * ====================================================================== */
  attentionChecks: [
    {
      id: "ATT1",
      text: "Please select \"Disagree\" for this statement so we know your answers are being recorded.",
      scale: "likert7_sdsa",
      correctValue: 2,
      insertAfterScaleItem: 28
    },
    {
      id: "ATT2",
      text: "For this statement, please select \"Strongly Agree\".",
      scale: "likert7_sdsa",
      correctValue: 7,
      insertAfterScaleItem: 66
    }
  ],

  /* ====================================================================== *
   *  DEMOGRAPHICS (after all scale items; all required dropdowns)
   * ====================================================================== */
  demographicsHeading:
    "Almost done. These last few questions help us understand the range of people in our study.",
  // Harmonised EXACTLY with the printed paper form so the two modes pool
  // without recoding. "type: text" = free-text field; otherwise selection cards.
  demographics: [
    { id: "gender", label: "Gender", options: ["Male", "Female", "Other", "Prefer not to say"] },
    { id: "age", label: "Age", options: ["Below 25", "25–34", "35–44", "45–54", "55 and above"] },
    { id: "marital", label: "Marital Status", options: ["Single", "Married", "Divorced/Separated", "Widowed"] },
    { id: "education", label: "Educational Qualification", options: ["Diploma", "Bachelor’s Degree", "Master’s Degree", "Doctorate", "Other"] },
    { id: "employment", label: "Employment Type", options: ["Permanent", "Contractual", "Part-time", "Other"] },
    { id: "jobLevel", label: "Job Level", options: ["Individual Contributor", "Team Lead / Supervisor", "Manager", "Senior Manager and Above"] },
    { id: "orgType", label: "Organization Type", options: ["Private Sector", "Public Sector / Government", "Non-profit / NGO", "Other"] },
    { id: "industry", label: "Industry / Sector", options: ["Education", "Healthcare", "IT/Technology", "Manufacturing", "Finance/Banking", "Government", "Other"] },
    { id: "experience", label: "Total Work Experience", options: ["Less than 1 year", "1–3 years", "4–7 years", "8–12 years", "More than 12 years"] },
    { id: "tenure", label: "Tenure in Current Organization", options: ["Less than 1 year", "1–3 years", "4–7 years", "8–12 years", "More than 12 years"] },
    { id: "workSetting", label: "Work Setting", options: ["Office-based", "Remote", "Hybrid"] },
    { id: "income", label: "Monthly Income", options: ["Below ₹25,000", "₹25,001–₹50,000", "₹50,001–₹75,000", "₹75,001–₹1,00,000", "Above ₹1,00,000", "Prefer not to say"] }
  ],

  /* Final self-report data-quality item (after demographics) -------------- */
  diligenceItem: {
    id: "DILIGENCE",
    text: "I carefully read and answered all questions in this survey.",
    scale: "likert5_sdsa"
  },

  /* ====================================================================== *
   *  ELIGIBILITY SCREENING (shown after the participant details screen)
   *  Only "eligible: true" options may continue; others are terminated.
   * ====================================================================== */
  eligibility: {
    question: "Which of the following best describes your current status?",
    options: [
      { label: "Salaried Employee (full-time or part-time)", eligible: true },
      { label: "Student", eligible: false },
      { label: "Business Owner / Self-Employed", eligible: false },
      { label: "Other", eligible: false }
    ]
  },

  /* ====================================================================== *
   *  REFERRAL SYSTEM
   *  surveyLink  -> the public URL participants share (UPDATE after deploy).
   *  reward      -> one-time, paid once validReferrals reaches `threshold`.
   * ====================================================================== */
  referral: {
    enabled: true,
    surveyLink: "https://rachnaverma1203.github.io/flourishing-survey/",
    rewardThreshold: 10,
    rewardAmountText: "₹500",
    messageTemplate:
      "🌱 I recently participated in a research study on Workplace Flourishing and thought you might be interested.\n\n" +
      "The study is looking for salaried employees and takes approximately 15 minutes to complete. " +
      "As a token of appreciation, participants have a chance to win ₹1,000 through a lucky draw.\n\n" +
      "If you participate, please use my referral ID:\n\n" +
      "Referral ID: {REFERRAL_ID}\n" +
      "Survey Link: {SURVEY_LINK}\n\n" +
      "Thank you for supporting academic research!"
  }
};

// Expose for the browser (top-level `const` is NOT auto-attached to window).
if (typeof window !== "undefined") { window.SURVEY_CONFIG = SURVEY_CONFIG; }
// Expose for the Node test harness.
if (typeof module !== "undefined" && module.exports) { module.exports = SURVEY_CONFIG; }
