import { SDuration } from "../../index.js";
import { result } from "../../utility/result.js";
import { SDate } from "../../utility/SDate.js";
import { Value } from "../../value/index.js";
import {
  removeLambdas,
  simpleValueFromValue,
  simpleValueToJson,
} from "../../value/simpleValue.js";
import { vCalculator } from "../../value/VCalculator.js";
import { vDate } from "../../value/VDate.js";
import { vLambda } from "../../value/vLambda.js";
import { vNumber } from "../../value/VNumber.js";
import { vString } from "../../value/VString.js";
import { SqError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValuePath } from "../SqValuePath.js";
import { SqArray } from "./SqArray.js";
import { SqCalculator } from "./SqCalculator.js";
import { SqDict } from "./SqDict.js";
import { SqDistribution, wrapDistribution } from "./SqDistribution/index.js";
import {
  SqDateRangeDomain,
  SqNumericRangeDomain,
  wrapDomain,
} from "./SqDomain.js";
import { SqInput, wrapInput } from "./SqInput.js";
import { SqLambda } from "./SqLambda.js";
import { SqDistributionsPlot, SqPlot, wrapPlot } from "./SqPlot.js";
import { SqScale, wrapScale } from "./SqScale.js";
import { SqSpecification } from "./SqSpecification.js";
import { SqTableChart } from "./SqTableChart.js";
import { SqTags } from "./SqTags.js";

function valueToJSON(value: Value): unknown {
  return simpleValueToJson(removeLambdas(simpleValueFromValue(value)));
}

export function wrapValue(value: Value, context?: SqValueContext) {
  switch (value.type) {
    case "Array":
      return new SqArrayValue(value, context);
    case "Bool":
      return new SqBoolValue(value, context);
    case "Date":
      return new SqDateValue(value, context);
    case "Dist":
      return new SqDistributionValue(value, context);
    case "Lambda":
      return new SqLambdaValue(value, context);
    case "Number":
      return new SqNumberValue(value, context);
    case "Dict":
      return new SqDictValue(value, context);
    case "String":
      return new SqStringValue(value, context);
    case "Plot":
      return new SqPlotValue(value, context);
    case "TableChart":
      return new SqTableChartValue(value, context);
    case "Calculator":
      return new SqCalculatorValue(value, context);
    case "Scale":
      return new SqScaleValue(value, context);
    case "Duration":
      return new SqDurationValue(value, context);
    case "Void":
      return new SqVoidValue(value, context);
    case "Domain":
      return new SqDomainValue(value, context);
    case "Input":
      return new SqInputValue(value, context);
    case "Specification":
      return new SqSpecificationValue(value, context);
    default:
      throw new Error(`Unknown value ${JSON.stringify(value satisfies never)}`);
  }
}

export function prefixPathDiff(
  pathSet: SqValuePath[],
  pathSetToRemove: SqValuePath[]
): SqValuePath[] {
  let result = [...pathSet];
  // Go through each item of pathSetToRemove. If it's the first remaining item in result, remove it.

  for (const pathToRemove of pathSetToRemove) {
    if (result.length === 0) {
      break;
    }

    if (result[0].isEqual(pathToRemove)) {
      result = result.slice(1);
    }
  }

  return result;
}

export abstract class SqAbstractValue<Type extends string, JSType, ValueType> {
  abstract tag: Type;

  constructor(
    public _value: Extract<Value, { type: Type }>,
    public context?: SqValueContext
  ) {}

  get tags() {
    return new SqTags(this._value.getTags(), this.context);
  }

  toString() {
    return this._value.toString();
  }

  publicName() {
    return this._value.publicName;
  }

  title(): string | undefined {
    return undefined;
  }

  abstract asJS(): JSType;

  abstract get value(): ValueType;

  private walkLastEdge(
    path: SqValuePath,
    traverseCalculatorEdge: (path: SqValuePath) => SqValue | undefined
  ): SqValue | undefined {
    const { context } = this;
    if (!context) {
      return;
    }
    const pathEdge = path.lastItem()!; // We know it's not empty, because includeRoot is false.

    const pathEdgeType = pathEdge.value.type;

    if (this.tag === "Array" && pathEdgeType === "index") {
      return (this as SqArrayValue).value.getValues()[pathEdge.value.value];
    } else if (this.tag === "Dict" && pathEdgeType === "key") {
      return (this as SqDictValue).value.get(pathEdge.value.value);
    } else if (this.tag === "TableChart" && pathEdgeType === "cellAddress") {
      // Maybe it would be better to get the environment in a different way.
      const environment = context.project.getEnvironment();
      const item = (this as SqTableChartValue).value.item(
        pathEdge.value.value.row,
        pathEdge.value.value.column,
        environment
      );
      return item.ok ? item.value : undefined;
    } else if (pathEdge.type === "calculator") {
      return traverseCalculatorEdge(path);
    }
    return;
  }

  getSubvalueByPath(
    subValuePath: SqValuePath,
    traverseCalculatorEdge: (path: SqValuePath) => SqValue | undefined
  ) {
    {
      let currentNodeValue = this as SqValue;

      const subValuePaths = subValuePath.allPrefixPaths({
        includeRoot: false,
      });

      const pathEdges = this.context?.path;

      const diffPaths = pathEdges
        ? prefixPathDiff(
            subValuePaths,
            pathEdges.allPrefixPaths({ includeRoot: false })
          )
        : subValuePaths;

      for (const subValuePath of diffPaths) {
        const nextValue = currentNodeValue.walkLastEdge(
          subValuePath,
          traverseCalculatorEdge
        );
        if (!nextValue) {
          return;
        } else {
          currentNodeValue = nextValue;
        }
      }
      return currentNodeValue;
    }
  }
}

