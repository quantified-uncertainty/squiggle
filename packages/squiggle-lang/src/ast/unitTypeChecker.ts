import { ICompileError } from "../errors/IError.js";
import { nodeToString } from "./parse.js";
import { ASTNode } from "./types.js";

function swap(arr: any[], i: number, j: number): void {
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
}

/*
 * There can be multiple distinct variables with the same name. During unit type
 * checking, every variable is assigned a unique ID.
 */
export type VariableId = number;

type IdentifierType = "declaration" | "reference";

/*
 * Defines a product of variables and units with the values of the dicts giving
 * their (possibly negative) exponents. A TypeConstraint can represent two
 * different concepts:
 *
 * 1. The unit type of an expression.
 * 2. A requirement that a variable (or product of variables) has a certain unit
 *    type. A TypeConstraint represents a requirement that the product of
 *    `variables` and `parameters` is unitless. For example, if variable `x` must
 *    have type `meters`, then the TypeConstraint encodes the expression
 *    `unittypeof(x)^1 * meters^-1 = 1`.
 *
 * defined: If false, then the constraint is non-binding (it represents an
 * expression of any type).
 *
 * variables: A dict of variables (represented by their unique IDs) an
their exponents.
 *
 * parameters: A dict of function parameters (represented by their indexes in
 * the function's parameters list) and their exponents. Used in function calls
 * to substitute in the unit types of the arguments.
 *
 * units: A dict of unit types (represented by their names as strings) and their
 * exponents.
 */
export type TypeConstraint = {
  defined: boolean;
  variables: { [key: VariableId]: number };
  parameters: { [key: number]: number };
  units: { [key: string]: number };
};

/*
 * A dictionary mapping variables to their unit types.
 */
export type VariableUnitTypes = {
  [key: VariableId]: { [key: string]: number };
};

/*
 * A dictionary mapping variable names to unique IDs within a particular scope.
 * There can be multiple variables with the same name, but every variable is
 * given a unique ID, and a variable reference always uniquely refers to a
 * particular ID as determined by the scope context.
 */
type Scope = { [key: string]: VariableId };

/*
 * Variables with an ID >= FUNCTION_OFFSET represent functions, with the
 * function value being determined by its index in `ScopeInfo.functions`.
 */
const FUNCTION_OFFSET = 1 << 24;

/*
 * Scope info required for type checking.
 *
 * stack: A stack of `Scope` objects, with the global scope at the bottom and
 * most narrow scope at the top.
 *
 * variableNodes: An array where the ith index gives the ASTNode for the
 * identifier on the `let` statement declaring the variable with ID `i`.
 *
 * functions: An array of [function name, [type constraints within function,
 * return type of function]].
 */
type ScopeInfo = {
  stack: Scope[];
  variableNodes: ASTNode[];
  functions: [string, [TypeConstraint[], TypeConstraint]][];
};

/*
 * A unit type constraint that does not contain any variables or units. This is
 * distinct from `no_constraint()` because combining an empty constraint with a
 * non-empty constraint produces a non-empty constraint, but combining
 * `no_constraint()` with any other constraint produces `no_constraint()`.
 */
function empty_constraint(): TypeConstraint {
  return {
    defined: true,
    variables: {},
    parameters: {},
    units: {},
  };
}

/*
 * A non-binding unit type constraint. This represents a value that can have any
 * unit type (the equivalent of `any` in TypeScript).
 */
function no_constraint(): TypeConstraint {
  return {
    defined: false,
    variables: {},
    parameters: {},
    units: {},
  };
}

/*
 * Pretty-print a unit type (defined as a dictionary mapping unit names to
 * exponents) as a string.
 */
function unitTypeToString(unitTypes: { [key: string]: number }) {
  const entries = Object.entries(unitTypes).sort(([name1, _1], [name2, _2]) =>
    name1.localeCompare(name2)
  );
  const positiveEntries = entries.filter(([_, value]) => value > 0);
  const negativeEntries = entries.filter(([_, value]) => value < 0);
  return (
    (positiveEntries.length === 0 ? "1" : "") +
    positiveEntries
      .map(([name, value]) => (value > 1 ? `${name}^${value}` : name))
      .join(" * ") +
    (negativeEntries.length > 0 ? " / " : "") +
    negativeEntries
      .map(([name, value]) => (value < -1 ? `${name}^${-value}` : name))
      .join(" / ")
  );
}

