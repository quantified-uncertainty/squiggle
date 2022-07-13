import { Distribution, result, squiggleExpression } from "@quri/squiggle-lang";
import { flattenResult, resultBind } from "./utility";

export type LabeledDistribution = { name: string; distribution: Distribution };

export type Plot = {
  distributions: LabeledDistribution[];
};

function error<a, b>(err: b): result<a, b> {
  return { tag: "Error", value: err };
}

function ok<a, b>(x: a): result<a, b> {
  return { tag: "Ok", value: x };
}

function parseString(expr: squiggleExpression): result<string, string> {
  if (expr.tag === "string") {
    return ok(expr.value);
  } else {
    return error("Expression was not string");
  }
}

function parseRecord(
  expr: squiggleExpression
): result<{ [key: string]: squiggleExpression }, string> {
  if (expr.tag === "record") {
    return ok(expr.value);
  } else {
    return error("Expression was not a record");
  }
}

function parseDistribution(
  expr: squiggleExpression
): result<Distribution, string> {
  if (expr.tag === "distribution") {
    return ok(expr.value);
  } else {
    return error("Expression was not a distribution");
  }
}

function parseArray(
  expr: squiggleExpression
): result<squiggleExpression[], string> {
  if (expr.tag === "array") {
    return ok(expr.value);
  } else {
    return error("Expression was not a distribution");
  }
}

function parseField<a>(
  record: { [key: string]: squiggleExpression },
  field: string,
  parser: (expr: squiggleExpression) => result<a, string>
): result<a, string> {
  if (record[field]) {
    return parser(record[field]);
  } else {
    return error("record does not have field " + field);
  }
}

function parseLabeledDistribution(
  x: squiggleExpression
): result<LabeledDistribution, string> {
  return resultBind(parseRecord(x), (record) =>
    resultBind(parseField(record, "name", parseString), (name) =>
      resultBind(
        parseField(record, "distribution", parseDistribution),
        (distribution) => ok({ name, distribution })
      )
    )
  );
}

export function parsePlot(record: {
  [key: string]: squiggleExpression;
}): result<Plot, string> {
  return resultBind(parseField(record, "distributions", parseArray), (array) =>
    resultBind(
      flattenResult(array.map(parseLabeledDistribution)),
      (distributions) => ok({ distributions })
    )
  );
}
