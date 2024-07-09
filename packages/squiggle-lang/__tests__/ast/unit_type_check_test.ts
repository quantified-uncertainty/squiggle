import { parse } from "../../src/ast/parse.js";
import { parse as peggyParse } from "../../src/ast/peggyParser.js";
import { ASTNode } from "../../src/ast/types.js";
import { ICompileError } from "../../src/errors/IError.js";
import { TypeConstraint, VariableUnitTypes, exportedForTesting, unitTypeCheck } from "../../src/ast/unitTypeChecker.js";
const { checkTypeConstraints, findTypeConstraints, gaussianElim, typeConstraintsToMatrix, unitTypeToString } = exportedForTesting;
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

function getUnitTypes(sourceCode: string): [VariableUnitTypes, IdNameMapping] {
    const node = peggyParse(sourceCode, { grammarSource: "test", comments: [] });
    const [typeConstraints, scopes] = findTypeConstraints(node);
    const idNameMapping = scopes.variableNodes.filter((node) => "value" in node).map((node) => (node as { value: string }).value);
    return [checkTypeConstraints(typeConstraints, scopes), idNameMapping];
}

describe("unitTypeToString", () => {
    test("m", () => expect(unitTypeToString({
        m: 1,
    })).toEqual("m"));
    test("1/s", () => expect(unitTypeToString({
        s: -1,
    })).toEqual("1 / s"));
    test("m/s", () => expect(unitTypeToString({
        m: 1,
        s: -1,
    })).toEqual("m / s"));
    test("s/m", () => expect(unitTypeToString({
        m: -1,
        s: 1,
    })).toEqual("s / m"));
    test("m/s/s", () => expect(unitTypeToString({
        m: 1,
        s: -2,
    })).toEqual("m / s^2"));
    test("kg*m/s/s/lb", () => expect(unitTypeToString({
        kg: 1,
        m: 1,
        s: -2,
        lb: -1,
    })).toEqual("kg * m / lb / s^2"));
});

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
        parameters: {},
        units: { m: -1 },
    },
    {
        defined: true,
        variables: { 2: 1 },
        parameters: {},
        units: { m: -1, s: 1},
    },
    {
        defined: true,
        variables: { 2: 1, 0: -1, 1: 1 },
        parameters: {},
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

    // Determining types in reverse order means the initial matrix won't be
    // triangular, which could catch bugs in the Gaussian elimination
    // implementation.
    // Note: parse+stringify is a hack to work around the fact
    // that Jest considers 0 and -0 to be different.
    test("types determined in reverse order of declarations", () => expect(JSON.parse(JSON.stringify(gaussianElimHelper(
        `
a = 1
b = 2
x :: bxType = b
y :: ayType = a
`
    )))).toEqual([
        [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
        [
            [-1, 0],
            [0, -1],
            [0, -1],
            [-1, 0],
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

        test("types determined in reverse order of declarations can still be inferred", () => expect(getUnitTypes(
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

        test("negation operator preserves type", () => expect(getUnitTypes(
            `
x :: kg = 3.5
y = -x
`)).toEqual([{
    0: {kg: 1},
    1: {kg: 1},
}, ["x", "y"]]));

        test("ternary branches must have the same type", () => expect(() => parse(
            `
a :: kg = 2
b :: lb = 0.5
a == a ? a : b
`, "test"
        )).toThrow("Conflicting unit types"));

        test("condition in ternary branch gets type-checked", () => expect(() => parse(
            `
a :: kg = 2
b :: lb = 0.5
a < b ? 1 : -1
`, "test"
        )).toThrow("Conflicting unit types"));


        test("can infer the type of one ternary branch based on the other branch", () => expect(getUnitTypes(
            `
a :: kg = 2
b :: m = -6.8
c = 0.5
d = true ? a : (c / b)
d
`)).toEqual([{
    0: {kg: 1},
    1: {m: 1},
    2: {kg: 1, m: 1},
    3: {kg: 1},
}, ["a", "b", "c", "d"]]));

        test("can re-declare a variable with a new type", () => expect(getUnitTypes(
            `
x :: socks = 1
x :: shoes = 1
y = x
`)).toEqual([{
    0: {socks: 1},
    1: {shoes: 1},
    2: {shoes: 1},
}, ["x", "x", "y"]]));

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

        // Note: It might look like these should have unit types, but actually
        // there are infinitely many solutions to these constraints.
        test("type inference with no defined types", () => expect(getUnitTypes(
            `
x = 1
y = 2
z = x + y
foo = x * z
`
        )).toEqual([{}, ["x", "y", "z", "foo"]]));
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

        test("unit type of block is unit type of its last expression", () => expect(getUnitTypes(
            `
x = {
  y :: joules = 27
  y
}
`)).toEqual([{
    0: {joules: 1},
    1: {joules: 1},
}, ["x", "y"]]));

        test("variable declaration inside block can override previous declaration, then be forgotten", () => expect(getUnitTypes(
            `
x :: kg = 1
y = {
  x :: lb = 2
  x
}
z = x  // should infer type as "kg"
`)).toEqual([{
    0: {kg: 1},
    1: {lb: 1},
    2: {lb: 1},
    3: {kg: 1},
}, ["x", "y", "x", "z"]]));

        test("type declaration outside block cannot conflict with block expression type", () => expect(() => parse(
            `
x :: dalys = {
  y :: logIncomeUnits = 130
  y
}
`, "test")).toThrow(`Conflicting unit types:
	x / y :: <unitless>
	x :: dalys
	y :: logIncomeUnits`));

        test("unit types come out of triple-nested blocks", () => expect(getUnitTypes(
        `
x = {
  {
    {
      y :: kg = 1
      y
    }
  }
}
`)).toEqual([{
    0: {kg: 1},
    1: {kg: 1},
}, ["x", "y"]]));

        test("type inference back-propagates from outside to inside a block", () => expect(getUnitTypes(
            `
x = 10
y :: dollars = {
  z = x + 3
  z
}
`)).toEqual([{
    0: {dollars: 1},
    1: {dollars: 1},
    2: {dollars: 1},
}, ["x", "y", "z"]]));
    });
});


describe("explicit unit types for functions", () => {
    test("incorrect argument type", () => expect(() => getUnitTypes(`
convertUnits(x :: kg) :: lbs = x * 2.2
arg :: lbs = 45
convertUnits(arg)
`)).toThrow(`Conflicting unit types:
	arg :: kg
	arg :: lbs`));

    test("incorrect return type", () => expect(() => getUnitTypes(`
convertUnits(x :: kg) :: lbs = x * 2.2
res :: kg = convertUnits(45)
`)).toThrow(`Conflicting unit types:
	res :: lbs
	res :: kg`));

    test("return type does not match", () => expect(() => getUnitTypes(`
convertUnits(x :: kg) :: lbs = x
res = convertUnits(45)
`)).toThrow(`Conflicting unit types:
	x :: lbs
	x :: kg`));

   test("variable inside function body mismatches return type", () => expect(() => getUnitTypes(`
f(x :: kg) :: lbs = {
  y :: kg = x + 1
  y
}
`)).toThrow(`Conflicting unit types:
	y :: lbs
	y :: kg`));

    test("type error across function parameters", () => expect(() => getUnitTypes(`
sum(x :: kg, y :: lbs) :: kg = {
a = x + y
x
}
`)).toThrow(`Conflicting unit types`));

    test("type error on return type of inner function", () => expect(() => getUnitTypes(`
outer(x) :: outie = {
  inner(y) :: innie = y
  inner(x)
}
`)).toThrow(`Conflicting unit types`));

});

describe("unit types for generic functions", () => {

    test("a directly-called lambda isn't type-checked", () => expect(getUnitTypes(
        `
x :: unitType = 3
y = { |a| a }(x)
`)).toEqual([{
    0: {unitType: 1},
}, ["x", "y"]]));

    test("1-parameter generic function with inferred type", () => expect(getUnitTypes(
        `
f(a) = a
x :: m/s = 3
y = f(x)
`)).toEqual([{
    1: {m: 1, s: -1},
    2: {m: 1, s: -1},
}, ["a", "x", "y"]]));

    test("2-parameter generic function", () => expect(getUnitTypes(
        `
f(a, b) = a / b
dist :: meters = 100
time :: seconds = 9.5
speed = f(dist, time)
`)).toEqual([{
    2: {meters: 1},
    3: {seconds: 1},
    4: {meters: 1, seconds: -1},
}, ["a", "b", "dist", "time", "speed"]]));

    test("1-parameter generic function with type error", () => expect(() => getUnitTypes(
        `
f(a) = a
x :: meters = 3
y :: feet = f(x)
`)).toThrow(`Conflicting unit types:
	y / x :: <unitless>
	x :: meters
	y :: feet`));

    test("1-parameter generic named lambda", () => expect(getUnitTypes(
        `
f = { |a| a }
x :: unit = 3
y = f(x)
`)).toEqual([{
    1: {unit: 1},
    2: {unit: 1},
}, ["a", "x", "y"]]));

    test("generic function where types must equal each other", () => expect(getUnitTypes(
        `
sum(a, b) = a + b
aliceDist :: meters = 19
bobDist = 22
totalDist = sum(aliceDist, bobDist)
`)).toEqual([{
    2: {meters: 1},
    3: {meters: 1},
    4: {meters: 1},
}, ["a", "b", "aliceDist", "bobDist", "totalDist"]]));

    test("can infer type of internal variable", () => expect(getUnitTypes(
        `
speed(dist) = {
  minuteTime = 60
  dist / minuteTime
}
trackLength :: meters = 1000
raceSpeed :: meters/seconds = speed(trackLength)
`)).toEqual([{
    1: {seconds: 1},
    2: {meters: 1},
    3: {meters: 1, seconds: -1},
}, ["dist", "minuteTime", "trackLength", "raceSpeed"]]));

    test("can infer type of lexically closed variable", () => expect(getUnitTypes(
        `
minuteTime = 60
speed(dist) = dist / minuteTime
trackLength :: meters = 1000
raceSpeed :: meters/seconds = speed(trackLength)
`)).toEqual([{
    0: {seconds: 1},
    2: {meters: 1},
    3: {meters: 1, seconds: -1},
}, ["minuteTime", "dist", "trackLength", "raceSpeed"]]));

    test("can type-check lexical closures", () => expect(() => getUnitTypes(
        `
minuteTime :: minutes = 1
speed(dist) = {
  longerTime = minuteTime + 1  // add 1 just to make type checking a little more complex
  dist / longerTime
}
trackLength :: meters = 1000
raceSpeed :: meters/seconds = speed(trackLength)
`)).toThrow(`Conflicting unit types`));

    test("type error inside function body", () => expect(() => getUnitTypes(
        `
f(n) = {
  wealth :: dollars = 1
  conflicting :: pesos = wealth
  n
}
f(10)
`)).toThrow(`Conflicting unit types`));

    test("higher-order function isn't type-checked", () => expect(getUnitTypes(`
apply(f, x) = f(x)
double(x) = 2*x
x :: m = 2
y = apply(double, x)
`)).toEqual([{
    3: {m: 1},
}, ["f", "x", "x", "x", "y"]]));

    test("function whose value isn't known until runtime isn't type-checked", () => expect(getUnitTypes(`
k :: kg = 10
mul(x) = x * k
div(x) = x / k
x :: meters = 25
y :: feet = (x < 10 ? mul : div)(x)
`)).toEqual([{
    0: {kg: 1},
    3: {meters: 1},
    4: {feet: 1},
}, ["k", "x", "x", "x", "y"]]));

    test("implicit return type is inferred from explicit parameter", () => expect(getUnitTypes(
        `
f(a :: meters) = a
x = f(0)
`)).toEqual([{
    0: {meters: 1},
    1: {meters: 1},
}, ["a", "x"]]));

    test("implicit parameter type is inferred from explicit return type", () => expect(getUnitTypes(
        `
f(a) :: meters = a
x = 5
f(x)
`)).toEqual([{
    0: {meters: 1},
    1: {meters: 1},
}, ["a", "x"]]));

    test("implicit parameter type is inferred from squared explicit return type", () => expect(getUnitTypes(
        `
f(a) :: meters*meters = a
x = 5
f(x)
`)).toEqual([{
    0: {meters: 2},
    1: {meters: 2},
}, ["a", "x"]]));

    test("implicit parameter type is inferred when argument is squared", () => expect(getUnitTypes(
        `
f(a) :: meters = a
x = 5
f(x * x)
`)).toEqual([{
    0: {meters: 1},
    1: {meters: 0.5},
}, ["a", "x"]]));

    test("argument contains parameters for outer function", () => expect(getUnitTypes(
        `
f(x) = {
  denom :: seconds = 60
  x / denom
}
wrapper(y) = f(y)
a :: meters = 5
b = wrapper(a)
`)).toEqual([{
    1: {seconds: 1},
    3: {meters: 1},
    4: {meters: 1, seconds: -1},
}, ["x", "denom", "y", "a", "b"]]));

});