/*
 * Pretty-print a `TypeConstraint.variables` or `TypeConstraint.units` object as
 * a string.
 */
function subConstraintToString(
  subConstraint: { [key: VariableId | string]: number },
  scopes: ScopeInfo,
  isVariable: boolean,
  negate: boolean = false
): string {
  if (Object.keys(subConstraint).length === 0) {
    return "<unitless>";
  }
  const entries = Object.entries(subConstraint).map(([key1, value]) => {
    const key = key1 as unknown as number;
    let name = "";
    if (negate) {
      value = -value;
    }
    if (!isVariable) {
      name = key1;
    } else if (key >= FUNCTION_OFFSET) {
      name = scopes.functions[key - FUNCTION_OFFSET][0];
    } else {
      name = getIdentifierName(scopes.variableNodes[key]);
    }
    return [name, value];
  });

  return unitTypeToString(Object.fromEntries(entries));
}

/* Create a TypeConstraint object from a type signature. */
function createTypeConstraint(node?: ASTNode): TypeConstraint {
  if (!node) {
    return no_constraint();
  }
  switch (node.type) {
    case "UnitTypeSignature":
      return createTypeConstraint(node.body);
    case "Float":
    case "UnitValue":
      // Can use a unitless literal in a type signature, e.g. `1/meters`.
      return empty_constraint();
    case "Identifier":
      return {
        defined: true,
        variables: {},
        parameters: {},
        units: { [node.value]: 1 },
      };
    case "InfixUnitType": {
      const left = createTypeConstraint(node.args[0]);
      const right = createTypeConstraint(node.args[1]);
      if (node.op === "*") {
        return multiplyConstraints(left, right);
      } else if (node.op === "/") {
        return divideConstraints(left, right);
      } else {
        throw new ICompileError(
          `Unknown infix operator in type signature: ${node.op}`,
          node.location
        );
      }
    }
    case "ExponentialUnitType": {
      const floatNode = node.exponent as {
        integer: number;
        fractional: string | null;
        exponent: number | null;
      };
      if (floatNode?.fractional !== null || floatNode?.exponent !== null) {
        throw new ICompileError(
          `Exponents in unit types must be integers, not ${nodeToString(node.exponent)}`,
          node.location
        );
      }
      const exponent = floatNode.integer;
      return {
        defined: true,
        variables: {},
        parameters: {},
        units: { [(node.base as { value: string }).value]: exponent },
      };
    }
    default:
      // This should never happen because a syntax error should've already
      // gotten raised by this point.
      throw new ICompileError(
        `Unknown syntax in type signature: ${nodeToString(node)}`,
        node.location
      );
  }
}

/*
 * Create a TypeConstraint object for an identifier node, which may be a
 * variable declaration or a reference to an existing variable.
 */
function identifierConstraint(
  name: string,
  node: ASTNode,
  scopes: ScopeInfo,
  identifierType: IdentifierType
): TypeConstraint {
  let uniqueId: VariableId = 0;
  switch (identifierType) {
    case "declaration":
      // Overwrite scope because anything that comes after must only reference
      // the new variable
      uniqueId = scopes.variableNodes.length;
      scopes.variableNodes.push(node);
      scopes.stack[scopes.stack.length - 1][name] = uniqueId;
      break;
    case "reference":
      if (name in scopes.stack[scopes.stack.length - 1]) {
        uniqueId = scopes.stack[scopes.stack.length - 1][name];
      } else {
        // Referencing an undefined variable is a compile error, but this
        // isn't the right place to raise an error, so just ignore it.
        return no_constraint();
      }
      break;
    default:
      throw new Error(
        `Internal error: unknown identifier type ${identifierType}`
      );
  }

  return {
    defined: true,
    variables: { [uniqueId]: 1 },
    parameters: {},
    units: {},
  };
}

/*
 * Multiply two type constraints together. If `x` and `y` have known unit types,
 * this function gives the unit type of `x * y`.
 */
