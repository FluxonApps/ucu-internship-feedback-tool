export const feedbackRatings = [
  { value: 1, label: "Significantly Below Expectations" },
  { value: 2, label: "Below Expectations" },
  { value: 3, label: "Mixed Signals" },
  { value: 4, label: "Meets Expectations" },
  { value: 5, label: "Exceeds Expectations" },
] as const;

export const feedbackMatrices = [
  {
    value: "softCultural",
    label: "Soft Skills & Cultural Fit",
    criteria: [
      { value: "reliabilityAvailability", label: "Reliability & Availability" },
      { value: "communication", label: "Communication" },
      { value: "teamwork", label: "Teamwork" },
      { value: "culturalAlignment", label: "Cultural Alignment" },
      { value: "proactivity", label: "Proactivity" },
      {
        value: "abilityToAdjustImprove",
        label: "Ability to Adjust & Improve",
      },
    ],
  },
  {
    value: "technical",
    label: "Technical Skills",
    criteria: [
      { value: "codeQualityClarity", label: "Code Quality & Clarity" },
      {
        value: "independentDebuggingTesting",
        label: "Independent Debugging & Testing",
      },
      { value: "codeReviewSkills", label: "Code Review Skills" },
      { value: "workWithDocumentation", label: "Work with Documentation" },
      {
        value: "systemDesignUnderstandingCuriosity",
        label: "System Design Understanding & Curiosity",
      },
    ],
  },
] as const;

export const standardFeedbackFields = [
  {
    value: "positiveFeedback",
    label: "What the intern was doing well",
    required: true,
    visibility: "public",
  },
  {
    value: "constructiveFeedback",
    label: "What the intern could be doing even better",
    required: true,
    visibility: "public",
  },
  {
    value: "managerOnlyFeedback",
    label: "What the manager should know or act on",
    required: false,
    visibility: "managerOnly",
  },
] as const;

export type FeedbackRating = (typeof feedbackRatings)[number]["value"];
export type FeedbackCriterion =
  (typeof feedbackMatrices)[number]["criteria"][number]["value"];

export const feedbackCriteria = [
  ...feedbackMatrices[0].criteria,
  ...feedbackMatrices[1].criteria,
] as const;
