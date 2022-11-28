import { vNumber } from "../../src/value";
import * as Bindings from "../../src/reducer/bindings";
import * as Namespace from "../../src/reducer/Namespace";

describe("Bindings", () => {
  const value = vNumber(1967);
  const bindings = Bindings.set(Bindings.make(), "value", value);
  test("get", () => {
    expect(Bindings.get(bindings, "value")).toEqual(value);
  });

  test("get nonexisting value", () => {
    expect(Bindings.get(bindings, "nosuchvalue")).toEqual(undefined);
  });

  test("get on extended", () => {
    expect(Bindings.get(Bindings.extend(bindings), "value")).toEqual(value);
  });

  test("locals", () => {
    expect(Namespace.get(Bindings.locals(bindings), "value")).toEqual(value);
  });

  test("locals on extendeed", () => {
    expect(
      Namespace.get(Bindings.locals(Bindings.extend(bindings)), "value")
    ).toEqual(undefined);
  });

  describe("extend", () => {
    const value2 = vNumber(5);
    const extendedBindings = Bindings.set(
      Bindings.extend(bindings),
      "value",
      value2
    );

    test("get on extended", () => {
      expect(Bindings.get(extendedBindings, "value")).toEqual(value2);
    });

    test("get on original", () => {
      expect(Bindings.get(bindings, "value")).toEqual(value);
    });
  });
});
