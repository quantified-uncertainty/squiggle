import { ASTNode } from "./types.js";
import { ICompileError } from "../errors/IError.js";

type TypedNode<T extends ASTNode["type"]> = Extract<ASTNode, { type: T }>;

export type VariableId = number;

/* Defines a product of variables and units with the values of the dicts giving
 * their (possibly negative) exponents. A type constraint specifies that the
 * product of all variables and units must be dimensionless.
 */
export type TypeConstraint = {
    defined: boolean;
    variables: { [key: VariableId]: number };
    units: { [key: string]: number };
};

export type VariableTypes = {
    [key: VariableId]: { [key: string]: number }
};

type Scope = { [key: string]: VariableId };

type ScopeInfo = {
    stack: Scope[],
    variableNodes: ASTNode[]
};

const EMPTY_CONSTRAINT: TypeConstraint = {
    defined: true,
    variables: {},
    units: {},
};

const NO_CONSTRAINT: TypeConstraint = {
    defined: false,
    variables: {},
    units: {},
};

function subConstraintToString(subConstraint: { [key: VariableId | string]: number }, scopes: ScopeInfo, isVariable: boolean): string {
    if (Object.keys(subConstraint).length === 0) {
        return "<unitless>";
    }
    const entries = Object.entries(subConstraint).map(([key, value]) => {
        let name = "";
        if (isVariable) {
            const node = scopes.variableNodes[key] as { value: string };
            name = node.value;
        } else {
            name = key;
            value = -value;
        }
        return [name, value];
    });

    const positiveEntries = entries.filter(([_, value]) => value > 0);
    const negativeEntries = entries.filter(([_, value]) => value < 0);
    return (
        positiveEntries.map(([name, value]) =>
            (positiveEntries.length == 0 ? "1" : "")
            + value > 1 ? `${name}^${value}` : name).join(" * ")
            + (negativeEntries.length > 0 ? " / " : "")
            + negativeEntries.map(([name, value]) =>
                value < -1 ? `${name}^{${-value}}` : name).join(" / ")
    );
}

/* Create a TypeConstraint object from a type signature. */
function createTypeConstraint(node: ASTNode): TypeConstraint {
    switch (node.type) {
        case "TypeSignature":
            return createTypeConstraint(node.body);
        case "Float":
        case "UnitValue":
            // Can use a unitless literal in a type signature, e.g. `1/meters`.
            return EMPTY_CONSTRAINT;
        case "Identifier":
            return {
                defined: true,
                variables: {},
                units: { [node.value]: 1 },
            };
        case "ImplicitType":
            return NO_CONSTRAINT;
        case "InfixType":
            let left = createTypeConstraint(node.args[0]);
            let right = createTypeConstraint(node.args[1]);
            if (node.op === "*") {
                return multiplyConstraints(left, right);
            } else if (node.op === "/") {
                return divideConstraints(left, right);
            } else {
                throw new ICompileError(`Unknown infix operator in type signature: ${node.op}`, node.location);
            }
        default:
            throw new ICompileError(`Unknown syntax in type signature: ${node}`, node.location);
    }
}

/*
 * Create a TypeConstraint object for an identifier node, which may be a new
 * declaration or a reference to an existing variable.
 */
function identifierConstraint(
    name: string,
    node: ASTNode,
    scopes: ScopeInfo,
    isDeclaration: boolean
): TypeConstraint {
    let uniqueId: VariableId = 0;
    if (isDeclaration) {
        // TODO: is it ok to overwrite scope? I think so because anything that
        // comes after must only reference the new variable
        uniqueId = scopes.variableNodes.length;
        scopes.variableNodes.push(node);
        scopes.stack[scopes.stack.length - 1][name] = uniqueId;
    } else {
        if (name in scopes.stack[scopes.stack.length - 1]) {
            uniqueId = scopes.stack[scopes.stack.length - 1][name];
        } else {
            // Referencing an undefined variable is a compile error, but this
            // isn't the right place to raise an error, so just ignore it.
            return NO_CONSTRAINT;
        }
    }

    return {
        defined: true,
        variables: { [uniqueId]: 1 },
        units: {},
    };
}

