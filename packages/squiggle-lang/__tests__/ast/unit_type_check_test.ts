import { parse } from "../../src/ast/parse.js";
import { parse as peggyParse } from "../../src/ast/peggyParser.js";
import { ASTNode } from "../../src/ast/types.js";
import { ICompileError } from "../../src/errors/IError.js";
import { TypeConstraint, VariableTypes, checkTypeConstraints, findTypeConstraints, gaussianElim, typeConstraintsToMatrix, unitTypeCheck } from "../../src/ast/unitTypeChecker.js";
import {
    testEvalError,
    testEvalToBe,
    testParse,
} from "../helpers/reducerHelpers.js";

type IdNameMapping = string[];

function findTypeConstraintsHelper(sourceCode: string): [TypeConstraint[], IdNameMapping] {
    const node = peggyParse(sourceCode, { grammarSource: "test", comments: [] });
    const [typeConstraints, scopes] = findTypeConstraints(node);
    const plainConstraints = typeConstraints.map((pair) => pair[0]);
    const idNameMapping = scopes.variableNodes.map((node) => (node as { value: string }).value);
    return [plainConstraints, idNameMapping];
}

function gaussianElimHelper(sourceCode: string): [number[][], number[][]] {
    const node = peggyParse(sourceCode, { grammarSource: "test", comments: [] });
    const [typeConstraints, scopes] = findTypeConstraints(node);
    const [unitNames, varMatrix, unitMatrix] = typeConstraintsToMatrix(typeConstraints, scopes);
    gaussianElim(varMatrix, unitMatrix);
    return [varMatrix, unitMatrix];
}

function getUnitTypes(sourceCode: string): [VariableTypes, IdNameMapping] {
    const node = peggyParse(sourceCode, { grammarSource: "test", comments: [] });
    const [typeConstraints, scopes] = findTypeConstraints(node);
    const idNameMapping = scopes.variableNodes.map((node) => (node as { value: string }).value);
    return [checkTypeConstraints(typeConstraints, scopes), idNameMapping];
}

describe("find unit type constraints", () => {
    test("assign m/s to m/s", () => expect(findTypeConstraintsHelper(
        `
x :: m = 1
y = 2
z :: m/s = x/y
`)).toEqual([[
    {
        defined: true,
        variables: { 0: 1 },
        units: { m: -1 },
    },
    {
        defined: true,
        variables: { 2: 1 },
        units: { m: -1, s: 1},
    },
    {
        defined: true,
        variables: { 2: 1, 0: -1, 1: 1 },
        units: {},
    },
], [
    "x", "y", "z",
]]));
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
        [0, 1, 0],
        [0, 0, 1],
        [0, 0, 0],
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
                       // bootsForMyCat / boots (reduced to 0 = 0)
        [0, 0, 1, 0],  // cats
        [0, 0, 0, 1],  // socks
        [0, 0, 0, 0],  // socks / cats (reduced)
    ],
    [
        [-1, 0, 0],  // boots - unit:boots = 0
        [-1, 0, 0],  // bootsForMyCat - unit:boots = 0
        [0, -1, 0],  // cats - unit:cats = 0
        [0, 0, -1],  // socks - cats = 0
        [0, -1, 1],  // -unit:cats + unit:socks = 0 (type error)
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
`)).toEqual([{
    0: {m: 1},
    1: {s: 1},
    2: {m: 1, s: -1},
}, ["x", "y", "z"]]));

        test("types determined in reverse order of declarations", () => expect(getUnitTypes(
            `
a = 1
b = 2
x :: bxType = b
y :: ayType = a
`)).toEqual([{
    0: {ayType: 1},
    1: {bxType: 1},
    2: {bxType: 1},
    3: {ayType: 1},
}, ["a", "b", "x", "y"]]));

        test("adding a literal preserves expression type", () => expect(getUnitTypes(
            `
x :: kg = -3.5
y = x + 12
`)).toEqual([{
    0: {kg: 1},
    1: {kg: 1},
}, ["x", "y"]]));

        test("can only subtract values of the same type", () => expect(() => parse(
            `
x :: kg = 2
y :: lb = 0.5
x - y
`, "test"
        )).toThrow("Conflicting unit types"));

        test("can only compare values of the same type", () => expect(() => parse(
            `
x :: kg = 2
y :: lb = 0.5
x < y
`, "test"
        )).toThrow("Conflicting unit types"));

        test("can re-declare a variable with a new type", () => expect(getUnitTypes(
            `
x :: socks = 1
x :: shoes = 1
`)).toEqual([{
    0: {socks: 1},
    1: {shoes: 1},
}, ["x", "x"]]));

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
a = 0
b = 1
c = 2
x :: m/s = a / b
y :: kg/s = b / c
z :: kg/m = c / a
`, "test"
        )).toThrow("Conflicting unit types"));
    });

//     describe("blocks", () => {
//         test("type error inside block gets caught", () => expect(() => parse(
//             `
// {
//   x :: kg = 1
//   y :: lb = x
//   y
// }
// `, "test"
//         )).toThrow("Conflicting unit types"));

//         test("unit type of block is unit type of last expression", () => expect(getUnitTypes(
//             `
// x = {
//   y :: joules = 27
//   y
// }
// `, "test"
//         )).toEqual({
//             x: {joules: 1}
//         }));

//         // TODO: need some way of keeping the inferred types when dropping
//         // scope. Maybe in innerFindTypeConstraints, make a list of variables that
//         // exist in the parent scope and keep all type constraints that include
//         // only variables in parent scope.
//         //
//         // But that alone isn't sufficient, you need to run Gaussian elimination
//         // and *then* out-propagate any relevant constraints.
//         //
//         // Maybe the best way is to not do type inference recursively, just do
//         // it at the end, but give each block an id and tag variables with the
//         // block ids. Maintain a stack so that when a var is reference, we know
//         // where it comes from.
//         test("type inference back-propagates from outside to inside a block", expect(getUnitTypes(
//             `
// x = 10
// y :: dollars = {
//   z = x + 3
//   z
// }
// `, "test"
//         )).toEqual({
//             x: {dollars: 1},
//             y: {dollars: 1},
//         }));

//         test("type declaration outside block cannot conflict with block expression type", () => expect(() => parse(
//             `
// x :: dalys = {
// y :: logIncomeUnits = 130
// y
// }
// `, "test")).toThrow("Conflicting unit types"));
//     });
});
