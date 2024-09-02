import { LocationRange } from "../ast/types.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import {
  AnyExpressionIR,
  IR,
  IRContent,
  IRContentByKind,
  LambdaIRParameter,
  StatementIR,
} from "./types.js";

type SerializedLambdaIRParameter = Omit<LambdaIRParameter, "annotation"> & {
  annotation?: number;
};

type SerializedIRContentByKindGeneric<
  K extends IRContent["kind"],
  ReplaceValue,
> = Omit<IRContentByKind<K>, "value"> & {
  value: ReplaceValue;
};

type SerializedIRContentByKindObjectLike<
  K extends IRContent["kind"],
  SkipFields extends keyof IRContentByKind<K>["value"],
  ReplaceFields,
> = Omit<IRContentByKind<K>, "value"> & {
  value: Omit<IRContentByKind<K>["value"], SkipFields> & ReplaceFields;
};

export type SerializedIRContent =
  | Exclude<
      IRContent,
      {
        kind:
          | "Value"
          | "Program"
          | "Block"
          | "Ternary"
          | "Assign"
          | "Call"
          | "Lambda"
          | "Array"
          | "Dict";
      }
    >
  | SerializedIRContentByKindGeneric<"Value", number>
  | SerializedIRContentByKindObjectLike<
      "Block",
      "statements" | "result",
      {
        statements: number[];
        result: number;
      }
    >
  | SerializedIRContentByKindObjectLike<
      "Program",
      "statements" | "result",
      {
        statements: number[];
        result: number | null;
      }
    >
  | SerializedIRContentByKindObjectLike<
      "Ternary",
      "condition" | "ifTrue" | "ifFalse",
      {
        condition: number;
        ifTrue: number;
        ifFalse: number;
      }
    >
  | SerializedIRContentByKindObjectLike<
      "Assign",
      "right",
      {
        right: number;
      }
    >
  | SerializedIRContentByKindObjectLike<
      "Call",
      "fn" | "args",
      {
        fn: number;
        args: number[];
      }
    >
  | SerializedIRContentByKindObjectLike<
      "Lambda",
      "parameters" | "body",
      {
        parameters: SerializedLambdaIRParameter[];
        body: number;
      }
    >
  | SerializedIRContentByKindGeneric<"Array", number[]>
  | SerializedIRContentByKindGeneric<"Dict", [number, number][]>;

export type SerializedIR = SerializedIRContent & {
  location: LocationRange;
};

function serializeIRContent(
  ir: IRContent,
  visit: SquiggleSerializationVisitor
): SerializedIRContent {
  switch (ir.kind) {
    case "Value":
      return {
        ...ir,
        value: visit.value(ir.value),
      };
    case "Program":
      return {
        ...ir,
        value: {
          ...ir.value,
          statements: ir.value.statements.map(visit.ir),
          result: ir.value.result ? visit.ir(ir.value.result) : null,
        },
      };
    case "Block":
      return {
        ...ir,
        value: {
          statements: ir.value.statements.map(visit.ir),
          result: visit.ir(ir.value.result),
        },
      };
    case "Ternary":
      return {
        ...ir,
        value: {
          ...ir.value,
          condition: visit.ir(ir.value.condition),
          ifTrue: visit.ir(ir.value.ifTrue),
          ifFalse: visit.ir(ir.value.ifFalse),
        },
      };
    case "Assign":
      return {
        ...ir,
        value: {
          ...ir.value,
          right: visit.ir(ir.value.right),
        },
      };

    case "Call":
      return {
        ...ir,
        value: {
          ...ir.value,
          fn: visit.ir(ir.value.fn),
          args: ir.value.args.map(visit.ir),
        },
      };
    case "Lambda":
      return {
        ...ir,
        value: {
          ...ir.value,
          parameters: ir.value.parameters.map((parameter) => ({
            ...parameter,
            annotation: parameter.annotation
              ? visit.ir(parameter.annotation)
              : undefined,
          })),
          body: visit.ir(ir.value.body),
        },
      };
    case "Array":
      return {
        ...ir,
        value: ir.value.map((value) => visit.ir(value)),
      };
    case "Dict":
      return {
        ...ir,
        value: ir.value.map(
          ([key, value]) => [visit.ir(key), visit.ir(value)] as [number, number]
        ),
      };
    default:
      return ir;
  }
}

export function serializeIR(ir: IR, visit: SquiggleSerializationVisitor) {
  return {
    ...serializeIRContent(ir, visit),
    location: ir.location,
  };
}

function assertStatement(ir: IR): StatementIR {
  if (ir.kind !== "Assign") {
    throw new Error("Expected statement");
  }
  return ir;
}

export function assertExpression(ir: IR): AnyExpressionIR {
  if (ir.kind === "Program" || ir.kind === "Assign") {
    throw new Error("Expected expression");
  }
  return ir;
}

function deserializeIRContent(
  ir: SerializedIR,
  visit: SquiggleDeserializationVisitor
): IRContent {
  switch (ir.kind) {
    case "Value":
      return {
        ...ir,
        value: visit.value(ir.value),
      };
    case "Program":
      return {
        ...ir,
        value: {
          ...ir.value,
          statements: ir.value.statements.map((statement) =>
            assertStatement(visit.ir(statement))
          ),
          result:
            ir.value.result === null
              ? undefined
              : assertExpression(visit.ir(ir.value.result)),
        },
      };

    case "Block":
      return {
        ...ir,
        value: {
          statements: ir.value.statements.map((id) =>
            assertStatement(visit.ir(id))
          ),
          result: assertExpression(visit.ir(ir.value.result)),
        },
      };
    case "Ternary":
      return {
        ...ir,
        value: {
          ...ir.value,
          condition: assertExpression(visit.ir(ir.value.condition)),
          ifTrue: assertExpression(visit.ir(ir.value.ifTrue)),
          ifFalse: assertExpression(visit.ir(ir.value.ifFalse)),
        },
      };
    case "Assign":
      return {
        ...ir,
        value: {
          ...ir.value,
          right: assertExpression(visit.ir(ir.value.right)),
        },
      };
    case "Call":
      return {
        ...ir,
        value: {
          ...ir.value,
          fn: assertExpression(visit.ir(ir.value.fn)),
          args: ir.value.args.map((arg) => assertExpression(visit.ir(arg))),
        },
      };
    case "Lambda":
      return {
        ...ir,
        value: {
          ...ir.value,
          parameters: ir.value.parameters.map((parameter) => ({
            ...parameter,
            annotation: parameter.annotation
              ? assertExpression(visit.ir(parameter.annotation))
              : undefined,
          })),
          body: assertExpression(visit.ir(ir.value.body)),
        },
      };
    case "Array":
      return {
        ...ir,
        value: ir.value.map((value) => assertExpression(visit.ir(value))),
      };
    case "Dict":
      return {
        ...ir,
        value: ir.value.map(
          ([key, value]) =>
            [
              assertExpression(visit.ir(key)),
              assertExpression(visit.ir(value)),
            ] as [AnyExpressionIR, AnyExpressionIR]
        ),
      };
    default:
      return ir;
  }
}

export function deserializeIR(
  ir: SerializedIR,
  visit: SquiggleDeserializationVisitor
): IR {
  return {
    ...deserializeIRContent(ir, visit),
    location: ir.location,
  };
}
