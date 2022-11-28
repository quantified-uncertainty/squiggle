import { vNumber } from "../../src/value";
import * as Namespace from "../../src/reducer/Namespace";

describe("Namespace", () => {
  const value = vNumber(5);
  const v2 = vNumber(2);
  const ns = Namespace.set(Namespace.make(), "value", value);

  test("get", () => {
    expect(Namespace.get(ns, "value")).toEqual(value);
  });

  test("get nonexisting value", () => {
    expect(Namespace.get(ns, "nosuchvalue")).toEqual(undefined);
  });

  test("set", () => {
    const ns2 = Namespace.set(ns, "v2", v2);
    expect(Namespace.get(ns2, "v2")).toEqual(v2);
  });

  test("immutable", () => {
    Namespace.set(ns, "v2", vNumber(2));
    expect(Namespace.get(ns, "v2")).toEqual(undefined);
  });

  describe("merge many", () => {
    const x1 = vNumber(10);
    const x2 = vNumber(20);
    const x3 = vNumber(30);
    const x4 = vNumber(40);
    const ns1 = Namespace.set(
      Namespace.set(Namespace.make(), "x1", x1),
      "x2",
      x2
    );
    const ns2 = Namespace.set(
      Namespace.set(Namespace.make(), "x3", x3),
      "x4",
      x4
    );

    const nsMerged = Namespace.mergeMany([ns, ns1, ns2]);

    test("merge many 1", () => {
      expect(Namespace.get(nsMerged, "x1")).toEqual(x1);
    });
    test("merge many 2", () => {
      expect(Namespace.get(nsMerged, "x4")).toEqual(x4);
    });
    test("merge many 3", () => {
      expect(Namespace.get(nsMerged, "value")).toEqual(value);
    });
  });
});
