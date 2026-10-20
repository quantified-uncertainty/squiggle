// When-clauses (§4.4): a subset of VS Code's grammar. Identifiers (dotted),
// 'string' and numeric literals, true, false, !, ==, !=, <, <=, >, >=, &&,
// ||, parentheses. Unknown keys are undefined (falsy). Clauses are parsed once
// and cached. Pure: no DOM, no React.

export type WhenContext = Readonly<Record<string, unknown>>;

type Node =
  | { kind: "literal"; value: unknown }
  | { kind: "key"; name: string }
  | { kind: "not"; operand: Node }
  | { kind: "and" | "or"; left: Node; right: Node }
  | {
      kind: "compare";
      op: "==" | "!=" | "<" | "<=" | ">" | ">=";
      left: Node;
      right: Node;
    };

type Token =
  | { type: "op"; value: string }
  | { type: "ident"; value: string }
  | { type: "string"; value: string }
  | { type: "number"; value: number };

export class WhenSyntaxError extends Error {}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const two = source.slice(i, i + 2);
    if (["&&", "||", "==", "!=", "<=", ">="].includes(two)) {
      tokens.push({ type: "op", value: two });
      i += 2;
      continue;
    }
    if ("!<>()".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    if (ch === "'") {
      const end = source.indexOf("'", i + 1);
      if (end === -1) {
        throw new WhenSyntaxError(`Unterminated string in "${source}"`);
      }
      tokens.push({ type: "string", value: source.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    const number = /^-?\d+(\.\d+)?/.exec(source.slice(i));
    if (number) {
      tokens.push({ type: "number", value: Number(number[0]) });
      i += number[0].length;
      continue;
    }
    const ident = /^[A-Za-z_][\w.-]*/.exec(source.slice(i));
    if (ident) {
      tokens.push({ type: "ident", value: ident[0] });
      i += ident[0].length;
      continue;
    }
    throw new WhenSyntaxError(`Unexpected "${ch}" in "${source}"`);
  }
  return tokens;
}

function parse(source: string): Node {
  const tokens = tokenize(source);
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (value: string) => {
    const t = peek();
    return t?.type === "op" && t.value === value;
  };
  const fail = (what: string): never => {
    throw new WhenSyntaxError(`${what} in "${source}"`);
  };

  const parseOr = (): Node => {
    let left = parseAnd();
    while (isOp("||")) {
      pos++;
      left = { kind: "or", left, right: parseAnd() };
    }
    return left;
  };
  const parseAnd = (): Node => {
    let left = parseUnary();
    while (isOp("&&")) {
      pos++;
      left = { kind: "and", left, right: parseUnary() };
    }
    return left;
  };
  const parseUnary = (): Node => {
    if (isOp("!")) {
      pos++;
      return { kind: "not", operand: parseUnary() };
    }
    return parseComparison();
  };
  const parseComparison = (): Node => {
    const left = parsePrimary();
    const t = peek();
    if (
      t?.type === "op" &&
      ["==", "!=", "<", "<=", ">", ">="].includes(t.value)
    ) {
      pos++;
      const op = t.value as "==" | "!=" | "<" | "<=" | ">" | ">=";
      return { kind: "compare", op, left, right: parsePrimary() };
    }
    return left;
  };
  const parsePrimary = (): Node => {
    const t = peek();
    if (!t) return fail("Unexpected end");
    pos++;
    if (t.type === "op" && t.value === "(") {
      const inner = parseOr();
      if (!isOp(")")) fail("Missing )");
      pos++;
      return inner;
    }
    if (t.type === "string" || t.type === "number") {
      return { kind: "literal", value: t.value };
    }
    if (t.type === "ident") {
      if (t.value === "true") return { kind: "literal", value: true };
      if (t.value === "false") return { kind: "literal", value: false };
      return { kind: "key", name: t.value };
    }
    return fail(`Unexpected "${t.value}"`);
  };

  const node = parseOr();
  if (pos !== tokens.length) fail("Unexpected trailing input");
  return node;
}

function evaluate(node: Node, ctx: WhenContext): unknown {
  switch (node.kind) {
    case "literal":
      return node.value;
    case "key":
      return ctx[node.name];
    case "not":
      return !evaluate(node.operand, ctx);
    case "and":
      return (
        Boolean(evaluate(node.left, ctx)) && Boolean(evaluate(node.right, ctx))
      );
    case "or":
      return (
        Boolean(evaluate(node.left, ctx)) || Boolean(evaluate(node.right, ctx))
      );
    case "compare": {
      const a = evaluate(node.left, ctx);
      const b = evaluate(node.right, ctx);
      switch (node.op) {
        case "==":
          return a === b;
        case "!=":
          return a !== b;
        default: {
          if (typeof a !== "number" || typeof b !== "number") return false;
          if (node.op === "<") return a < b;
          if (node.op === "<=") return a <= b;
          if (node.op === ">") return a > b;
          return a >= b;
        }
      }
    }
  }
}

const cache = new Map<string, Node>();

// Parses (once) and throws WhenSyntaxError on malformed clauses.
export function parseWhen(source: string): void {
  compile(source);
}

function compile(source: string): Node {
  let node = cache.get(source);
  if (!node) {
    node = parse(source);
    cache.set(source, node);
  }
  return node;
}

// True when the clause holds in `ctx`; an absent clause always holds.
export function evaluateWhen(
  source: string | undefined,
  ctx: WhenContext
): boolean {
  if (source === undefined || source.trim() === "") return true;
  return Boolean(evaluate(compile(source), ctx));
}

// The context keys a clause reads (for tests: every key some owner publishes).
export function whenKeys(source: string): string[] {
  const keys = new Set<string>();
  const visit = (node: Node) => {
    switch (node.kind) {
      case "key":
        keys.add(node.name);
        break;
      case "not":
        visit(node.operand);
        break;
      case "and":
      case "or":
      case "compare":
        visit(node.left);
        visit(node.right);
        break;
    }
  };
  visit(compile(source));
  return [...keys];
}
