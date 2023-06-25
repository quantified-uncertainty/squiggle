import { vNumber } from "../../src/value/index.js";
import { Stack } from "../../src/reducer/stack.js";

describe("Stack", () => {
  test("make", () => {
    expect(Stack.make()).toBeInstanceOf(Stack);
  });

  test("get", () => {
    let stack = Stack.make();
    stack = stack.push("a", vNumber(5));
    stack = stack.push("b", vNumber(6));
    expect(stack.get(0).toString()).toEqual("6");
    expect(stack.get(1).toString()).toEqual("5");
  });

  test("out of bounds", () => {
    let stack = Stack.make();
    stack = stack.push("a", vNumber(5));
    stack = stack.push("b", vNumber(6));
    expect(() => stack.get(2)).toThrow();
    expect(() => stack.get(-1)).toThrow();
  });
});
