// Non-React parts of the package: types, evaluation and spec parsing.
// Safe to import from server code (e.g. React Server Components or server actions).
// Definition types
export {
  type Cluster,
  type Clusters,
  type Item,
  type RelativeValuesDefinition,
  relativeValuesClusterSchema,
  relativeValuesClustersSchema,
  relativeValuesDefinitionSchema,
  relativeValuesItemSchema,
  relativeValuesItemsSchema,
} from "./types.js";

// Evaluation
export {
  type RelativeValue,
  type RelativeValueResult,
  relativeValueSchema,
} from "./values/types.js";
export {
  InMemoryRelativeValuesCache,
  makePairKey,
  type PairKey,
  parsePairKey,
  type RelativeValuesCache,
} from "./values/cache.js";
export {
  type ComputeOptions,
  type ComputeProgress,
  type CreateModelEvaluatorOptions,
  extractOkValues,
  getParamPercentiles,
  type ItemPair,
  ModelEvaluator,
  type ModelEvaluatorOptions,
} from "./values/ModelEvaluator.js";

// Precomputed bundles
export {
  type BundleNumber,
  createRelativeValuesBundle,
  type CreateRelativeValuesBundleParams,
  parseRelativeValuesBundle,
  RELATIVE_VALUES_BUNDLE_VERSION,
  type RelativeValuesBundle,
  type RelativeValuesBundleMeta,
  relativeValuesBundleMetaSchema,
  type RelativeValuesBundlePair,
  relativeValuesBundleSchema,
  relativeValuesCacheFromBundle,
  stringifyRelativeValuesBundle,
} from "./values/bundle.js";
export {
  RELATIVE_VALUES_CSV_ERROR,
  RELATIVE_VALUES_CSV_METRICS,
  relativeValuesBundleToCsv,
  type RelativeValuesCsvMetric,
  type RelativeValuesCsvOptions,
} from "./values/csv.js";
export {
  PAIR_CHARTS_SOURCE_ID,
  pairChartsCode,
  relativeValuesPairCharts,
} from "./values/pairCharts.js";
export { hasInvalid } from "./values/value.js";
export { cartesianProduct, yieldToEventLoop } from "./lib/utils.js";

// Squiggle convention
export {
  defaultClusterColors,
  looksLikeRelativeValuesSpec,
  type RelativeValuesComparison,
  type RelativeValuesSpec,
  relativeValuesSpecFromSqValue,
} from "./spec/fromSqValue.js";
export {
  findRelativeValuesExports,
  type RelativeValuesExport,
  relativeValuesSpecFromCode,
} from "./spec/findExports.js";
