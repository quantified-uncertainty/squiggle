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
  type LoadedRelativeValuesBundle,
  loadRelativeValuesBundle,
} from "./values/loadBundle.js";
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

// Host-control state (see README, "Customizing in your app")
export * from "./state/index.js";
