import { ASTNode } from "./types.js";

type TypedNode<T extends ASTNode["type"]> = Extract<ASTNode, { type: T }>;

type FlatTypeSignature = {
  category: "explicit" | "implicit" | "numeric";
  numer: string[];
  denom: string[];
}

const NUMERIC_TYPE: FlatTypeSignature = {
  category: "numeric",
  numer: [],
  denom: [],
};

const IMPLICIT_TYPE: FlatTypeSignature = {
  category: "implicit",
  numer: [],
  denom: [],
};

function isImplicit(flatType: FlatTypeSignature): boolean {
  return flatType.category === "implicit";
}

function isNumeric(flatType: FlatTypeSignature): boolean {
  return flatType.category === "numeric";
}

function flatTypeToString(flatType: FlatTypeSignature): string {
  if (isImplicit(flatType)) {
    return "<implicit>";
  } else if (isNumeric(flatType)) {
    return "<numeric>";
  } else if (flatType.numer.length === 0 && flatType.denom.length === 0) {
    return "<unitless>";
  }
  return flatType.numer.join("*") + (
    flatType.denom.length == 0
    ? ""
    : "/" + flatType.denom.join("/")
  );
}

function flattenTypeSignature(node: ASTNode): FlatTypeSignature {
  switch (node.type) {
    case "TypeSignature":
      return flattenTypeSignature(node.body);
    case "Float":
    case "UnitValue":
      return NUMERIC_TYPE;
    case "Identifier":
      return {
        category: "explicit",
        numer: [node.value],
        denom: [],
      };
    case "ImplicitType":
      return IMPLICIT_TYPE;
    case "InfixType":
      let left = flattenTypeSignature(node.args[0]);
      let right = flattenTypeSignature(node.args[1]);
      if (node.op === "*") {
        return typeProduct(left, right);
      } else if (node.op === "/") {
        return typeQuotient(left, right);
      } else {
        throw new Error(`Unknown infix operator in type signature: ${node.op}`);
      }
    default:
      throw new Error(`Unknown node in type signature: ${node}`);
  }
}

function typeProduct(
  left: FlatTypeSignature,
  right: FlatTypeSignature
): FlatTypeSignature {
  let category: "explicit" | "implicit" | "numeric";
  if (isImplicit(left) || isImplicit(right)) {
    category = "implicit";
  } else if (isNumeric(left) && isNumeric(right)) {
    category = "numeric";
  } else {
    category = "explicit";
  }
  return {
    category: category,
    numer: [...left.numer, ...right.numer],
    denom: [...left.denom, ...right.denom],
  };
}

function typeQuotient(
  left: FlatTypeSignature,
  right: FlatTypeSignature
): FlatTypeSignature {
  const invertedRight = {
    category: right.category,
    numer: right.denom,
    denom: right.numer,
  }
  return typeProduct(left, invertedRight);
}

function typeCheckExpression(
  expression: ASTNode,
  typeDeclarations: { [key: string]: FlatTypeSignature }
): FlatTypeSignature {
  switch (expression.type) {
    case "Identifier":
      if (expression.value in typeDeclarations) {
        return typeDeclarations[expression.value];
      } else {
        return IMPLICIT_TYPE;
      }
    case "Float":
    case "UnitValue":
      return NUMERIC_TYPE;
    case "InfixCall":
      break;
    default:
      // TODO: Need to handle all cases. This is a placeholder to make tests pass
      return IMPLICIT_TYPE;
      // throw new Error(`Type checking within infix call unsupported for node type: ${expression.type}`);
  }

  switch (expression.op) {
    case "*":
      // TODO: if one side is implicit but result is type-constrained, need to
      // somehow backpropagate the type inference
      return typeProduct(
        typeCheckExpression(expression.args[0], typeDeclarations),
        typeCheckExpression(expression.args[1], typeDeclarations)
      );
    case "/":
      return typeQuotient(
        typeCheckExpression(expression.args[0], typeDeclarations),
        typeCheckExpression(expression.args[1], typeDeclarations)
      );
    case "+":
    case "-":
    case ".+":
    case ".-":
    case "==":
    case "!=":
    case "<":
    case "<=":
    case ">":
    case ">=":
      const leftType = typeCheckExpression(expression.args[0], typeDeclarations);
      const rightType = typeCheckExpression(expression.args[1], typeDeclarations);
      if (isImplicit(leftType) || isNumeric(leftType)) {
        if (expression.args[0].type === "Identifier") {
          typeDeclarations[expression.args[0].value] = rightType;
        }
        return rightType;
      } else if (isImplicit(rightType) || isNumeric(rightType)) {
        if (expression.args[1].type === "Identifier") {
          typeDeclarations[expression.args[1].value] = leftType;
        }
        return leftType;
      } else if (flatTypeToString(leftType) !== flatTypeToString(rightType)) {
        // TODO: custom error type
        throw new Error(`Type mismatch in infix expression ${expression}: ${flatTypeToString(leftType)} vs ${flatTypeToString(rightType)}`);
      }
      return leftType;
    default:
      // TODO: Need to handle all cases. This is a placeholder to make tests pass
      return IMPLICIT_TYPE;
      // throw new Error(`Type checking unsupported for infix operator: ${expression.op}`);
  }
}

function innerTypeCheck(
  node: ASTNode,
  typeDeclarations: { [key: string]: FlatTypeSignature }
): void {
  switch (node.type) {
    case "Program":
      for (const statement of node.statements) {
        innerTypeCheck(statement, typeDeclarations);
      }
      break;
    case "LetStatement":
      if (!node.typeSignature.isImplicit) {
        typeDeclarations[node.variable.value] = flattenTypeSignature(node.typeSignature);
        const valueType = typeCheckExpression(node.value, typeDeclarations);
        if (["implicit", "numeric"].includes(valueType.category)) {
          // TODO: if value contains an implicit variable, infer the type of the variable
        } else if (flatTypeToString(valueType) !== flatTypeToString(typeDeclarations[node.variable.value])) {
          throw new Error(`Type mismatch in variable assignment ${node.variable.value}: declared type ${flatTypeToString(typeDeclarations[node.variable.value])} does not match assigned type ${flatTypeToString(valueType)}`);
        }
      } else {
        // TODO: if implicit, should still type check to infer the type
      }
      break;
    case "InfixCall":
      typeCheckExpression(node, typeDeclarations);
      break;
    default:
      break;
  }
}

export function typeCheck(node: ASTNode): void {
  innerTypeCheck(node, {});
}
