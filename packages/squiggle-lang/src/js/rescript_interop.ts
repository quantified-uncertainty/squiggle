import * as _ from "lodash";
import type {
  expressionValue,
  mixedShape,
  sampleSetDist,
  genericDist,
  environment,
  symbolicDist,
  discreteShape,
  continuousShape,
  lambdaValue,
  lambdaDeclaration,
  declarationArg,
} from "../rescript/TypescriptInterface.gen";
import { Distribution } from "./distribution";
import { tagged, tag } from "./types";
// This file is here to compensate for genType not fully recursively converting types

// Raw rescript types.
// Umur: Rescript expression values are opaque!
// export type rescriptExport =
//   | 0 // EvVoid
//   | {
//       TAG: 0; // EvArray
//       _0: rescriptExport[];
//     }
//   | {
//       TAG: 1; // EvString
//       _0: string[];
//     }
//   | {
//       TAG: 2; // EvBool
//       _0: boolean;
//     }
//   | {
//       TAG: 3; // EvCall
//       _0: string;
//     }
//   | {
//       TAG: 4; // EvDistribution
//       _0: rescriptDist;
//     }
//   | {
//       TAG: 5; // EvLambda
//       _0: lambdaValue;
//     }
//   | {
//       TAG: 6; // EvNumber
//       _0: number;
//     }
//   | {
//       TAG: 7; // EvRecord
//       _0: { [key: string]: rescriptExport };
//     }
//   | {
//       TAG: 8; // EvString
//       _0: string;
//     }
//   | {
//       TAG: 9; // EvSymbol
//       _0: string;
//     }
//   | {
//       TAG: 10; // EvDate
//       _0: Date;
//     }
//   | {
//       TAG: 11; // EvTimeDuration
//       _0: number;
//     }
//   | {
//       TAG: 12; // EvDeclaration
//       _0: rescriptLambdaDeclaration;
//     }
//   | {
//       TAG: 13; // EvTypeIdentifier
//       _0: string;
//     }
//   | {
//       TAG: 14; // EvModule
//       _0: { [key: string]: rescriptExport };
//     };

type rescriptDist =
  | { TAG: 0; _0: rescriptPointSetDist }
  | { TAG: 1; _0: sampleSetDist }
  | { TAG: 2; _0: symbolicDist };

type rescriptPointSetDist =
  | {
      TAG: 0; // Mixed
      _0: mixedShape;
    }
  | {
      TAG: 1; // Discrete
      _0: discreteShape;
    }
  | {
      TAG: 2; // ContinuousShape
      _0: continuousShape;
    };

type rescriptLambdaDeclaration = {
  readonly fn: lambdaValue;
  readonly args: rescriptDeclarationArg[];
};

type rescriptDeclarationArg =
  | {
      TAG: 0; // Float
      min: number;
      max: number;
    }
  | {
      TAG: 1; // Date
      min: Date;
      max: Date;
    };

// Umur: Squiggle expressions are opaque!
// export type squiggleExpression =
//   | tagged<"symbol", string>
//   | tagged<"string", string>
//   | tagged<"call", string>
//   | tagged<"lambda", lambdaValue>
//   | tagged<"array", squiggleExpression[]>
//   | tagged<"arraystring", string[]>
//   | tagged<"boolean", boolean>
//   | tagged<"distribution", Distribution>
//   | tagged<"number", number>
//   | tagged<"date", Date>
//   | tagged<"timeDuration", number>
//   | tagged<"lambdaDeclaration", lambdaDeclaration>
//   | tagged<"record", { [key: string]: squiggleExpression }>
//   | tagged<"type", { [key: string]: squiggleExpression }>
//   | tagged<"typeIdentifier", string>
//   | tagged<"module", { [key: string]: squiggleExpression }>
//   | tagged<"void", string>;

export { lambdaValue };