function multiplyConstraints(
  left: TypeConstraint,
  right: TypeConstraint
): TypeConstraint {
  if (!left.defined || !right.defined) {
    return no_constraint();
  }
  // Note: The loops below are duplicated so that TypeScript is aware of the key types.
  const variables = { ...left.variables, ...right.variables };
  const parameters = { ...left.parameters, ...right.parameters };
  const units = { ...left.units, ...right.units };
  for (const variable in left.variables) {
    if (variable in right.variables) {
      variables[variable] =
        left.variables[variable] + right.variables[variable];
    }
  }
  for (const parameter in left.parameters) {
    if (parameter in right.parameters) {
      parameters[parameter] =
        left.parameters[parameter] + right.parameters[parameter];
    }
  }
  for (const unit in left.units) {
    if (unit in right.units) {
      units[unit] = left.units[unit] + right.units[unit];
    }
  }
  // delete all entries with value 0
  for (const variable in variables) {
    if (variables[variable] === 0) {
      delete variables[variable];
    }
  }
  for (const parameter in parameters) {
    if (parameters[parameter] === 0) {
      delete parameters[parameter];
    }
  }
  for (const unit in units) {
    if (units[unit] === 0) {
      delete units[unit];
    }
  }
  return {
    defined: true,
    variables: variables,
    parameters: parameters,
    units: units,
  };
}

/*
 * Divide two type constraints. If `x` and `y` have known unit types,
 * this function gives the unit type of `x / y`.
 */
function divideConstraints(
  left: TypeConstraint,
  right: TypeConstraint
): TypeConstraint {
  const invertedRight = {
    defined: right.defined,
    variables: Object.fromEntries(
      Object.entries(right.variables).map(([variable, power]) => [
        variable,
        -power,
      ])
    ),
    parameters: Object.fromEntries(
      Object.entries(right.parameters).map(([parameter, power]) => [
        parameter,
        -power,
      ])
    ),
    units: Object.fromEntries(
      Object.entries(right.units).map(([unit, power]) => [unit, -power])
    ),
  };
  return multiplyConstraints(left, invertedRight);
}

/*
 * Given two unit type constraints, return a new constraint representing a
 * requirement that the two constraints equal each other. This is equivalent to
 * dividing the constraints: two expressions have the same unit type iff
 * their ratio is unitless.
 */
const requireConstraintsToBeEqual = divideConstraints;

/*
 * Append a type constraint to `typeConstraints`. Only add the constraint if
 * it's non-trivial (it's defined and contains at least one variable or
 * unit).
 */
function addTypeConstraint(
  typeConstraints: [TypeConstraint, ASTNode][],
  constraint: TypeConstraint,
  node: ASTNode,
  index?: number
): void {
  if (
    constraint.defined &&
    (Object.keys(constraint.variables).length > 0 ||
      Object.keys(constraint.units).length > 0)
  ) {
    if (index === undefined) {
      typeConstraints.push([constraint, node]);
    } else {
      typeConstraints.splice(index, 0, [constraint, node]);
    }
  }
}

/*
 * Get an identifier name from either an "Identifier" or
 * "IdentifierWithAnnotation" node.
 */
function getIdentifierName(node: ASTNode): string {
  switch (node.type) {
    case "Identifier":
      return node.value;
    case "IdentifierWithAnnotation":
      return node.variable;
    default:
      throw new ICompileError(
        `Node must have type identifier, not ${node.type}`,
        node.location
      );
  }
}

/*
 * Like `findTypeConstraints` but specifically for lambda expressions. Instead
 * of returning a single type constraint, return a list of special type
 * constraints that use `parameters` instead of `variables`. The parent can
 * then associate these constraints with a function name.
 *
 * Return [within-function constraints, return type].
 */