export class SqArrayValue extends SqAbstractValue<"Array", unknown[], SqArray> {
  tag = "Array" as const;

  get value() {
    return new SqArray(this._value.value, this.context);
  }

  asJS(): unknown[] {
    return this._value.value.map(valueToJSON);
  }
}

export class SqBoolValue extends SqAbstractValue<"Bool", boolean, boolean> {
  tag = "Bool" as const;

  get value(): boolean {
    return this._value.value;
  }

  asJS(): boolean {
    return this.value;
  }
}

export class SqDateValue extends SqAbstractValue<"Date", unknown, SDate> {
  tag = "Date" as const;

  static create(value: SDate) {
    return new SqDateValue(vDate(value));
  }

  static fromNumber(value: number) {
    return SqDateValue.create(SDate.fromMs(value));
  }

  get value(): SDate {
    return this._value.value;
  }

  asJS() {
    return valueToJSON(this._value);
  }
}

export class SqDistributionValue extends SqAbstractValue<
  "Dist",
  unknown,
  SqDistribution
> {
  tag = "Dist" as const;

  get value() {
    return wrapDistribution(this._value.value);
  }

  showAsPlot(): SqDistributionsPlot | undefined {
    const showAs = this.tags.showAs();
    return showAs &&
      showAs.tag === "Plot" &&
      showAs.value.tag === "distributions"
      ? showAs.value
      : undefined;
  }

  asJS() {
    return valueToJSON(this._value);
  }
}

export class SqLambdaValue extends SqAbstractValue<
  "Lambda",
  unknown,
  SqLambda
> {
  tag = "Lambda" as const;

  static create(value: SqLambda) {
    return new SqLambdaValue(vLambda(value._value));
  }

  get value() {
    return new SqLambda(this._value.value, this.context);
  }

  asJS() {
    return simpleValueFromValue(this._value);
  }

  toCalculator(): SqCalculatorValue | undefined {
    const calc = this.value._value.toCalculator();
    return calc
      ? new SqCalculatorValue(vCalculator(calc), this.context)
      : undefined;
  }
}

export class SqNumberValue extends SqAbstractValue<"Number", number, number> {
  tag = "Number" as const;

  static create(value: number) {
    return new SqNumberValue(vNumber(value));
  }

  get value(): number {
    return this._value.value;
  }

  asJS(): number {
    return this.value;
  }
}

export class SqDictValue extends SqAbstractValue<"Dict", unknown, SqDict> {
  tag = "Dict" as const;

  get value() {
    return new SqDict(this._value, this.context);
  }

  asJS() {
    return valueToJSON(this._value);
  }
}

export class SqStringValue extends SqAbstractValue<"String", string, string> {
  tag = "String" as const;

  static create(value: string) {
    return new SqStringValue(vString(value));
  }

  get value(): string {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqDurationValue extends SqAbstractValue<
  "Duration",
  number,
  SDuration
> {
  tag = "Duration" as const;

  get value() {
    return this._value.value;
  }

  toUnitAndNumber() {
    return this._value.value.toUnitAndNumber();
  }

  asJS() {
    return this._value.value.toMs();
  }
}

export class SqPlotValue extends SqAbstractValue<"Plot", unknown, SqPlot> {
  tag = "Plot" as const;

  get value() {
    return wrapPlot(this._value.value, this.context);
  }

  override title() {
    return this.value.title;
  }

  asJS() {
    return valueToJSON(this._value);
  }
}
export class SqTableChartValue extends SqAbstractValue<
  "TableChart",
  unknown,
  SqTableChart
> {
  tag = "TableChart" as const;

  get value() {
    return new SqTableChart(this._value.value, this.context);
  }

  asJS() {
    return valueToJSON(this._value);
  }
}
export class SqCalculatorValue extends SqAbstractValue<
  "Calculator",
  unknown,
  SqCalculator
> {
  tag = "Calculator" as const;

  get value() {
    return new SqCalculator(this._value.value, this.context);
  }

  asJS() {
    return simpleValueFromValue(this._value);
  }

  override title() {
    return this.value.title;
  }
}

export class SqScaleValue extends SqAbstractValue<"Scale", unknown, SqScale> {
  tag = "Scale" as const;

  get value() {
    return wrapScale(this._value.value);
  }

  asJS() {
    return valueToJSON(this._value);
  }
}

export class SqInputValue extends SqAbstractValue<"Input", unknown, SqInput> {
  tag = "Input" as const;

  get value() {
    return wrapInput(this._value.value);
  }

  asJS() {
    return valueToJSON(this._value);
  }
}

export class SqVoidValue extends SqAbstractValue<"Void", null, null> {
  tag = "Void" as const;

  get value() {
    return null;
  }

  asJS() {
    return null;
  }
}

export class SqDomainValue extends SqAbstractValue<
  "Domain",
  unknown,
  SqNumericRangeDomain | SqDateRangeDomain
> {
  tag = "Domain" as const;

  get value() {
    return wrapDomain(this._value.value);
  }

  asJS() {
    return valueToJSON(this._value);
  }
}

export class SqSpecificationValue extends SqAbstractValue<
  "Specification",
  unknown,
  SqSpecification
> {
  tag = "Specification" as const;

  get value() {
    return new SqSpecification(this._value.value, this.context);
  }

  asJS() {
    return simpleValueFromValue(this._value);
  }

  override title() {
    return this.value.name;
  }
}

export type SqValue = ReturnType<typeof wrapValue>;

export function toStringResult(result: result<SqValue, SqError>) {
  return `${result.ok ? "Ok" : "Error"}(${result.value.toString()})`;
}
