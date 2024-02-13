import { Stack } from "../../src/reducer/Stack.js";
import { vNumber } from "../../src/value/index.js";

describe("Stack", () => {
  test("make", () => {
    expect(Stack.make()).toBeInstanceOf(Stack);
  });

  test("get", () => {
    const stack = Stack.make();
    stack.push(vNumber(5));
    stack.push(vNumber(6));
    expect(stack.get(0).toString()).toEqual("6");
    expect(stack.get(1).toString()).toEqual("5");
  });

  test("out of bounds", () => {
    const stack = Stack.make();
    stack.push(vNumber(5));
    stack.push(vNumber(6));
    expect(() => stack.get(2)).toThrow();
    expect(() => stack.get(-1)).toThrow();
  });

  test("size", () => {
    const stack = Stack.make();
    stack.push(vNumber(5));
    stack.push(vNumber(6));
    expect(stack.size()).toBe(2);
    stack.push(vNumber(6));
    expect(stack.size()).toBe(3);
  });

  test("shrink", () => {
    const stack = Stack.make();
    stack.push(vNumber(5));
    stack.push(vNumber(6));
    stack.push(vNumber(6));
    expect(stack.size()).toBe(3);
    stack.shrink(2);
    expect(stack.size()).toBe(2);
    expect(stack.get(0).toString()).toBe("6");
  });
});