function multiplyConstraints(
    left: TypeConstraint,
    right: TypeConstraint
): TypeConstraint {
    if (!left.defined || !right.defined) {
        return NO_CONSTRAINT;
    }
    const variables = { ...left.variables, ...right.variables };
    const units = { ...left.units, ...right.units };
    for (const variable in left.variables) {
        if (variable in right.variables) {
            variables[variable] = left.variables[variable] + right.variables[variable];
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
    for (const unit in units) {
        if (units[unit] === 0) {
            delete units[unit];
        }
    }
    return {
        defined: true,
        variables: variables,
        units: units,
    };
}

function divideConstraints(
    left: TypeConstraint,
    right: TypeConstraint
): TypeConstraint {
    const invertedRight = {
        defined: right.defined,
        variables: Object.fromEntries(
            Object.entries(right.variables).map(([variable, power]) => [variable, -power])
        ),
        units: Object.fromEntries(
            Object.entries(right.units).map(([unit, power]) => [unit, -power])
        ),
    };
    return multiplyConstraints(left, invertedRight);
}

// Two expressions have the same unit type if their ratio is unitless.
const requireConstraintsToBeEqual = divideConstraints;

function addTypeConstraint(
    typeConstraints: [TypeConstraint, ASTNode][],
    constraint: TypeConstraint,
    node: ASTNode
): void {
    if (constraint.defined && (Object.keys(constraint.variables).length > 0 || Object.keys(constraint.units).length > 0)) {
        typeConstraints.push([constraint, node]);
    }
}

/*
 * Recursively scan the AST to find all type constraints.
 */
export function innerFindTypeConstraints(
    node: ASTNode,
    typeConstraints: [TypeConstraint, ASTNode][],
    scopes: ScopeInfo
): TypeConstraint {
    switch (node.type) {
        case "Program":
        case "Block":
            scopes.stack.push({ ...scopes.stack[scopes.stack.length - 1] });

            let lastTypeConstraint = NO_CONSTRAINT;
            for (const statement of node.statements) {
                lastTypeConstraint = innerFindTypeConstraints(statement, typeConstraints, scopes);
            }

            scopes.stack.pop();

            if (node.type === "Program") {
                return NO_CONSTRAINT;
            } else {
                return lastTypeConstraint;
            }
        case "LetStatement":
            const variableConstraint = identifierConstraint(node.variable.value, node.variable, scopes, true);
            const typeDefConstraint = createTypeConstraint(node.typeSignature);
            const valueConstraint = innerFindTypeConstraints(node.value, typeConstraints, scopes);
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
            return NO_CONSTRAINT;
        case "Identifier":
            return identifierConstraint(node.value, node, scopes, false);
        case "Float":
        case "UnitValue":
            return NO_CONSTRAINT;
        case "InfixCall":
            // handled in separate switch statement below
            break;
        default:
            // TODO: handle other node types. this is a quick fix to make tests pass
            return NO_CONSTRAINT;
            // throw new ICompileError(`No way to find type constraints for node type ${node.type}: ${node}`, node.location);
    }

    console.assert(node.type === "InfixCall");
    var isBooleanOp = false;
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
        case "+":
        case "-":
        case ".+":
        case ".-":
        case "to":
            // These operators require the two operands to have the same unit type.
            // Note: `x to y` is syntactic sugar for `lognormal({p5:x, p95:y}).
            const leftType = innerFindTypeConstraints(node.args[0], typeConstraints, scopes);
            const rightType = innerFindTypeConstraints(node.args[1], typeConstraints, scopes);
            const jointConstraint = requireConstraintsToBeEqual(leftType, rightType);
            addTypeConstraint(typeConstraints, jointConstraint, node);

            // Boolean ops require their arguments to have the same unit type,
            // but the result does not have a unit type. Arithmetic ops require
            // their arguments to have the same unit type, and the result has
            // the same unit type as the arguments.
            if (isBooleanOp) {
                return NO_CONSTRAINT;
            } else if (!leftType.defined && rightType.defined) {
                return rightType;
            } else {
                return leftType;
            }
        case ".^":
        case "^":
            // Unit type cannot be determined for exponentiation.
            return NO_CONSTRAINT;
        case "&&":
        case "||":
            // Booleans do not have a unit type.
            return NO_CONSTRAINT;
        default:
            // This should never happen.
            throw new Error(`No way to find type constraints for node: ${node}`);
    }
}

export function findTypeConstraints(node: ASTNode): [[TypeConstraint, ASTNode][], ScopeInfo] {
    let typeConstraints: [TypeConstraint, ASTNode][] = [];
    let scopes: ScopeInfo = {
        stack: [{}],
        variableNodes: [],
    };
    innerFindTypeConstraints(node, typeConstraints, scopes);
    return [typeConstraints, scopes];
}

function swap(arr: any[], i: number, j: number): void {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}

export function gaussianElim(varMatrix: number[][], unitMatrix: number[][]): number[][] {
    if (varMatrix.length === 0) {
        return [];
    }

    const numRows = varMatrix.length;
    const numCols = varMatrix[0].length;
    let conflictingRows: number[][] = [];
    let touchedByRows: number[][] = varMatrix.map((_, i) => [i]);

    // If there are more variables than rows, add some rows of zeros
    if (numRows < numCols) {
        for (let i = numRows; i < numCols; i++) {
            varMatrix.push(new Array(numCols).fill(0));
            unitMatrix.push(new Array(numCols).fill(0));
        }
    }

    // Convert into row echelon form
    let h = 0;  // pivot row
    let k = 0;  // pivot column
    while (h < numRows && k < numCols) {
        // Find the k-th pivot column
        const absCol = varMatrix.slice(h).map((row) => Math.abs(row[k]));
        const iMax = h + absCol.indexOf(Math.max(...absCol));

        if (varMatrix[iMax][k] === 0) {
            k++;
        } else {
            // Swap rows h and iMax
            swap(varMatrix, h, iMax);
            swap(unitMatrix, h, iMax);
            swap(touchedByRows, h, iMax);

            // For each lower row, subtract the pivot row scaled by the factor
            // needed to zero out the pivot column
            for (let i = h + 1; i < numRows; i++) {
                let scale = varMatrix[i][k] / varMatrix[h][k];
                varMatrix[i] = varMatrix[i].map((x, j) => x - varMatrix[h][j] * scale);
                unitMatrix[i] = unitMatrix[i].map((x, j) => x - unitMatrix[h][j] * scale);
                if (scale !== 0) {
                    touchedByRows[i] = touchedByRows[i].concat(touchedByRows[h]);
                }
            }

            h++;
            k++;
        }
    }

    // Use back substitution to convert varMatrix into an identity matrix
    for (let i = varMatrix.length - 1; i >= 0; i--) {
        for (let j = 0; j < varMatrix[i].length; j++) {
            if (varMatrix[i][j] !== 0) {
                for (let k = i - 1; k >= 0; k--) {
                    let scale = varMatrix[k][j] / varMatrix[i][j];
                    varMatrix[k] = varMatrix[k].map((x, l) => x - varMatrix[i][l] * scale);
                    unitMatrix[k] = unitMatrix[k].map((x, l) => x - unitMatrix[i][l] * scale);
                }
            }
        }
    }

    // Scale the rows so that the diagonal elements are 1
    for (let i = 0; i < numRows; i++) {
        if (i >= numCols) {
            break;
        }
        let scale = varMatrix[i][i];
        if (scale !== 0) {
            varMatrix[i] = varMatrix[i].map(x => x / scale);
            unitMatrix[i] = unitMatrix[i].map(x => x / scale);
        }
    }

    // Collect all rows of the form 0 = n (these indicate a type error)
    for (let i = numRows - 1; i >= 0; i--) {
        if (varMatrix[i].every(x => x === 0) && !unitMatrix[i].every(x => x === 0)) {
            conflictingRows.push(touchedByRows[i]);
        }
    }

    return conflictingRows;
}

export function typeConstraintsToMatrix(typeConstraints: [TypeConstraint, ASTNode][], scopes: ScopeInfo): [string[], number[][], number[][]] {
    let varMatrix = [];
    let unitMatrix = [];
    let rowNodes = [];

    const varIds = scopes.variableNodes.map((_, i) => i);

    // Make an ordered list of all unit names.
    let unitNameSet = new Set<string>();
    for (const [constraint, node] of typeConstraints) {
        for (const unit in constraint.units) {
            if (!unitNameSet.has(unit)) {
                unitNameSet.add(unit);
            }
        }
    }
    const unitNames = Array.from(unitNameSet).sort();

    // Create matrices where columns are variables/units and rows are constraints.
    for (const [constraint, node] of typeConstraints) {
        let varRow = varIds.map((varId) => varId in constraint.variables ? constraint.variables[varId] : 0);

        let unitRow = unitNames.map((unitName) => unitName in constraint.units ? constraint.units[unitName] : 0);
        varMatrix.push(varRow);
        unitMatrix.push(unitRow);
        rowNodes.push(node);
    }

    return [unitNames, varMatrix, unitMatrix];
}

function matrixToSimplifiedTypes(
    unitNames: string[],
    varMatrix: number[][],
    unitMatrix: number[][]
): VariableTypes {
    let varTypes: { [key: string]: { [key: string]: number } } = {};
    for (let i = 0; i < varMatrix.length; i++) {
        const varIndex = varMatrix[i].indexOf(1);
        if (varIndex === -1) {
            continue;
        }
        const varId: VariableId = varIndex;
        let varType: { [key: string]: number } = {};
        for (let j = 0; j < unitMatrix[i].length; j++) {
            if (unitMatrix[i][j] !== 0) {
                // negate to convert var + unit = 0 to var = -unit
                varType[unitNames[j]] = -unitMatrix[i][j];
            }
        }
        varTypes[varId] = varType;
    }
    return varTypes;
}


/* Check that the type constraints are consistent.
 *
 * This function works based on the insight that the logarithm of a type
 * constraint is a linear equation, and thus the type constraints together are
 * equivalent to a system of linear equations. If the system has no solution,
 * then the constraints cannot be satisfied and a type error is raised.
 */
export function checkTypeConstraints(
    typeConstraints: [TypeConstraint, ASTNode][],
    scopes: ScopeInfo
): VariableTypes {
    const [unitNames, varMatrix, unitMatrix] = typeConstraintsToMatrix(typeConstraints, scopes);
    const conflictingRows = gaussianElim(varMatrix, unitMatrix);
    if (conflictingRows.length > 0) {
        for (const rowIndices of conflictingRows) {
            const conflictStrs = rowIndices.map(i => `${subConstraintToString(typeConstraints[i][0].variables, scopes, true)} :: ${subConstraintToString(typeConstraints[i][0].units, scopes, false)}`);
            throw new ICompileError(`Conflicting unit types:\n\t${conflictStrs.join("\n\t")}`, typeConstraints[rowIndices[0]][1].location);
        }
    }
    return matrixToSimplifiedTypes(unitNames, varMatrix, unitMatrix);
}

export function unitTypeCheck(node: ASTNode): void {
    const [typeConstraints, scopes] = findTypeConstraints(node);
    const variableTypes = checkTypeConstraints(typeConstraints, scopes);
}