function lambdaFindTypeConstraints(
  node: ASTNode,
  typeConstraints: [TypeConstraint, ASTNode][],
  scopes: ScopeInfo
): [TypeConstraint[], TypeConstraint] {
  // This switch statement serves to statically guarantee that `node` has type
  // `TypedNode<"Lambda">` so TypeScript can correctly infer types.
  switch (node.type) {
    case "Lambda": {
      // Add arguments to scope
      scopes.stack.push({ ...scopes.stack[scopes.stack.length - 1] });
      for (const arg of (node as { args: ASTNode[] }).args) {
        identifierConstraint(
          getIdentifierName(arg),
          arg,
          scopes,
          "declaration"
        );
      }
      let numPreConstraints = typeConstraints.length;

      // returnTypeConstraint will be modified to replace variables with
      // parameters. returnTypeConstraintAsVariable is left unmodified.
      let returnTypeConstraint = innerFindTypeConstraints(
        node.body,
        typeConstraints,
        scopes
      );
      const returnTypeConstraintAsVariable =
        structuredClone(returnTypeConstraint);

      // Get all constraints that were added within the function body
      const newlyAddedConstraints = typeConstraints
        .slice(numPreConstraints)
        .map((pair) => structuredClone(pair[0]));
      const explicitConstraints = [];

      // loop thru all new constraints and replace parameter variables
      // with `parameter` entries
      for (let i = 0; i < node.args.length; i++) {
        const arg = node.args[i] as { unitTypeSignature?: ASTNode };
        const paramName = getIdentifierName(node.args[i]);
        const paramId = scopes.stack[scopes.stack.length - 1][paramName];
        if (arg.unitTypeSignature) {
          const paramType = createTypeConstraint(arg.unitTypeSignature);
          const paramAsVariable = {
            defined: true,
            variables: { [paramId]: 1 },
            parameters: {},
            units: {},
          };
          const paramAsParam = {
            defined: true,
            variables: {},
            parameters: { [i]: 1 },
            units: {},
          };
          // Insert param constraints before body constraints so that
          // when type-checking the body, the param types are already
          // known
          addTypeConstraint(
            typeConstraints,
            requireConstraintsToBeEqual(paramAsVariable, paramType),
            node,
            numPreConstraints
          );
          numPreConstraints++;
          explicitConstraints.push(
            requireConstraintsToBeEqual(paramAsParam, paramType)
          );
        }

        for (const constraint of newlyAddedConstraints.concat([
          returnTypeConstraint,
        ])) {
          if (paramId in constraint.variables) {
            constraint.parameters[i] = constraint.variables[paramId];
            delete constraint.variables[paramId];
          }
        }
      }
      const functionConstraints =
        newlyAddedConstraints.concat(explicitConstraints);

      if (node.returnUnitType) {
        // If the lambda has an explicit return type, add a constraint
        // that the return type is equal to the specified return type.
        const explicitReturnType = createTypeConstraint(node.returnUnitType);
        const newReturnConstraint = requireConstraintsToBeEqual(
          returnTypeConstraintAsVariable,
          explicitReturnType
        );
        addTypeConstraint(
          typeConstraints,
          newReturnConstraint,
          node,
          numPreConstraints
        );
        numPreConstraints++;

        // replace params as `variables` in newReturnConstraint with
        // params as `parameters`
        const substitutableConstraint = structuredClone(newReturnConstraint);
        for (let i = 0; i < node.args.length; i++) {
          const paramName = (node.args[i] as { value: string }).value;
          const paramId = scopes.stack[scopes.stack.length - 1][paramName];
          if (paramId in substitutableConstraint.variables) {
            substitutableConstraint.parameters[i] =
              substitutableConstraint.variables[paramId];
            delete substitutableConstraint.variables[paramId];
          }
        }

        if (substitutableConstraint.defined) {
          functionConstraints.push(substitutableConstraint);
        }
        // If there is an explicit return type, use it as the function's
        // return type instead of the inferred type.
        returnTypeConstraint = explicitReturnType;
      }

      scopes.stack.pop();
      return [functionConstraints, returnTypeConstraint];
    }
    default:
      throw new Error(
        `Argument to lambdaFindTypeConstraints must have type lambda, not ${node.type}`
      );
  }
}

/*
 * Recursively scan the AST to find all type constraints.
 *
 * Any constraints found for the current node or sub-nodes are added to
 * `typeConstraints`.
 *
 * Return the unit type of the current node.
 */
