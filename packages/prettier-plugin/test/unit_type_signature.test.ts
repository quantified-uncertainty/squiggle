import { format } from "./helpers.js";

// The tests in this file are timing out in CI.
jest.setTimeout(60000);

describe("unit type signature", () => {
    describe("let", () => {
        test("simple", async () => {
            expect(await format("x::meters = 1")).toBe("x :: meters = 1\n");
        });

        test("multiplication", async () => {
            expect(await format("x :: meters*meters = 2")).toBe("x :: meters*meters = 2\n");
        });

        test("division", async () => {
            expect(await format("x :: meters/seconds = 3")).toBe("x :: meters/seconds = 3\n");
        });

        test("exponentiation", async () => {
            expect(await format("x :: meters^2 = 4")).toBe("x :: meters^2 = 4\n");
        });

        test("complex type", async () => {
            expect(await format("x :: kg*meters/seconds/seconds = 5")).toBe("x :: kg*meters/seconds/seconds = 5\n");
        });

        test("complex type with exponents", async () => {
            expect(await format("x :: kg*meters^2/seconds^3 = 6")).toBe("x :: kg*meters^2/seconds^3 = 6\n");
        });
    });

    describe("defun", () => {
        test("with parameter types", async () => {
            expect(await format("f(x ::euros, y:: pesos) = 11")).toBe("f(x :: euros, y :: pesos) = 11\n");
        });

        test("with return type", async () => {
            expect(await format("f(x) :: dollars = 12")).toBe("f(x) :: dollars = 12\n");
        });

        test("with parameter and return types", async () => {
            expect(await format("f(x ::euros, y:: euros) :: euros = 13")).toBe("f(x :: euros, y :: euros) :: euros = 13\n");
        });
    });

    describe("lambda", () => {
        test("with parameter types", async () => {
            expect(await format("f = { |x :: unitOne, y :: unitTwo| x }")).toBe("f = {|x :: unitOne, y :: unitTwo| x}\n");
        });

        test("with return type", async () => {
            expect(await format("{ |x :: inUnit| x } :: outUnit")).toBe("{|x :: inUnit| x} :: outUnit");
        });

        test("with return type followed by call", async () => {
            expect(await format("{ |x :: inUnit| x } :: outUnit(23)")).toBe("{|x :: inUnit| x} :: outUnit(23)");
        });
    });

});
