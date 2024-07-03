import { parse } from "../../src/ast/parse.js";
import { parse as peggyParse } from "../../src/ast/peggyParser.js";
import { ASTNode } from "../../src/ast/types.js";
import { ICompileError } from "../../src/errors/IError.js";
import { TypeConstraint, checkTypeConstraints, cleanTypeConstraints, gaussianElim, typeConstraintsToMatrix, unitTypeCheck, unitTypeCheckInner } from "../../src/ast/unitTypeChecker.js";
import {
    testEvalError,
    testEvalToBe,
    testParse,
} from "../helpers/reducerHelpers.js";

function findTypeConstraints(sourceCode: string): [TypeConstraint, ASTNode][] {
    const node = peggyParse(sourceCode, { grammarSource: "test", comments: [] });
    const typeConstraints: [TypeConstraint, ASTNode][] = [];
    if (node.type !== "Program") {
        throw new Error("findTypeConstraintsHelper only accepts a node of type Program");
    }
    for (const statement of node.statements) {
        unitTypeCheckInner(statement, typeConstraints);
    }
    cleanTypeConstraints(typeConstraints);
    return typeConstraints;
}

function gaussianElimHelper(sourceCode: string): [number[][], number[][]] {
    const typeConstraints = findTypeConstraints(sourceCode);
    const [varNames, unitNames, varMatrix, unitMatrix] = typeConstraintsToMatrix(typeConstraints);
    gaussianElim(varMatrix, unitMatrix);
    return [varMatrix, unitMatrix];
}

function getUnitTypes(sourceCode: string): { [key: string]: { [key: string]: number } } {
    const typeConstraints = findTypeConstraints(sourceCode);
    return checkTypeConstraints(typeConstraints);
}

describe("find unit type constraints", () => {
    test("assign m/s to m/s", () => expect(findTypeConstraints(
        `
x :: m = 1
y = 2
z :: m/s = x/y
`)).toEqual([
            [{
                defined: true,
                variables: { x: 1 },
                units: { m: -1 },
            }, expect.anything()],
            [{
                defined: true,
                variables: { z: 1 },
                units: { m: -1, s: 1},
            }, expect.anything()],
            [{
                defined: true,
                variables: { z: 1, x: -1, y: 1 },
                units: {},
            }, expect.anything()],
        ]));
});

describe("unit-type Gaussian elimination", () => {
    test("assign m/s to m/s", () => expect(gaussianElimHelper(
        `
x :: m = 1
y = 2
z :: m/s = x/y
`)).toEqual([
            [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ],
            [
                [-1, 0],
                [0, -1],
                [-1, 1],
            ],
        ]));

    test("assign m/s to m*s", () => expect(gaussianElimHelper(
        `
x :: m = 1
y :: s = 2
z :: m/s = x * y
`)).toEqual([
            [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
                [0, 0, 0],
            ],
            [
                [-1, 0],
                [0, -1],
                [-1, 1],
                [0, -2],
            ],
        ]));

    test("conflicting assignment with extra free variable", () => expect(gaussianElimHelper(
        `
x = 1  // free variable
y :: boots = 3
z :: cats = y
`)).toEqual([
            [
                [1, 0],
                [0, 1],
                [0, 0],
            ],
            [
                [-1, 0],
                [0, -1],
                [-1, 1],
            ],
        ]));

    test("two groups of constrained variables, one with a conflict", () => expect(gaussianElimHelper(
        `
boots :: boots = 1
bootsForMyCat :: boots = boots / 2
cats :: cats = 3
socks :: socks = cats
`)).toEqual([
            [
                [1, 0, 0, 0],  // boots
                [0, 1, 0, 0],  // bootsForMyCat
                [0, 0, 1, 0],  // cats
                [0, 0, 0, 1],  // socks
                [0, 0, 0, 0],  // socks / cats (reduced)
            ],
            [
                [-1, 0, 0],
                [-1, 0, 0],
                [0, -1, 0],
                [0, 0, -1],
                [0, -1, 1],
            ],
        ]));
});

describe("unit type checking", () => {
    describe("basic arithmetic", () => {
        test("assign m/s to m*s", () => expect(() => parse(
            `
x :: m = 1
y :: s = 4
z :: m/s = x * y`, "test"
        )).toThrow("Conflicting unit types"));

        test("assign m/s to m/s", () => expect(getUnitTypes(
            `
x :: m = 1
y :: s = 4
z :: m/s = x / y
`)).toEqual({
    x: {m: 1},
    y: {s: 1},
    z: {m: 1, s: -1},
}));

        test("adding a literal preserves expression type", () => expect(getUnitTypes(
            `
x :: kg = -3.5
y = x + 12
`)).toEqual({
    x: {kg: 1},
    y: {kg: 1},
}));

        test("can only subtract values of the same type", () => expect(() => parse(
            `
x :: kg = 2
y :: lb = 0.5
x - y
`)).toThrow("Conflicting unit types"));

        test("can only compare values of the same type", () => expect(() => parse(
            `
x :: kg = 2
y :: lb = 0.5
x < y
`)).toThrow("Conflicting unit types"));

        test("cannot re-declare a variable with a new type", () => expect(() => parse(
            `
x :: socks = 1
x :: shoes = 1`, "test"
        )).toThrow("Conflicting unit types"));

        test("two groups of constrained variables, one with a conflict", () => expect(() => parse(
            `
boots :: boots = 1
bootsForMyCat :: boots = boots / 2
cats :: cats = 3
socks :: socks = cats
`, "test"
        )).toThrow(`Conflicting unit types:
	socks / cats :: <unitless>
	cats :: cats
	socks :: socks`));

        test("three-way conflict", () => expect(() => parse(
            `
x :: m/s = a / b
y :: kg/s = b / c
z :: kg/m = c / a
`, "test"
        )).toThrow("Conflicting unit types"));
    });

    describe("blocks", () => {
        test("type error inside block gets caught", () => expect(() => parse(
            `
{
  x :: kg = 1
  y :: lb = x
  y
}
`, "test"
        )).toThrow("Conflicting unit types"));

        test("unit type of block is unit type of last expression", () => expect(getUnitTypes(
            `
x = {
  y :: joules = 27
  y
}
`, "test"
        )).toEqual({
            x: {joules: 1}
        }));

        // TODO: need some way of keeping the inferred types when dropping
        // scope. Maybe in unitTypeCheckInner, make a list of variables that
        // exist in the parent scope and keep all type constraints that include
        // only variables in parent scope.
        //
        // But that alone isn't sufficient, you need to run Gaussian elimination
        // and *then* out-propagate any relevant constraints.
        //
        // Maybe the best way is to not do type inference recursively, just do
        // it at the end, but give each block an id and tag variables with the
        // block ids. Maintain a stack so that when a var is reference, we know
        // where it comes from.
        test("type inference back-propagates from outside to inside a block", expect(getUnitTypes(
            `
x = 10
y :: dollars = {
  z = x + 3
  z
}
`, "test"
        )).toEqual({
            x: {dollars: 1},
            y: {dollars: 1},
        }));

        test("type declaration outside block cannot conflict with block expression type", () => expect(() => parse(
            `
x :: dalys = {
y :: logIncomeUnits = 130
y
}
`, "test")).toThrow("Conflicting unit types"));
    });
});