function innerFindTypeConstraints(
  node: ASTNode,
  typeConstraints: [TypeConstraint, ASTNode][],
  scopes: ScopeInfo
): TypeConstraint {
  switch (node.type) {
    case "Program":
    case "Block": {
      scopes.stack.push({ ...scopes.stack[scopes.stack.length - 1] });

      let lastTypeConstraint = no_constraint();
      for (const statement of node.statements) {
        lastTypeConstraint = innerFindTypeConstraints(
          statement,
          typeConstraints,
          scopes
        );
      }

      scopes.stack.pop();

      if (node.type === "Program") {
        return no_constraint();
      } else {
        return lastTypeConstraint;
      }
    }
    case "LetStatement":
      if (node.value.type === "Lambda") {
        // Fall through to "DefunStatement" below
      } else {
        const variableConstraint = identifierConstraint(
          node.variable.value,
          node.variable,
          scopes,
          "declaration"
        );
        const typeDefConstraint = createTypeConstraint(node.unitTypeSignature);
        const valueConstraint = innerFindTypeConstraints(
          node.value,
          typeConstraints,
          scopes
        );
        addTypeConstraint(
          typeConstraints,
          requireConstraintsToBeEqual(variableConstraint, typeDefConstraint),
          node
        );
        addTypeConstraint(
          typeConstraints,
          requireConstraintsToBeEqual(variableConstraint, valueConstraint),
          node
        );
        return no_constraint();
      }
    // eslint-disable-next-line no-fallthrough
    case "DefunStatement": {
      const constraintPair = lambdaFindTypeConstraints(
        node.value,
        typeConstraints,
        scopes
      );
      const functionName = node.variable.value;
      const uniqueId = FUNCTION_OFFSET + scopes.functions.length;
      scopes.functions.push([functionName, constraintPair]);
      scopes.stack[scopes.stack.length - 1][functionName] = uniqueId;

      return no_constraint();
    }
    case "Lambda":
      // Don't type check a lambda unless it's part of a defun or
      // directly assigned to a variable.
      return no_constraint();

    case "Call": {
      if (node.fn.type !== "Identifier") {
        // Don't type-check calls to things that aren't static
        // identifiers. For example, `(condition ? f : g)(x)` is valid,
        // but not type checked.
        return no_constraint();
      }
      const name = (node.fn as { value: string }).value;
      if (!(name in scopes.stack[scopes.stack.length - 1])) {
        // This means the function is built in or imported. Those
        // can be type checked in theory but it's not implemented yet.
        return no_constraint();
      }
      const index = scopes.stack[scopes.stack.length - 1][name];
      if (index < FUNCTION_OFFSET) {
        // The referenced identifier is not known to be a function. That
        // doesn't mean it's *not* a function because it might be set as
        // a function at runtime, but we can't type-check it.
        return no_constraint();
      }
      const [functionConstraints, returnTypeConstraint] =
        scopes.functions[index - FUNCTION_OFFSET][1];

      // substitute function params for args
      for (let i = 0; i < node.args.length; i++) {
        const argConstraint = innerFindTypeConstraints(
          node.args[i],
          typeConstraints,
          scopes
        );
        if (!argConstraint.defined) {
          // If argument isn't a variable, assign it a dummy variable.
          // This makes it possible to infer unit types where the
          // types depend on a parameter and the parameter's argument
          // is a literal. This also allows the type checker to check
          // undefined variables.
          const newId = scopes.variableNodes.length;
          scopes.variableNodes.push(node.args[i]);
          argConstraint.variables[newId] = 1;
        }
        for (const constraint of functionConstraints.concat(
          returnTypeConstraint
        )) {
          if (!(i in constraint.parameters)) {
            continue;
          }
          const paramExponent = constraint.parameters[i];
          for (const k in argConstraint.variables) {
            constraint.variables[k] =
              argConstraint.variables[k] * paramExponent;
          }
          delete constraint.parameters[i];
        }
      }

      for (let i = 0; i < functionConstraints.length; i++) {
        addTypeConstraint(typeConstraints, functionConstraints[i], node);
      }
      return returnTypeConstraint;
    }
    case "Identifier":
      return identifierConstraint(node.value, node, scopes, "reference");
    case "IdentifierWithAnnotation":
      return identifierConstraint(node.variable, node, scopes, "reference");
    case "Float":
    case "UnitValue":
      return no_constraint();
    case "UnaryCall":
      switch (node.op) {
        case "-":
        case ".-":
          return innerFindTypeConstraints(node.arg, typeConstraints, scopes);
        default:
          return no_constraint();
      }
    case "Ternary": {
      // Require the true and false expressions to have the same unit
      // type, and require the result to have the same unit type as both.

      // the result of node.condition is a boolean so it doesn't have a
      // unit type, but it might contain sub-expressions that we need to
      // check
      innerFindTypeConstraints(node.condition, typeConstraints, scopes);
      const leftType = innerFindTypeConstraints(
        node.trueExpression,
        typeConstraints,
        scopes
      );
      const rightType = innerFindTypeConstraints(
        node.falseExpression,
        typeConstraints,
        scopes
      );
      const jointConstraint = requireConstraintsToBeEqual(leftType, rightType);
      addTypeConstraint(typeConstraints, jointConstraint, node);
      return leftType;
    }
    case "InfixCall":
      // handled in separate switch statement below
      break;
    default:
      // Type-checking for other node types is not currently supported.
      return no_constraint();
  }

  console.assert(node.type === "InfixCall");
  let isBooleanOp = false;
  switch (node.op) {
    case "*":
    case ".*":
      return multiplyConstraints(
        innerFindTypeConstraints(node.args[0], typeConstraints, scopes),
        innerFindTypeConstraints(node.args[1], typeConstraints, scopes)
      );
    case "/":
    case "./":
      return divideConstraints(
        innerFindTypeConstraints(node.args[0], typeConstraints, scopes),
        innerFindTypeConstraints(node.args[1], typeConstraints, scopes)
      );
    case "==":
    case "!=":
    case "<":
    case "<=":
    case ">":
    case ">=":
      isBooleanOp = true;
    // eslint-disable-next-line no-fallthrough
    case "+":
    case "-":
    case ".+":
    case ".-":
    case "to": {
      // These operators require the two operands to have the same unit type.
      // Note: `x to y` is syntactic sugar for `lognormal({p5:x, p95:y}).
      const leftType = innerFindTypeConstraints(
        node.args[0],
        typeConstraints,
        scopes
      );
      const rightType = innerFindTypeConstraints(
        node.args[1],
        typeConstraints,
        scopes
      );
      const jointConstraint = requireConstraintsToBeEqual(leftType, rightType);
      addTypeConstraint(typeConstraints, jointConstraint, node);

      // Boolean ops require their arguments to have the same unit type,
      // but the result does not have a unit type. Arithmetic ops require
      // their arguments to have the same unit type, and the result has
      // the same unit type as the arguments.
      if (isBooleanOp) {
        return no_constraint();
      } else if (!leftType.defined && rightType.defined) {
        return rightType;
      } else {
        return leftType;
      }
    }
    case ".^":
    case "^":
      // Unit type cannot be determined for exponentiation.
      return no_constraint();
    case "&&":
    case "||":
      // Booleans do not have a unit type.
      return no_constraint();
    default:
      // This should never happen.
      throw new Error(`No way to find type constraints for node: ${node}`);
  }
}

