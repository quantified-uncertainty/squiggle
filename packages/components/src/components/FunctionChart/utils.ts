import range from "lodash/range";
import { SqLambda, SqValue } from "@quri/squiggle-lang";
import { FunctionChartSettings } from ".";

function rangeByCount(start: number, stop: number, count: number) {
  const step = (stop - start) / (count - 1);
  const items = range(start, stop, step);
  const result = items.concat([stop]);
  return result;
}

type Subvalue<T> = T extends SqValue["tag"]
  ? Extract<SqValue, { tag: T }>
  : never;

export function getFunctionImage<T extends Exclude<SqValue["tag"], "Void">>({
  settings,
  fn,
  valueType,
}: {
  settings: FunctionChartSettings;
  fn: SqLambda;
  valueType: T;
}) {
  const chartPointsToRender = rangeByCount(
    settings.start,
    settings.stop,
    settings.count
  );

  let functionImage: {
    x: number;
    y: Subvalue<T>["value"];
  }[] = [];
  let errors: { x: number; value: string }[] = [];

  for (const x of chartPointsToRender) {
    const result = fn.call([x]);
    if (result.ok) {
      if (result.value.tag === valueType) {
        functionImage.push({
          x,
          // This is sketchy, I'm not sure why the type check passes (it's not because of `if` guard above), might be a Typescript bug.
          // The result should be correct, though.
          y: result.value.value,
        });
      } else {
        errors.push({
          x,
          value: `This component expected outputs of type ${valueType}`,
        });
      }
    } else {
      errors.push({ x, value: result.value.toString() });
    }
  }

  return { errors, functionImage };
}
