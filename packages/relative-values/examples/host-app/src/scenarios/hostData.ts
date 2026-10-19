// Data that the host app has and the relative values model doesn't: owners
// and revenue per initiative (made up).
export const ownerById: Record<string, string> = {
  sso: "Identity team",
  auditLog: "Identity team",
  usageBilling: "Billing team",
  partnerApi: "Platform team",
  onboardingRevamp: "Growth team",
  inAppHelp: "Growth team",
  healthScores: "Data team",
  winBackEmails: "Growth team",
  dbMigration: "Platform team",
  ciSpeedup: "Platform team",
  observability: "Platform team",
  costDashboards: "Data team",
  forecastingModel: "Data team",
  anomalyDetection: "Data team",
  pricingExperiment: "Billing team",
};

// Annual revenue impact, in $k.
export const revenueById: Record<string, number> = {
  sso: 420,
  auditLog: 180,
  usageBilling: 950,
  partnerApi: 610,
  onboardingRevamp: 330,
  inAppHelp: 90,
  healthScores: 140,
  winBackEmails: 260,
  dbMigration: 40,
  ciSpeedup: 20,
  observability: 60,
  costDashboards: 110,
  forecastingModel: 300,
  anomalyDetection: 75,
  pricingExperiment: 520,
};
