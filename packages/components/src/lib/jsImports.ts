type JsImportsValue =
  | number
  | string
  | JsImportsValue[]
  | {
      [k: string]: JsImportsValue;
    };

export type JsImports = {
  [k: string]: JsImportsValue;
};

const quote = (arg: string) => `"${arg.replace(new RegExp('"', "g"), '\\"')}"`;

const jsImportsValueToSquiggleCode = (v: JsImportsValue): string => {
  if (typeof v === "number") {
    return String(v);
  } else if (typeof v === "string") {
    return quote(v);
  } else if (v instanceof Array) {
    return "[" + v.map((x) => jsImportsValueToSquiggleCode(x)) + "]";
  } else {
    if (Object.keys(v).length) {
      return (
        "{" +
        Object.entries(v)
          .map(([k, v]) => `${k}:${jsImportsValueToSquiggleCode(v)},`)
          .join("") +
        "}"
      );
    } else {
      return "0"; // squiggle doesn't support empty `{}`
    }
  }
};

export const jsImportsToSquiggleCode = (v: JsImports) => {
  return Object.entries(v)
    .map(([k, v]) => `$${k} = ${jsImportsValueToSquiggleCode(v)}\n`)
    .join("");
};