/*
 * Make a list of all unit type constraints for an AST.
 */
function findTypeConstraints(
  node: ASTNode
): [[TypeConstraint, ASTNode][], ScopeInfo] {
  const typeConstraints: [TypeConstraint, ASTNode][] = [];
  const scopes: ScopeInfo = {
    stack: [{}],
    variableNodes: [],
    functions: [],
  };
  innerFindTypeConstraints(node, typeConstraints, scopes);
  return [typeConstraints, scopes];
}

function simpleCheckConstraints(
  typeConstraints: [TypeConstraint, ASTNode][],
  scopes: ScopeInfo
): [VariableUnitTypes, [TypeConstraint, ASTNode, VariableId[]][]] {
  const unitTypes: VariableUnitTypes = {};
  const conflicts: [TypeConstraint, ASTNode, VariableId[]][] = [];

  let completed = 0;
  for (let i = 0; i < typeConstraints.length; i++) {
    let constraint = typeConstraints[i][0];
    const node = typeConstraints[i][1];

    const originalConstraint = constraint;
    constraint = structuredClone(constraint);
    const typedVariablesInConstraint: VariableId[] = [];

    // Find all variables in this constraint with known types and
    // substitute them in.
    for (const varIdStr in constraint.variables) {
      // JS converts keys to strings but really varId is an int
      const varId = parseInt(varIdStr);
      if (varId in unitTypes) {
        typedVariablesInConstraint.push(varId);
        const variableType = unitTypes[varId];
        const exponent = constraint.variables[varId];
        for (const unit in variableType) {
          if (!(unit in constraint.units)) {
            constraint.units[unit] = 0;
          }
          constraint.units[unit] += variableType[unit] * exponent;
          if (constraint.units[unit] === 0) {
            delete constraint.units[unit];
          }
        }
        delete constraint.variables[varId];
      } else if (varId >= FUNCTION_OFFSET) {
        // If the variable is a function, delete it from the constraint
        // because the current unit type system doesn't understand
        // function types.
        delete constraint.variables[varId];
      }
    }

    const numVariablesLeft = Object.keys(constraint.variables).length;
    if (numVariablesLeft === 1) {
      const varId: VariableId = parseInt(Object.keys(constraint.variables)[0]);
      const exponent = constraint.variables[varId];
      const unitType: { [key: VariableId]: number } = {};
      for (const unit in constraint.units) {
        if (constraint.units[unit] !== 0) {
          unitType[unit as unknown as number] =
            -constraint.units[unit] / exponent;
        }
      }
      unitTypes[varId] = unitType;
      swap(typeConstraints, i, completed);
      completed++;

      // Comment out this line to switch to forward-only type inference
      i = completed - 1;
    } else if (
      numVariablesLeft === 0 &&
      Object.keys(constraint.units).length > 0
    ) {
      // This type constraint cannot be satisfied.
      conflicts.push([originalConstraint, node, typedVariablesInConstraint]);
    }
  }

  for (const varId in unitTypes) {
    if (
      !["Identifier", "IdentifierWithAnnotation"].includes(
        scopes.variableNodes[varId].type
      )
    ) {
      // Delete dummy variables that aren't associated with an
      // identifier node
      delete unitTypes[varId];
    }
  }

  return [unitTypes, conflicts];
}

