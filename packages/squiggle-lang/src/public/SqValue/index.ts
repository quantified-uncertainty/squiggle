import { result } from "../../utility/result.js";
import { SDate } from "../../utility/SDate.js";
import {
  Value,
  vCalculator,
  vDate,
  vLambda,
  vNumber,
  vString,
} from "../../value/index.js";
import { SqError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqArray } from "./SqArray.js";
import { SqCalculator } from "./SqCalculator.js";
import { SqDict } from "./SqDict.js";
import { SqDistribution, wrapDistribution } from "./SqDistribution/index.js";
import { SqDomain, wrapDomain } from "./SqDomain.js";
import { SqInput, wrapInput } from "./SqInput.js";
import { SqLambda } from "./SqLambda.js";
import { SqDistributionsPlot, SqPlot, wrapPlot } from "./SqPlot.js";
import { SqScale, wrapScale } from "./SqScale.js";
import { SqTableChart } from "./SqTableChart.js";
import { SqTags } from "./SqTags.js";

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
    default:
      throw new Error(`Unknown value ${JSON.stringify(value satisfies never)}`);
  }
}

export abstract class SqAbstractValue<Type extends string, JSType> {
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
}

export class SqArrayValue extends SqAbstractValue<"Array", unknown[]> {
  tag = "Array" as const;

  get value() {
    return new SqArray(this._value.value, this.context);
  }

  asJS(): unknown[] {
    return this.value.getValues().map((value) => value.asJS());
  }
}

export class SqBoolValue extends SqAbstractValue<"Bool", boolean> {
  tag = "Bool" as const;

  get value(): boolean {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqDateValue extends SqAbstractValue<"Date", Date> {
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

  //Note: This reveals the underlying Date object, but we might prefer to keep it hidden
  asJS() {
    return this.value.toDate();
  }
}

export class SqDistributionValue extends SqAbstractValue<
  "Dist",
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

  xScale(): SqScale | undefined {
    return this.tags.xScale();
  }

  yScale(): SqScale | undefined {
    return this.tags.yScale();
  }

  defaultPlot({
    defaultXScale,
    defaultYScale,
    showSummary,
  }: {
    defaultXScale: SqScale;
    defaultYScale: SqScale;
    showSummary: boolean;
  }): SqDistributionsPlot {
    const showAsPlot = this.showAsPlot();
    const xScale = this.xScale() || defaultXScale;
    const yScale = this.yScale() || defaultYScale;
    if (showAsPlot) {
      return SqDistributionsPlot.create({
        xScale: xScale ? showAsPlot.xScale.merge(xScale) : showAsPlot.xScale,
        yScale: yScale ? showAsPlot.yScale.merge(yScale) : showAsPlot.yScale,
        showSummary,
        distribution: this.value,
      });
    } else {
      return SqDistributionsPlot.create({
        xScale,
        yScale,
        showSummary,
        distribution: this.value,
      });
    }
  }

  asJS() {
    return this.value; // should we return BaseDist instead?
  }
}

export class SqLambdaValue extends SqAbstractValue<"Lambda", SqLambda> {
  tag = "Lambda" as const;

  static create(value: SqLambda) {
    return new SqLambdaValue(vLambda(value._value));
  }

  get value() {
    return new SqLambda(this._value.value, this.context);
  }

  asJS() {
    return this.value; // SqLambda is nicer than internal Lambda, so we use that
  }

  toCalculator(): SqCalculatorValue | undefined {
    const calc = this.value._value.toCalculator();
    return calc
      ? new SqCalculatorValue(vCalculator(calc), this.context)
      : undefined;
  }
}

export class SqNumberValue extends SqAbstractValue<"Number", number> {
  tag = "Number" as const;

  static create(value: number) {
    return new SqNumberValue(vNumber(value));
  }

  get value(): number {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqDictValue extends SqAbstractValue<"Dict", Map<string, unknown>> {
  tag = "Dict" as const;

  get value() {
    return new SqDict(this._value.value, this.context);
  }

  asJS(): Map<string, unknown> {
    return new Map(this.value.entries().map(([k, v]) => [k, v.asJS()])); // this is a native Map, not immutable Map
  }
}

export class SqStringValue extends SqAbstractValue<"String", string> {
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

export class SqDurationValue extends SqAbstractValue<"Duration", number> {
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

export class SqPlotValue extends SqAbstractValue<"Plot", SqPlot> {
  tag = "Plot" as const;

  get value() {
    return wrapPlot(this._value.value, this.context);
  }

  override title() {
    return this.value.title;
  }

  asJS() {
    return this.value;
  }
}
export class SqTableChartValue extends SqAbstractValue<
  "TableChart",
  SqTableChart
> {
  tag = "TableChart" as const;

  get value() {
    return new SqTableChart(this._value.value, this.context);
  }

  asJS() {
    return this.value;
  }
}
export class SqCalculatorValue extends SqAbstractValue<
  "Calculator",
  SqCalculator
> {
  tag = "Calculator" as const;

  get value() {
    return new SqCalculator(this._value.value, this.context);
  }

  asJS() {
    return this.value;
  }

  override title() {
    return this.value.title;
  }
}

export class SqScaleValue extends SqAbstractValue<"Scale", SqScale> {
  tag = "Scale" as const;

  get value() {
    return wrapScale(this._value.value);
  }

  asJS() {
    return this.value;
  }
}

export class SqInputValue extends SqAbstractValue<"Input", SqInput> {
  tag = "Input" as const;

  get value() {
    return wrapInput(this._value.value);
  }

  asJS() {
    return this.value;
  }
}

export class SqVoidValue extends SqAbstractValue<"Void", null> {
  tag = "Void" as const;

  get value() {
    return null;
  }

  asJS() {
    return null;
  }
}

export class SqDomainValue extends SqAbstractValue<"Domain", SqDomain> {
  tag = "Domain" as const;

  get value() {
    return wrapDomain(this._value.value);
  }

  asJS() {
    return this.value;
  }
}

export type SqValue = ReturnType<typeof wrapValue>;

export function toStringResult(result: result<SqValue, SqError>) {
  return `${result.ok ? "Ok" : "Error"}(${result.value.toString()})`;
}
