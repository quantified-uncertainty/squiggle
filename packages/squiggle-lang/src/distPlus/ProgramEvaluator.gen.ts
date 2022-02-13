/* TypeScript file generated from ProgramEvaluator.res by genType. */
/* eslint-disable import/first */


const $$toJS431202589: { [key: string]: any } = {"0": "Complete"};

// @ts-ignore: Implicit any on import
const ProgramEvaluatorBS = require('./ProgramEvaluator.bs');

import type {t as DistPlus_t} from '../../src/distPlus/distribution/DistPlus.gen';

// tslint:disable-next-line:interface-over-type-literal
export type exportType = 
    { NAME: "DistPlus"; VAL: DistPlus_t }
  | { NAME: "Float"; VAL: number }
  | { NAME: "Function"; VAL: (_1:number) => 
    { tag: "Ok"; value: DistPlus_t }
  | { tag: "Error"; value: string } };

export const runAll: (squiggleString:string) => 
    { tag: "Ok"; value: exportType[] }
  | { tag: "Error"; value: string } = function (Arg1: any) {
  const result = ProgramEvaluatorBS.runAll(Arg1);
  return result.TAG===0
    ? {tag:"Ok", value:result._0.map(function _element(ArrayItem: any) { return ArrayItem.NAME==="DistPlus"
    ? {NAME:"DistPlus", VAL:{shape:ArrayItem.VAL.shape.TAG===0
    ? {tag:"Mixed", value:ArrayItem.VAL.shape._0}
    : ArrayItem.VAL.shape.TAG===1
    ? {tag:"Discrete", value:ArrayItem.VAL.shape._0}
    : {tag:"Continuous", value:ArrayItem.VAL.shape._0}, domain:typeof(ArrayItem.VAL.domain) === 'object'
    ? ArrayItem.VAL.domain.TAG===0
      ? {tag:"LeftLimited", value:ArrayItem.VAL.domain._0}
      : ArrayItem.VAL.domain.TAG===1
      ? {tag:"RightLimited", value:ArrayItem.VAL.domain._0}
      : {tag:"LeftAndRightLimited", value:[ArrayItem.VAL.domain._0, ArrayItem.VAL.domain._1]}
    : $$toJS431202589[ArrayItem.VAL.domain], integralCache:ArrayItem.VAL.integralCache, unit:"UnspecifiedDistribution", squiggleString:ArrayItem.VAL.squiggleString}}
    : ArrayItem.NAME==="Float"
    ? {NAME:"Float", VAL:ArrayItem.VAL}
    : {NAME:"Function", VAL:function (Arg11: any) {
      const result1 = ArrayItem.VAL(Arg11);
      return result1.TAG===0
        ? {tag:"Ok", value:{shape:result1._0.shape.TAG===0
        ? {tag:"Mixed", value:result1._0.shape._0}
        : result1._0.shape.TAG===1
        ? {tag:"Discrete", value:result1._0.shape._0}
        : {tag:"Continuous", value:result1._0.shape._0}, domain:typeof(result1._0.domain) === 'object'
        ? result1._0.domain.TAG===0
          ? {tag:"LeftLimited", value:result1._0.domain._0}
          : result1._0.domain.TAG===1
          ? {tag:"RightLimited", value:result1._0.domain._0}
          : {tag:"LeftAndRightLimited", value:[result1._0.domain._0, result1._0.domain._1]}
        : $$toJS431202589[result1._0.domain], integralCache:result1._0.integralCache, unit:"UnspecifiedDistribution", squiggleString:result1._0.squiggleString}}
        : {tag:"Error", value:result1._0}
    }}})}
    : {tag:"Error", value:result._0}
};
