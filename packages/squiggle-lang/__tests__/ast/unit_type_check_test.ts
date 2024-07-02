import { parse } from "../../src/ast/parse.js";
import { parse as peggyParse } from "../../src/ast/peggyParser.js";
import { ASTNode } from "../../src/ast/types.js";
import { ICompileError } from "../../src/errors/IError.js";
import { TypeConstraint, checkTypeConstraints, findTypeConstraints, gaussianElim, typeConstraintsToMatrix, unitTypeCheck } from "../../src/ast/unitTypeChecker.js";
import {
    testEvalError,
    testEvalToBe,
    testParse,
} from "../helpers/reducerHelpers.js";

function gaussianElimHelper(sourceCode: string): [number[][], number[][]] {
    const node = peggyParse(sourceCode, { grammarSource: "test", comments: [] });
    const typeConstraints = findTypeConstraints(node);
    const [varNames, unitNames, varMatrix, unitMatrix] = typeConstraintsToMatrix(typeConstraints);
    gaussianElim(varMatrix, unitMatrix);
    return [varMatrix, unitMatrix];
}

function getUnitTypes(sourceCode: string): { [key: string]: { [key: string]: number } } {
    const node = peggyParse(sourceCode, { grammarSource: "test", comments: [] });
    const typeConstraints = findTypeConstraints(node);
    return checkTypeConstraints(typeConstraints);
}

describe("find unit type constraints", () => {
    test("assign m/s to m/s", () => expect(findTypeConstraints(peggyParse(
        `
x :: m = 1
y = 2
z :: m/s = x/y
`, { grammarSource: "test", comments: [] }))).toEqual([
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
        )).toThrow(/Conflicting unit types/));

        test("assign m/s to m/s", () => expect(getUnitTypes(
            `
x :: m = 1
y :: s = 4
z :: m/s = x / y`)).toEqual({
    x: {m: 1},
    y: {s: 1},
    z: {m: 1, s: -1},
}));

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
`, "test")).toThrow("Conflicting unit types"));
    });
});
