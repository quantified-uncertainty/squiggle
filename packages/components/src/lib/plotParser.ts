import * as yup from "yup";
import {
  SqValue,
  SqValueTag,
  SqDistribution,
  result,
  SqRecord,
} from "@quri/squiggle-lang";

export type LabeledDistribution = {
  name: string;
  distribution: SqDistribution;
  color?: string;
};

export type Plot = {
  distributions: LabeledDistribution[];
};

function error<a, b>(err: b): result<a, b> {
  return { tag: "Error", value: err };
}

function ok<a, b>(x: a): result<a, b> {
  return { tag: "Ok", value: x };
}

const schema = yup
  .object()
  .noUnknown()
  .strict()
  .shape({
    distributions: yup
      .array()
      .required()
      .of(
        yup.object().required().shape({
          name: yup.string().required(),
          distribution: yup.mixed().required(),
        })
      ),
  });

type JsonObject =
  | string
  | { [key: string]: JsonObject }
  | JsonObject[]
  | SqDistribution;

function toJson(val: SqValue): JsonObject {
  if (val.tag === SqValueTag.String) {
    return val.value;
  } else if (val.tag === SqValueTag.Record) {
    return toJsonRecord(val.value);
  } else if (val.tag === SqValueTag.Array) {
    return val.value.getValues().map(toJson);
  } else if (val.tag === SqValueTag.Distribution) {
    return val.value;
  } else {
    throw new Error("Could not parse object of type " + val.tag);
  }
}

function toJsonRecord(val: SqRecord): JsonObject {
  let recordObject: JsonObject = {};
  val.entries().forEach(([key, value]) => (recordObject[key] = toJson(value)));
  return recordObject;
}

export function parsePlot(record: SqRecord): result<Plot, string> {
  try {
    const plotRecord = schema.validateSync(toJsonRecord(record));
    if (plotRecord.distributions) {
      return ok({ distributions: plotRecord.distributions.map((x) => x) });
    } else {
      // I have no idea why yup's typings thinks this is possible
      return error("no distributions field. Should never get here");
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return error(message);
  }
}
