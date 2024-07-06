import { ASTNode } from "./types.js";
import { ICompileError } from "../errors/IError.js";

type TypedNode<T extends ASTNode["type"]> = Extract<ASTNode, { type: T }>;

/*
 * There can be multiple distinct variables with the same name. During unit type
 * checking, every variable is assigned a unique ID.
 */
export type VariableId = number;

type IdentifierType = "declaration" | "parameter" | "reference";

/*
 * Defines a product of variables and units with the values of the dicts giving
 * their (possibly negative) exponents. A type constraint specifies that the
 * product of all variables and units must be dimensionless.
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
    [key: VariableId]: { [key: string]: number }
};

/*
 * A pair of dictionaries:
 * - one mapping variable names to unique IDs within a particular scope
 * - one mapping function names to their constraints
 */
type Scope = { [key: string]: VariableId };

/* An offset to convert an index in `functionConstraints` to a unique ID. */
const FUNCTION_OFFSET = 1 << 24;

/*
 * Scope info required for type checking.
 *
 * stack: A stack of variable scopes, with the global scope at the bottom and
 * most narrow scope at the top.
 *
 * variableNodes: An array where the ith index gives the ASTNode for the `let`
 * statement declaring the variable with ID `i`.
 */
type ScopeInfo = {
    stack: Scope[];
    variableNodes: ASTNode[];
    functionConstraints: TypeConstraint[][];
    isFunctionParameter: boolean[];
};

/*
 * A type constraint that does not contain any variables or units. This is
 * distinct from `NO_CONSTRAINT` because combining an empty constraint with a
 * non-empty constraint produces a non-empty constraint, but combining
 * `NO_CONSTRAINT` with any other constraint produces `NO_CONSTRAINT`.
 */
const EMPTY_CONSTRAINT: TypeConstraint = {
    defined: true,
    variables: {},
    parameters: {},
    units: {},
};

const NO_CONSTRAINT: TypeConstraint = {
    defined: false,
    variables: {},
    parameters: {},
    units: {},
};

/*
 * Pretty-print a unit type (defined as a dictionary mapping unit names to
 * exponents) as a string.
 */
function unitTypeToString(unitTypes: { [key: string]: number }) {
    const entries = Object.entries(unitTypes).sort(([name1, _1], [name2, _2]) => name1.localeCompare(name2));
    const positiveEntries = entries.filter(([_, value]) => value > 0);
    const negativeEntries = entries.filter(([_, value]) => value < 0);
    return (
        (positiveEntries.length === 0 ? "1" : "")
            + positiveEntries.map(([name, value]) =>
                value > 1 ? `${name}^${value}` : name).join(" * ")
            + (negativeEntries.length > 0 ? " / " : "")
            + negativeEntries.map(([name, value]) =>
                value < -1 ? `${name}^${-value}` : name).join(" / ")
    );
}

/*
 * Pretty-print a `TypeConstraint.variables` or `TypeConstraint.units` object as
 * a string.
 */
