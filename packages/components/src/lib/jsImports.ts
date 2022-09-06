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
          .map(([k, v]) => `${quote(k)}:${jsImportsValueToSquiggleCode(v)},`)
          .join("") +
        "}"
      );
    } else {
      return "0"; // squiggle doesn't support empty `{}`
    }
  }
};

export const jsImportsToSquiggleCode = (v: JsImports) => {
  const validId = new RegExp("[a-zA-Z][[a-zA-Z0-9]*");
  let result = Object.entries(v)
    .map(([k, v]) => {
      if (!k.match(validId)) {
        return ""; // skipping without warnings; can be improved
      }
      return `$${k} = ${jsImportsValueToSquiggleCode(v)}\n`;
    })
    .join("");
  if (!result) {
    result = "$__no_valid_imports__ = 1"; // without this generated squiggle code can be invalid
  }
  return result;
};