// Umur: Opaque type no conversion!
// export function convertRawToTypescript(
//   result: rescriptExport,
//   environment: environment
// ): squiggleExpression {
//   if (typeof result === "number") {
//     // EvVoid
//     return tag("void", "");
//   }
//   switch (result.TAG) {
//     case 0: // EvArray
//       return tag(
//         "array",
//         result._0.map((x) => convertRawToTypescript(x, environment))
//       );
//     case 1: // EvArrayString
//       return tag("arraystring", result._0);
//     case 2: // EvBool
//       return tag("boolean", result._0);
//     case 3: // EvCall
//       return tag("call", result._0);
//     case 4: // EvDistribution
//       return tag(
//         "distribution",
//         new Distribution(
//           convertRawDistributionToGenericDist(result._0),
//           environment
//         )
//       );
//     case 5: // EvDistribution
//       return tag("lambda", result._0);
//     case 6: // EvNumber
//       return tag("number", result._0);
//     case 7: // EvRecord
//       return tag(
//         "record",
//         _.mapValues(result._0, (x) => convertRawToTypescript(x, environment))
//       );
//     case 8: // EvString
//       return tag("string", result._0);
//     case 9: // EvSymbol
//       return tag("symbol", result._0);
//     case 10: // EvDate
//       return tag("date", result._0);
//     case 11: // EvTimeDuration
//       return tag("number", result._0);
//     case 12: // EvDeclaration
//       return tag("lambdaDeclaration", {
//         fn: result._0.fn,
//         args: result._0.args.map(convertDeclaration),
//       });
//     case 13: // EvSymbol
//       return tag("typeIdentifier", result._0);
//     case 14: // EvModule
//       return tag(
//         "module",
//         _.mapValues(result._0, (x) => convertRawToTypescript(x, environment))
//       );
//   }
// }

function convertDeclaration(
  declarationArg: rescriptDeclarationArg
): declarationArg {
  switch (declarationArg.TAG) {
    case 0: // Float
      return tag("Float", { min: declarationArg.min, max: declarationArg.max });
    case 1: // Date
      return tag("Date", { min: declarationArg.min, max: declarationArg.max });
  }
}

function convertRawDistributionToGenericDist(
  result: rescriptDist
): genericDist {
  switch (result.TAG) {
    case 0: // Point Set Dist
      switch (result._0.TAG) {
        case 0: // Mixed
          return tag("PointSet", tag("Mixed", result._0._0));
        case 1: // Discrete
          return tag("PointSet", tag("Discrete", result._0._0));
        case 2: // Continuous
          return tag("PointSet", tag("Continuous", result._0._0));
      }
    case 1: // Sample Set Dist
      return tag("SampleSet", result._0);
    case 2: // Symbolic Dist
      return tag("Symbolic", result._0);
  }
}

export type jsValue =
  | string
  | number
  | jsValue[]
  | { [key: string]: jsValue }
  | boolean;

export function jsValueToBinding(value: jsValue): rescriptExport {
  if (typeof value === "boolean") {
    return { TAG: 2, _0: value as boolean };
  } else if (typeof value === "string") {
    return { TAG: 8, _0: value as string };
  } else if (typeof value === "number") {
    return { TAG: 6, _0: value as number };
  } else if (Array.isArray(value)) {
    return { TAG: 0, _0: value.map(jsValueToBinding) };
  } else {
    // Record
    return { TAG: 7, _0: _.mapValues(value, jsValueToBinding) };
  }
}

export function jsValueToExpressionValue(value: jsValue): expressionValue {
  if (typeof value === "boolean") {
    return { tag: "EvBool", value: value as boolean };
  } else if (typeof value === "string") {
    return { tag: "EvString", value: value as string };
  } else if (typeof value === "number") {
    return { tag: "EvNumber", value: value as number };
  } else if (Array.isArray(value)) {
    return { tag: "EvArray", value: value.map(jsValueToExpressionValue) };
  } else {
    // Record
    return {
      tag: "EvRecord",
      value: _.mapValues(value, jsValueToExpressionValue),
    };
  }
}
