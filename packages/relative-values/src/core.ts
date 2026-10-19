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
  type CreateModelEvaluatorOptions,
  extractOkValues,
  getParamPercentiles,
  ModelEvaluator,
  type ModelEvaluatorOptions,
} from "./values/ModelEvaluator.js";
export { hasInvalid } from "./values/value.js";
export { cartesianProduct } from "./lib/utils.js";

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
