/* TypeScript file generated from ProgramEvaluator.res by genType. */
/* eslint-disable import/first */


// @ts-ignore: Implicit any on import
import * as ProgramEvaluatorBS__Es6Import from './ProgramEvaluator.bs';
const ProgramEvaluatorBS: any = ProgramEvaluatorBS__Es6Import;

import type {ExpressionTree_environment as ExpressionTypes_ExpressionTree_environment} from '../../src/distPlus/expressionTree/ExpressionTypes.gen';

import type {ExpressionTree_node as ExpressionTypes_ExpressionTree_node} from '../../src/distPlus/expressionTree/ExpressionTypes.gen';

import type {list} from './ReasonPervasives.gen';

import type {t as DistPlus_t} from '../../src/distPlus/distribution/DistPlus.gen';

// tslint:disable-next-line:interface-over-type-literal
export type export = 
    { NAME: "DistPlus"; VAL: DistPlus_t }
  | { NAME: "Float"; VAL: number }
  | { NAME: "Function"; VAL: [[string[], ExpressionTypes_ExpressionTree_node], ExpressionTypes_ExpressionTree_environment] };

export const runAll: (squiggleString:string) => 
    { tag: "Ok"; value: list<export> }
  | { tag: "Error"; value: string } = function (Arg1: any) {
  const result = ProgramEvaluatorBS.runAll(Arg1);
  return result.TAG===0
    ? {tag:"Ok", value:result._0}
    : {tag:"Error", value:result._0}
};
