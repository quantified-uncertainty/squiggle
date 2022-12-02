import { vNumber } from "../../src/value";
import { Bindings } from "../../src/reducer/bindings";
import * as Namespace from "../../src/reducer/Namespace";

describe("Bindings", () => {
  const value = vNumber(1967);
  const bindings = Bindings.make().set("value", value);
  test("get", () => {
    expect(bindings.get("value")).toEqual(value);
  });

  test("get nonexisting value", () => {
    expect(bindings.get("nosuchvalue")).toEqual(undefined);
  });

  test("get on extended", () => {
    expect(bindings.extend().get("value")).toEqual(value);
  });

  test("locals", () => {
    expect(Namespace.get(bindings.locals(), "value")).toEqual(value);
  });

  test("locals on extendeed", () => {
    expect(Namespace.get(bindings.extend().locals(), "value")).toEqual(
      undefined
    );
  });

  describe("extend", () => {
    const value2 = vNumber(5);
    const extendedBindings = bindings.extend().set("value", value2);

    test("get on extended", () => {
      expect(extendedBindings.get("value")).toEqual(value2);
    });

    test("get on original", () => {
      expect(bindings.get("value")).toEqual(value);
    });
  });
});
