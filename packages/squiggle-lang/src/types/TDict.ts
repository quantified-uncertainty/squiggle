import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export type DictShape = Record<
  string,
  {
    type: Type;
    deprecated: boolean;
    optional: boolean;
  }
>;

export class TDict extends Type {
  constructor(public shape: DictShape) {
    super();
  }

  check(v: Value) {
    if (v.type !== "Dict") {
      return false;
    }
    const r = v.value;

    for (const [key, { type, optional }] of Object.entries(this.shape)) {
      const subvalue = r.get(key);
      if (subvalue === undefined) {
        if (!optional) {
          return false;
        }
        continue;
      }
      if (!type.check(subvalue)) {
        return false;
      }
    }
    return true;
  }

  serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "Dict",
      shape: Object.fromEntries(
        Object.entries(this.shape).map((kv) => [
          kv[0],
          {
            ...kv[1],
            type: visit.type(kv[1].type),
          },
        ])
      ),
    };
  }

  valueType(key: string) {
    return this.shape[key]?.type;
  }

  toString() {
    return (
      "{" +
      Object.entries(this.shape)
        .filter((kv) => !kv[1].deprecated)
        .map((kv) => `${kv[0]}${kv[1].optional ? "?" : ""}: ${kv[1].type}`)
        .join(", ") +
      "}"
    );
  }

  override defaultFormInputCode() {
    return "{}";
  }

  override defaultFormInputType() {
    return "textArea" as const;
  }
}

export function tDict(shape: DictShape) {
  return new TDict(shape);
}