/*
 * Perform type inference and check that the type constraints are consistent.
 */
function checkTypeConstraints(
  typeConstraints: [TypeConstraint, ASTNode][],
  scopes: ScopeInfo
): VariableUnitTypes {
  const [unitTypes, conflicts] = simpleCheckConstraints(
    typeConstraints,
    scopes
  );

  if (conflicts.length > 0) {
    for (const conflict of conflicts) {
      const knownTypeStrs = conflict[2]
        .map(
          (varId) =>
            `${subConstraintToString({ [varId]: 1 }, scopes, true)} :: ${subConstraintToString(unitTypes[varId], scopes, false)}`
        )
        .join("\n\t");
      throw new ICompileError(
        `Conflicting unit types:\n\t${subConstraintToString(conflict[0].variables, scopes, true)} :: ${subConstraintToString(conflict[0].units, scopes, false, true)}\n\t` +
          knownTypeStrs,
        conflict[1].location
      );
    }
  }
  return unitTypes;
}

/*
 * Put known unit-type information for each variable into the list of decorators
 * for the ASTNode where the variable is defined.
 *
 * TODO: broken
 */
function putUnitTypesOnAST(
  variableTypes: VariableUnitTypes,
  scopes: ScopeInfo
) {
  return undefined;

  for (const variableId in variableTypes) {
    const node = scopes.variableNodes[variableId];

    // TODO: assertion is false, node is Identifier
    console.assert(node.type === "LetStatement");
    const fakeLocation = node.location;
    const unitType = variableTypes[variableId];
    const unitTypeStr = unitTypeToString(unitType);
    if (!("decorators" in node)) {
      (node as { decorators: ASTNode[] }).decorators = [];
    }
    (node as { decorators: ASTNode[] }).decorators.push({
      type: "Decorator",
      name: {
        type: "Identifier",
        value: "unitType",
        location: fakeLocation,
      },
      args: [
        {
          type: "String",
          value: unitTypeStr,
          location: fakeLocation,
        },
      ],
      location: fakeLocation,
    });
  }
}

/*
 * Unit-type check a parsed program.
 */
export function unitTypeCheck(node: ASTNode): void {
  const [typeConstraints, scopes] = findTypeConstraints(node);
  const variableTypes = checkTypeConstraints(typeConstraints, scopes);
  putUnitTypesOnAST(variableTypes, scopes);
}

export const exportedForTesting = {
  checkTypeConstraints,
  findTypeConstraints,
  getIdentifierName,
  putUnitTypesOnAST,
  unitTypeToString,
};