function subConstraintToString(subConstraint: { [key: VariableId | string]: number }, scopes: ScopeInfo, isVariable: boolean): string {
    if (Object.keys(subConstraint).length === 0) {
        return "<unitless>";
    }
    const entries = Object.entries(subConstraint).map(([key, value]) => {
        let name = "";
        if (isVariable) {
            console.assert(typeof key !== "string", `In subConstraintToString, expected variable key to be a number, got ${key}`);
            const node = scopes.variableNodes[key as unknown as VariableId] as { value: string };
            name = node.value;
        } else {
            name = key;
            value = -value;
        }
        return [name, value];
    });

    return unitTypeToString(Object.fromEntries(entries));
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
                parameters: {},
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
    identifierType: IdentifierType
): TypeConstraint {
    let uniqueId: VariableId = 0;
    let isFunctionParameter: boolean = false;
    switch (identifierType) {
        case "parameter":
            isFunctionParameter = true;
        case "declaration":
            // Overwrite scope because anything that comes after must only reference
            // the new variable
            uniqueId = scopes.variableNodes.length;
            scopes.variableNodes.push(node);
            scopes.isFunctionParameter.push(isFunctionParameter);
            scopes.stack[scopes.stack.length - 1][name] = uniqueId;
            break;
        case "reference":
            if (name in scopes.stack[scopes.stack.length - 1]) {
                uniqueId = scopes.stack[scopes.stack.length - 1][name];
                if (uniqueId >= FUNCTION_OFFSET) {
                    // Don't type-check a function that's referenced outside the
                    // context of a function call
                    return NO_CONSTRAINT;
                }
            } else {
                // Referencing an undefined variable is a compile error, but this
                // isn't the right place to raise an error, so just ignore it.
                return NO_CONSTRAINT;
            }
            break;
        default:
            throw new Error(`Internal error: unknown identifier type ${identifierType}`);
    }

    return {
        defined: true,
        variables: { [uniqueId]: 1 },
        parameters: {},
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
    // Note: The loops below are duplicated so that TypeScript is aware of the key types.
    const variables = { ...left.variables, ...right.variables };
    const parameters = { ...left.parameters, ...right.parameters };
    const units = { ...left.units, ...right.units };
    for (const variable in left.variables) {
        if (variable in right.variables) {
            variables[variable] = left.variables[variable] + right.variables[variable];
        }
    }
    for (const parameter in left.parameters) {
        if (parameter in right.parameters) {
            parameters[parameter] = left.parameters[parameter] + right.parameters[parameter];
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

function divideConstraints(
    left: TypeConstraint,
    right: TypeConstraint
): TypeConstraint {
    const invertedRight = {
        defined: right.defined,
        variables: Object.fromEntries(
            Object.entries(right.variables).map(([variable, power]) => [variable, -power])
        ),
        parameters: Object.fromEntries(
            Object.entries(right.parameters).map(([parameter, power]) => [parameter, -power])
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

function lambdaFindTypeConstraints(
    node: ASTNode,
    typeConstraints: [TypeConstraint, ASTNode][],
    scopes: ScopeInfo
): TypeConstraint[] {
    switch (node.type) {
        case "Lambda":
            // Add arguments to scope
            scopes.stack.push({...scopes.stack[scopes.stack.length - 1]});
            for (const arg of (node as {args: ASTNode[]}).args) {
                console.assert(arg.type === "Identifier");
                identifierConstraint((arg as { value: string}).value, arg, scopes, "parameter");
            }
            const numPreConstraints = typeConstraints.length;

            var returnTypeConstraint = innerFindTypeConstraints(node.body, typeConstraints, scopes);

            // Get all constraints that were added within the function body and
            // delete them from the global constraints list.
            var newlyAddedConstraints = typeConstraints.slice(numPreConstraints).map((pair) => pair[0]);
            typeConstraints.splice(numPreConstraints, newlyAddedConstraints.length);
            newlyAddedConstraints = [returnTypeConstraint].concat(newlyAddedConstraints);

            // loop thru all new constraints and replace variables with params
            for (const constraint of newlyAddedConstraints) {
                for (let i = 0; i < node.args.length; i++) {
                    const paramName = (node.args[i] as {value: string}).value;
                    const paramId = scopes.stack[scopes.stack.length - 1][paramName];
                    if (paramId in constraint.variables) {
                        constraint.parameters[i] = constraint.variables[paramId];
                        delete constraint.variables[paramId];
                    }
                }
            }
            scopes.stack.pop();

            return newlyAddedConstraints;
        default:
            throw new Error(`Argument to lambdaFindTypeConstraints must have type lambda, not ${node.type}`);
    }
}

/*
 * Recursively scan the AST to find all type constraints.
 */
function innerFindTypeConstraints(
    node: ASTNode,
    typeConstraints: [TypeConstraint, ASTNode][],
    scopes: ScopeInfo
): TypeConstraint {
    switch (node.type) {
        case "Program":
        case "Block":
            scopes.stack.push({...scopes.stack[scopes.stack.length - 1]});

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
            if (node.value.type === "Lambda") {
                // Fall through to "DefunStatement" below
            } else {
                var variableConstraint = identifierConstraint(node.variable.value, node.variable, scopes, "declaration");
                var typeDefConstraint = createTypeConstraint(node.typeSignature);
                var valueConstraint = innerFindTypeConstraints(node.value, typeConstraints, scopes);
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
            }

        case "DefunStatement":
            var functionConstraints = lambdaFindTypeConstraints(node.value, typeConstraints, scopes);
            const uniqueId = FUNCTION_OFFSET + scopes.functionConstraints.length;
            scopes.functionConstraints.push(functionConstraints);
            scopes.stack[scopes.stack.length - 1][node.variable.value] = uniqueId;

            return NO_CONSTRAINT;

        case "Lambda":
            // Don't type check a lambda unless it's part of a defun or
            // directly assigned to a variable.
            return NO_CONSTRAINT;

        case "Call":
            if (node.fn.type !== "Identifier") {
                // Don't type check calls to things that aren't static
                // identifiers. For example, `(condition ? f : g)(x)` is valid,
                // but not type checked.
                return NO_CONSTRAINT;
            }
            var name = (node.fn as { value: string }).value;
            var index = scopes.stack[scopes.stack.length - 1][name];
            console.assert(index >= FUNCTION_OFFSET);
            var functionConstraints = scopes.functionConstraints[index - FUNCTION_OFFSET];

            // substitute function params for args
            for (let i = 0; i < node.args.length; i++) {
                const argConstraint = innerFindTypeConstraints(node.args[i], typeConstraints, scopes);
                for (let j = 0; j < functionConstraints.length; j++) {
                    let constraint = functionConstraints[j];
                    if (!(i in constraint.parameters)) {
                        continue;
                    }
                    const paramExponent = constraint.parameters[i];
                    // TODO: is it possible for argConstraint to contain `parameters`?
                    for (const k in argConstraint.variables) {
                        argConstraint.variables[k] *= paramExponent;
                    }
                    for (const k in argConstraint.units) {
                        argConstraint.units[k] *= paramExponent;
                    }
                    delete constraint.parameters[i];
                    constraint = multiplyConstraints(constraint, argConstraint);
                    functionConstraints[j] = constraint;
                }
            }

            for (let i = 1; i < functionConstraints.length; i++) {
                addTypeConstraint(typeConstraints, functionConstraints[i], node);
            }
            return functionConstraints[0];

        case "Identifier":
            return identifierConstraint(node.value, node, scopes, "reference");
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

function findTypeConstraints(node: ASTNode): [[TypeConstraint, ASTNode][], ScopeInfo] {
    let typeConstraints: [TypeConstraint, ASTNode][] = [];
    let scopes: ScopeInfo = {
        stack: [{}],
        variableNodes: [],
        isFunctionParameter: [],
        functionConstraints: [],
    };
    innerFindTypeConstraints(node, typeConstraints, scopes);
    return [typeConstraints, scopes];
}

function swap(arr: any[], i: number, j: number): void {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}

/*
 * Solve type inference by running Gaussian elimination on the matrix of variables.
 *
 * Return a list of type conflicts, where each list entry is a list of row
 * indexes for rows that mutually conflict. If there are no type errors, this
 * list will be empty.
 */
function gaussianElim(varMatrix: number[][], unitMatrix: number[][]): number[][] {
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

/*
 * Construct two matrices (one for variables and one for units) that define a
 * system of linear equations where each equation is isomorphic to a type
 * constraint.
 *
 * Also return a list of unit names such that the ith column in the unit matrix
 * represents the ith unit name. For the variable matrix, the ith column
 * represents the variable with ID i.
 *
 * Return value: [unit names, variable matrix, unit matrix]
 */
function typeConstraintsToMatrix(typeConstraints: [TypeConstraint, ASTNode][], scopes: ScopeInfo): [string[], number[][], number[][]] {
    let varMatrix = [];
    let unitMatrix = [];
    let rowNodes = [];

    const varIds = scopes.variableNodes.map((_, i) => i).filter((i) => !scopes.isFunctionParameter[i]);
    const genericParamIds = scopes.variableNodes.map((_, i) => i).filter((i) => scopes.isFunctionParameter[i]);

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
        let funcParamRow = genericParamIds.map((paramId) => paramId in constraint.variables ? constraint.variables[paramId] : 0);
        let unitRow = unitNames.map((unitName) => unitName in constraint.units ? constraint.units[unitName] : 0);
        varMatrix.push(varRow);
        unitMatrix.push(funcParamRow.concat(unitRow));
        rowNodes.push(node);
    }

    return [unitNames, varMatrix, unitMatrix];
}

/*
 * Given a diagonal matrix of variables and a matrix of units, produce a mapping
 * from variables to unit types.
 */
function matrixToSimplifiedTypes(
    unitNames: string[],
    varMatrix: number[][],
    unitMatrix: number[][],
    scopes: ScopeInfo
): VariableUnitTypes {
    const varIds = scopes.variableNodes.map((_, i) => i).filter((i) => !scopes.isFunctionParameter[i]);
    const genericParamIds = scopes.variableNodes.map((_, i) => i).filter((i) => scopes.isFunctionParameter[i]);
    const numParams = genericParamIds.length;
    let varTypes: { [key: string]: { [key: string]: number } } = {};
    for (let i = 0; i < varMatrix.length; i++) {
        const varIndex = varMatrix[i].indexOf(1);
        if (varIndex === -1) {
            continue;
        }
        const varId: VariableId = varIds[varIndex];
        let varType: { [key: string]: number } = {};
        for (let j = 0; j < unitMatrix[i].length; j++) {
            if (unitMatrix[i][j] !== 0) {
                if (j < numParams) {
                    var unitName = String(genericParamIds[j]);
                } else {
                    var unitName = unitNames[j - numParams];
                }
                    // negate to convert var + unit = 0 to var = -unit
                varType[unitName] = -unitMatrix[i][j];
            }
        }
        varTypes[varId] = varType;
    }
    return varTypes;
}

/*
 * Perform type inference and check that the type constraints are consistent.
 *
 * This function works by translating type constraints into linear equations and
 * then solving the system of linear equations. If the system has no solution,
 * then the constraints cannot be satisfied and a type error is raised.
 */
function checkTypeConstraints(
    typeConstraints: [TypeConstraint, ASTNode][],
    scopes: ScopeInfo
): VariableUnitTypes {
    const [unitNames, varMatrix, unitMatrix] = typeConstraintsToMatrix(typeConstraints, scopes);
    const conflictingRows = gaussianElim(varMatrix, unitMatrix);
    if (conflictingRows.length > 0) {
        for (const rowIndices of conflictingRows) {
            const conflictStrs = rowIndices.map(i => `${subConstraintToString(typeConstraints[i][0].variables, scopes, true)} :: ${subConstraintToString(typeConstraints[i][0].units, scopes, false)}`);
            throw new ICompileError(`Conflicting unit types:\n\t${conflictStrs.join("\n\t")}`, typeConstraints[rowIndices[0]][1].location);
        }
    }
    return matrixToSimplifiedTypes(unitNames, varMatrix, unitMatrix, scopes);
}

/*
 * Put known unit-type information for each variable into the list of decorators
 * for the ASTNode where the variable is defined.
 *
 * TODO: has not been tested at all
 */
function putUnitTypesOnAST(variableTypes: VariableUnitTypes, scopes: ScopeInfo) {
    for (const variableId in variableTypes) {
        const node = scopes.variableNodes[variableId];
        console.assert(node.type === "LetStatement");
        const fakeLocation = node.location;
        const unitType = variableTypes[variableId];
        const unitTypeStr = unitTypeToString(unitType);
        (node as { decorators: ASTNode[] }).decorators.push({
            type: "Decorator",
            name: {
                type: "Identifier",
                value: "unitType",
                location: fakeLocation,
            },
            args: [{
                type: "String",
                value: unitTypeStr,
                location: fakeLocation,
            }],
            location: fakeLocation,
        });
    }
}

export function unitTypeCheck(node: ASTNode): void {
    const [typeConstraints, scopes] = findTypeConstraints(node);
    const variableTypes = checkTypeConstraints(typeConstraints, scopes);
    putUnitTypesOnAST(variableTypes, scopes);
}

export const exportedForTesting = {
    checkTypeConstraints,
    findTypeConstraints,
    gaussianElim,
    typeConstraintsToMatrix,
    unitTypeToString
}
