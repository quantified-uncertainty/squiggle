export const infixFunctions = {
  "+": "add",
  "-": "subtract",
  "!=": "unequal",
  ".-": "Dist.dotSubtract",
  ".*": "Dist.dotMultiply",
  "./": "Dist.dotDivide",
  ".^": "Dist.dotPow",
  ".+": "Dist.dotAdd",
  "*": "multiply",
  "/": "divide",
  "&&": "and",
  "^": "pow", // or xor
  "<": "smaller",
  "<=": "smallerEq",
  "==": "equal",
  ">": "larger",
  ">=": "largerEq",
  "||": "or",
  to: "to",
};

export const unaryFunctions = {
    "-": "unaryMinus",
    "!": "not",
    ".-": "unaryDotMinus",
};

export const typeFunctions = {
    "*": "multiply",
    "/": "divide",
};
