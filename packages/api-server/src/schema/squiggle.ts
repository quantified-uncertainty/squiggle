import {
  SqAbstractDistribution,
  SqError,
  SqProject,
  SqRecord,
  SqValue,
  result,
} from "@quri/squiggle-lang";

import { builder } from "../builder.js";

type T = result<{ result: SqValue; bindings: SqRecord }, SqError>;

const SquiggleOkResult =
  builder.objectRef<Extract<T, { ok: true }>>("SquiggleOkResult");

const SquiggleErrorResult = builder.objectRef<Extract<T, { ok: false }>>(
  "SquiggleErrorResult"
);

const squiggleValueToJSON = (value: SqValue) => {
  return JSON.stringify(value.asJS(), (key, value) => {
    if (value instanceof Map) {
      return Object.fromEntries(value.entries());
    }
    if (value instanceof SqAbstractDistribution) {
      return value.toString();
    }
    return value;
  });
};

const SquiggleOkResultObj = builder.objectType(SquiggleOkResult, {
  fields: (t) => ({
    resultJSON: t.string({
      resolve(obj) {
        return squiggleValueToJSON(obj.value.result);
      },
    }),
    bindingsJSON: t.string({
      resolve(obj) {
        return squiggleValueToJSON(obj.value.bindings.asValue());
      },
    }),
  }),
});

const SquiggleErrorResultObj = builder.objectType(SquiggleErrorResult, {
  fields: (t) => ({
    errorString: t.string({
      resolve(result) {
        return result.value.toString();
      },
    }),
  }),
});

const SquiggleResultObj = builder.unionType("SquiggleResult", {
  types: [SquiggleOkResultObj, SquiggleErrorResultObj],
  resolveType: (result) => {
    return result.ok ? SquiggleOkResultObj : SquiggleErrorResultObj;
  },
});

builder.queryField("runSquiggle", (t) =>
  t.field({
    type: SquiggleResultObj,
    args: {
      code: t.arg.string({ required: true }),
    },
    resolve(_, args) {
      const project = SqProject.create();

      const MAIN = "main";
      project.setSource(MAIN, args.code);
      project.run(MAIN);
      const result = project.getResult(MAIN);
      if (result.ok) {
        return {
          ok: true,
          value: {
            result: result.value,
            bindings: project.getBindings(MAIN),
          },
        } as const;
      } else {
        return {
          ok: false,
          value: result.value,
        } as const;
      }
    },
  })
);
