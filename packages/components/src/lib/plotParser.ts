import * as yup from "yup";
import { SqDistribution, result, SqRecord } from "@quri/squiggle-lang";

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
  .strict()
  .noUnknown()
  .shape({
    distributions: yup.object().shape({
      tag: yup.mixed().oneOf(["array"]),
      value: yup
        .array()
        .of(
          yup.object().shape({
            tag: yup.mixed().oneOf(["record"]),
            value: yup.object({
              name: yup.object().shape({
                tag: yup.mixed().oneOf(["string"]),
                value: yup.string().required(),
              }),
              // color: yup
              //   .object({
              //     tag: yup.mixed().oneOf(["string"]),
              //     value: yup.string().required(),
              //   })
              //   .default(undefined),
              distribution: yup.object({
                tag: yup.mixed().oneOf(["distribution"]),
                value: yup.mixed(),
              }),
            }),
          })
        )
        .required(),
    }),
  });

export function parsePlot(record: SqRecord): result<Plot, string> {
  try {
    const plotRecord = schema.validateSync(record);
    return ok({
      distributions: plotRecord.distributions.value.map((x) => ({
        name: x.value.name.value,
        // color: x.value.color?.value, // not supported yet
        distribution: x.value.distribution.value,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return error(message);
  }
}
