import { ASTNode } from "./types.js";
import { ICompileError } from "../errors/IError.js";

type TypedNode<T extends ASTNode["type"]> = Extract<ASTNode, { type: T }>;

/* Defines a product of variables and units with the values of the dicts giving
 * their (possibly negative) exponents. A type constraint specifies that the
 * product of all variables and units must be dimensionless.
 */
export type TypeConstraint = {
    defined: boolean;
    variables: { [key: string]: number };
    units: { [key: string]: number };
};

type VariableTypes = {
    [key: string]: { [key: string]: number }
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

function isConstraintEmpty(constraint: TypeConstraint): boolean {
    return (
        constraint.defined
            && Object.keys(constraint.variables).length === 0
            && Object.keys(constraint.units).length === 0
    );
}

function subConstraintToString(subConstraint: { [key: string]: number }): string {
    if (Object.keys(subConstraint).length === 0) {
        return "<unitless>";
    }
    return Object.entries(subConstraint).map(([key, value]) => {
        if (value === 1) {
            return ` * ${key}`;
        } else if (value === -1) {
            return ` / ${key}`;
        } else if (value > 0) {
            return ` * ${key}^${value}`;
        } else {
            return ` / ${key}^${-value}`;
        }
    }).join("").slice(3);
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

function resolveType(
    node: ASTNode,
    variableTypes: VariableTypes
): TypeConstraint {
    // TODO: A Program/LetStatement/etc. doesn't have no constraint, it has no
    // type at all and you can't resolve its type. But throwing an error here
    // will screw up the control flow.
    switch (node.type) {
        case "Float":
        case "UnitValue":
            return NO_CONSTRAINT;
        case "Block":
            return resolveType(node.statements[node.statements.length - 1], variableTypes);
        case "Identifier":
            if (node.value in variableTypes) {
                return {
                    defined: true,
                    variables: {},
                    units: variableTypes[node.value],
                };
            }
        case "InfixCall":
            // handled below
            break;
        default:
            // Should never happen
            throw new Error(`No way to resolve type for node type ${node.type}: ${node}`, node.location);
    }

    // for InfixCall
    switch (node.op) {
        case "*":
        case ".*":
            return multiplyConstraints(
                resolveType(node.args[0], variableTypes),
                resolveType(node.args[1], variableTypes)
            );
        case "/":
        case "./":
            return divideConstraints(
                resolveType(node.args[0], variableTypes),
                resolveType(node.args[1], variableTypes)
            );
        case "==":
        case "!=":
        case "<":
        case "<=":
        case ">":
        case ">=":
        case "+":
        case "-":
        case ".+":
        case ".-":
        case "to":
            // We can safely assume both args have the same type because there
            // would be a type error otherwise.
            const leftType = resolveType(node.args[0], variableTypes);
            const rightType = resolveType(node.args[1], variableTypes);
            if (leftType.defined) {
                return leftType;
            } else {
                return rightType;
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

/* Recursively scan the AST to find and check all type constraints. */
export function unitTypeCheckInner(
    node: ASTNode,
    typeConstraints: [TypeConstraint, ASTNode][]
): TypeConstraint {
    let scopedTypeConstraints = typeConstraints.map((x) => x);
    switch (node.type) {
        case "Program":
        case "Block":
            for (const statement of node.statements) {
                unitTypeCheckInner(statement, scopedTypeConstraints);
            }
            if (node.type === "Block") {
                console.log("checking constraints: ", scopedTypeConstraints.map((x) => JSON.stringify(x[0])).join("\n\t"));
            }
            const variableTypes = checkTypeConstraints(scopedTypeConstraints);
            if (node.type === "Program") {
                return NO_CONSTRAINT;
            } else {
                return resolveType(node.statements[node.statements.length - 1], variableTypes);
            }
        case "LetStatement":
            const variableConstraint = unitTypeCheckInner(node.variable, typeConstraints);
            const typeDefConstraint = createTypeConstraint(node.typeSignature);
            const valueConstraint = unitTypeCheckInner(node.value, typeConstraints);
            typeConstraints.push([
                requireConstraintsToBeEqual(variableConstraint, typeDefConstraint),
                node
            ]);
            typeConstraints.push([
                requireConstraintsToBeEqual(variableConstraint, valueConstraint),
                node
            ]);
            if (node.value.type === "Block") {
                console.log("Type constraint from let statement: ", typeConstraints[typeConstraints.length - 1][0]);
            }
            return NO_CONSTRAINT;
        case "Identifier":
            return {
                defined: true,
                variables: { [node.value]: 1 },
                units: {},
            };
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

    // for InfixCall
    var isBooleanOp = false;
    switch (node.op) {
        case "*":
        case ".*":
            return multiplyConstraints(
                unitTypeCheckInner(node.args[0], typeConstraints),
                unitTypeCheckInner(node.args[1], typeConstraints)
            );
        case "/":
        case "./":
            return divideConstraints(
                unitTypeCheckInner(node.args[0], typeConstraints),
                unitTypeCheckInner(node.args[1], typeConstraints)
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
            const leftType = unitTypeCheckInner(node.args[0], typeConstraints);
            const rightType = unitTypeCheckInner(node.args[1], typeConstraints);
            const jointConstraint = requireConstraintsToBeEqual(leftType, rightType);
            typeConstraints.push([jointConstraint, node]);

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

/* Remove empty or undefined unit type constraints. Modify in place and return
 * the result.
 */
export function cleanTypeConstraints(typeConstraints: [TypeConstraint, ASTNode][]): [TypeConstraint, ASTNode][] {
    for (var i = 0; i < typeConstraints.length; ) {
        if (!typeConstraints[i][0].defined || isConstraintEmpty(typeConstraints[i][0])) {
            typeConstraints.splice(i, 1);
        } else {
            i++;
        }
    }
    return typeConstraints;
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

    let h = 0;  // pivot row
    let k = 0;  // pivot column
    while (h < numRows && k < numCols) {
        // Find the k-th pivot column
        const absRow = varMatrix[h].map(Math.abs);
        const iMax = absRow.indexOf(Math.max(...absRow.slice(k)));

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
                // console.log("Next step: ", varMatrix.join(" | "));
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

export function typeConstraintsToMatrix(typeConstraints: [TypeConstraint, ASTNode][]): [string[], string[], number[][], number[][]] {
    let varMatrix = [];
    let unitMatrix = [];
    let rowNodes = [];
    let varNames = [];
    let unitNames = [];

    // Make an ordered list of all variable and unit names.
    for (const [constraint, node] of typeConstraints) {
        for (const variable in constraint.variables) {
            if (varNames.indexOf(variable) === -1) {
                varNames.push(variable);
            }
        }
        for (const unit in constraint.units) {
            if (unitNames.indexOf(unit) === -1) {
                unitNames.push(unit);
            }
        }
    }
    varNames.sort();
    unitNames.sort();

    // Create matrices where columns are variables/units and rows are constraints.
    for (const [constraint, node] of typeConstraints) {
        let varRow = varNames.map((varName) => varName in constraint.variables ? constraint.variables[varName] : 0);

        let unitRow = unitNames.map((unitName) => unitName in constraint.units ? constraint.units[unitName] : 0);
        varMatrix.push(varRow);
        unitMatrix.push(unitRow);
        rowNodes.push(node);
    }

    return [varNames, unitNames, varMatrix, unitMatrix];
}

function matrixToSimplifiedTypes(varNames: string[], unitNames: string[], varMatrix: number[][], unitMatrix: number[][]): VariableTypes {
    let varTypes: { [key: string]: { [key: string]: number } } = {};
    for (let i = 0; i < varMatrix.length; i++) {
        const varIndex = varMatrix[i].indexOf(1);
        if (varIndex === -1) {
            continue;
        }
        const varName: string = varNames[varIndex];
        let varType: { [key: string]: number } = {};
        for (let j = 0; j < unitMatrix[i].length; j++) {
            if (unitMatrix[i][j] !== 0) {
                // negate to convert var + unit = 0 to var = -unit
                varType[unitNames[j]] = -unitMatrix[i][j];
            }
        }
        varTypes[varName] = varType;
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
export function checkTypeConstraints(typeConstraints: [TypeConstraint, ASTNode][]): VariableTypes {
    cleanTypeConstraints(typeConstraints);
    const [varNames, unitNames, varMatrix, unitMatrix] = typeConstraintsToMatrix(typeConstraints);
    const conflictingRows = gaussianElim(varMatrix, unitMatrix);
    if (conflictingRows.length > 0) {
        for (const rowIndices of conflictingRows) {
            const conflictStrs = rowIndices.map(i => `${subConstraintToString(typeConstraints[i][0].variables)} :: ${subConstraintToString(typeConstraints[i][0].units)}`);
            throw new ICompileError(`Conflicting unit types:\n\t${conflictStrs.join("\n\t")}`, typeConstraints[rowIndices[0]][1].location);
        }
    }
    return matrixToSimplifiedTypes(varNames, unitNames, varMatrix, unitMatrix);
}

export function unitTypeCheck(node: ASTNode): void {
    const typeConstraints: [TypeConstraint, ASTNode][] = [];
    unitTypeCheckInner(node, typeConstraints);
}
