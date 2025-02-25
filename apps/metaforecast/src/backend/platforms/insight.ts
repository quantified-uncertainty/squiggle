import { Platform } from "../types";

/**
 * https://insightprediction.com/
 *
 * Legacy platform. I've removed all code for not, not worth maintaining, volume is too low.
 *
 * Legacy code is in https://github.com/quantified-uncertainty/metaforecast/blob/15ea265f6d73960c2b5d3f9f1298bfee63164c67/src/backend/platforms/insight.ts
 */
export const insight: Platform = {
  name: "insight",
  label: "Insight Prediction",
  color: "#ff0000",

  calculateStars: () => 1,
};
