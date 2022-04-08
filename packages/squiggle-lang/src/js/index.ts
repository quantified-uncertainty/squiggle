import * as _ from 'lodash';
import {evaluate} from '../rescript/Reducer/Reducer.gen';
import type { expressionValue } from '../rescript/Reducer/Reducer_Expression/Reducer_Expression.gen';
import type { pointSetDist } from '../rescript/Distributions/PointSetDist/PointSetTypes.gen';
import type { genericDist } from '../rescript/Distributions/GenericDist/GenericDist_Types.gen';
import { errorToString } from '../rescript/Reducer/Reducer_ErrorValue.gen';
import { toPointSet, inv } from '../rescript/Distributions/GenericDist/GenericDist.gen';
import type { Inputs_SamplingInputs_t as SamplingInputs, exportEnv, exportDistribution} from '../rescript/ProgramEvaluator.gen';
export type { SamplingInputs, exportEnv, exportDistribution, tsExport }

export let defaultSamplingInputs : SamplingInputs = {
  sampleCount : 10000,
  outputXYPoints : 10000,
  pointDistLength : 1000
}

type taggedOption<tag,value> = {
  tag: tag,
  value: value
}

function tagOption<T, V>(tag : T, value: V): taggedOption<T,V> {
  return { tag: tag, value: value};
}
type tsExport = taggedOption<"string", string> | taggedOption<"symbol", string> | taggedOption<"number", number> | taggedOption<"boolean", boolean> | taggedOption<"distribution", Distribution> | taggedOption<"array", tsExport[]> | taggedOption<"record", {[key: string]: tsExport}> | taggedOption<"function", (x: number) => tsExport>

// This is here mainly for testing purposes
export function exportToString(result : tsExport) : string{
  if(result.tag === "string"){
    return `"${result.value}"`
  }
  else if(result.tag === "boolean"){
    return `${result.value}`
  }
  else if(result.tag === "array"){
    return `[${result.value.map(exportToString).join(", ")}]`
  }
  else if(result.tag === "distribution"){
    return result.value.toString()
  }
  else if(result.tag === "number"){
    return `${result.value}`
  }
  else if(result.tag === "symbol"){
    return `${result.value}`
  }
  else if(result.tag === "record"){
    return `${_.mapValues(result.value, exportToString)}`
  }
}

function expressionValueToValue(value : expressionValue, samplingInputs: SamplingInputs) : tsExport {
  if(value.tag == "EvArray"){
    return tagOption("array", value.value.map((val) => expressionValueToValue(val,samplingInputs)));
  }else if (value.tag == "EvBool"){
    return tagOption("boolean", value.value)
  }
  else if(value.tag == "EvDistribution"){
    return tagOption("distribution", new Distribution(value.value, samplingInputs));
  }
  else if(value.tag == "EvNumber"){
    return tagOption("number", value.value);
  }
  else if(value.tag == "EvString"){
    return tagOption("string", value.value);
  }
  else if(value.tag == "EvSymbol"){
    return tagOption("symbol", value.value);
  }
  else if(value.tag == "EvRecord"){
    return tagOption("record", _.mapValues(value.value, (val) => expressionValueToValue(val, samplingInputs)));
  }
}

export function run(squiggleString : string, samplingInputs : SamplingInputs = defaultSamplingInputs, _environment?: exportEnv): tsExport[] {
  let result = evaluate(squiggleString);
  if(result.tag == "Ok"){
    return [expressionValueToValue(result.value, samplingInputs)];
  }
  else{
    throw Error(errorToString(result.value));
  }
}

class Distribution {
  dist: genericDist
  samplingInputs : SamplingInputs
  constructor(dist : genericDist, samplingInputs: SamplingInputs){
    this.dist = dist;
    this.samplingInputs = samplingInputs;
  }

  pointShape() {
    let pointSet = toPointSet({xyPointLength: this.samplingInputs.outputXYPoints, sampleCount: this.samplingInputs.sampleCount}, this.dist)
    if(pointSet.tag == "Ok"){
      return new Shape(pointSet.value);
    }
  }

  inv(x: number): number{
    let result= inv(this.dist, x)
    if (result.tag == "Ok") {
      return result.value;
    }
    else {
      throw Error(result.value.toString())
    }
  }

  toString(): string {
    return "Todo"
  }
}

type point = { x: number, y: number, cdf: number}
class Shape {
  shape : pointSetDist
  constructor(shape : pointSetDist){
    this.shape = shape;
  }

  discretePoints(): point[]{
    let discreteShape = undefined;
    if(this.shape.tag == "Discrete"){
      discreteShape = this.shape.value;
    } else if (this.shape.tag == "Mixed"){
      discreteShape = this.shape.value.discrete;
    }
    if(discreteShape !== undefined) {
      return _.zipWith(discreteShape.xyShape.xs, discreteShape.xyShape.ys, discreteShape.integralCache.xyShape.ys, (x, y, c) => ({x, y, cdf: c}))
    }
    else {
      return []
    }
  }

  continuousPoints(): point[]{
    let continuousShape = undefined;
    console.log(this.shape.tag)
    if(this.shape.tag == "Continuous"){
      continuousShape = this.shape.value;
    } else if (this.shape.tag == "Mixed"){
      continuousShape = this.shape.value.continuous;
    }
    if(continuousShape !== undefined) {
      return _.zipWith(continuousShape.xyShape.xs, continuousShape.xyShape.ys, continuousShape.integralCache.xyShape.ys, (x, y, c) => ({x, y, cdf: c}))
    }
    else {
      return []
    }
  }

}
