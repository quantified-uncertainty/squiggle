/* Untyped file generated from ProgramEvaluator.res by genType. */
/* eslint-disable */

const ProgramEvaluatorBS = require('./ProgramEvaluator.bs');

const runAll = function (Arg1) {
  const result = ProgramEvaluatorBS.runAll(Arg1);
  return result.TAG===0
    ? {tag:"Ok", value:result._0}
    : {tag:"Error", value:result._0}
};;
exports.runAll = runAll
