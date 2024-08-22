import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { ImmutableMap } from "../utility/immutable.js";
import { Value, vDict } from "../value/index.js";
import { UnwrapType } from "./helpers.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

type OptionalType<T extends Type<unknown>> = Type<UnwrapType<T> | null>;

export type DetailedEntry<K extends string, V extends Type<any>> = {
  key: K;
  type: V;
  optional?: boolean;
  deprecated?: boolean;
};

type SimpleEntry<K extends string, V extends Type<any>> = [K, V];

type DictEntry<K extends string, V extends Type<any>> =
  | DetailedEntry<K, V>
  | SimpleEntry<K, V>;

export type DictEntryKey<T extends DictEntry<any, any>> =
  T extends DetailedEntry<infer K, any>
    ? K
    : T extends SimpleEntry<infer K, any>
      ? K
      : never;

type DictEntryType<T extends DictEntry<any, any>> =
  T extends DetailedEntry<any, infer Type>
    ? T extends { optional: true }
      ? OptionalType<Type>
      : Type
    : T extends SimpleEntry<any, infer Type>
      ? Type
      : never;

type BaseKVList = DictEntry<any, Type<any>>[];

// The complex generic type here allows us to construct the correct type parameter based on the input types.
export type KVListToDict<KVList extends BaseKVList> = {
  [Key in DictEntryKey<KVList[number]>]: UnwrapType<
    DictEntryType<Extract<KVList[number], [Key, unknown] | { key: Key }>>
  >;
};

export class TDict<const KVList extends BaseKVList> extends Type<
  KVListToDict<KVList>
> {
  kvs: DetailedEntry<string, Type<unknown>>[];

  constructor(kvEntries: [...{ [K in keyof KVList]: KVList[K] }]) {
    super();
    this.kvs = kvEntries.map(
      (kv): DetailedEntry<string, Type<unknown>> =>
        "key" in kv
          ? kv
          : {
              key: kv[0],
              type: kv[1],
              optional: false,
              deprecated: false,
            }
    );
  }

  check(v: Value) {
    if (v.type !== "Dict") {
      return false;
    }
    const r = v.value;

    for (const kv of this.kvs) {
      const subvalue = r.get(kv.key);
      if (subvalue === undefined) {
        if (!kv.optional) {
          return false;
        }
        continue;
      }
      if (!kv.type.check(subvalue)) {
        return false;
      }
    }
    return true;
  }

  unpack(v: Value) {
    // extra keys are allowed

    if (v.type !== "Dict") {
      return undefined;
    }
    const r = v.value;

    const result: { [k: string]: any } = {};

    for (const kv of this.kvs) {
      const subvalue = r.get(kv.key);
      if (subvalue === undefined) {
        if (kv.optional) {
          // that's ok!
          continue;
        }
        return undefined;
      }
      const unpackedSubvalue = kv.type.unpack(subvalue);
      if (unpackedSubvalue === undefined) {
        return undefined;
      }
      result[kv.key] = unpackedSubvalue;
    }
    return result as KVListToDict<KVList>; // that's ok, we've checked the types in the class type
  }

  pack(v: KVListToDict<KVList>) {
    return vDict(
      ImmutableMap(
        this.kvs
          .filter((kv) => !kv.optional || (v as any)[kv.key] !== null)
          .map((kv) => [kv.key, kv.type.pack((v as any)[kv.key])])
      )
    );
  }

  serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "Dict",
      kvs: this.kvs.map((kv) => ({
        ...kv,
        type: visit.type(kv.type),
      })),
    };
  }

  valueType(key: string) {
    const kv = this.kvs.find((kv) => kv.key === key);
    if (!kv) {
      return undefined;
    }
    return kv.type;
  }

  toString() {
    return (
      "{" +
      this.kvs
        .filter((kv) => !kv.deprecated)
        .map((kv) => `${kv.key}${kv.optional ? "?" : ""}: ${kv.type}`)
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

export function tDict<const KVList extends BaseKVList>(
  ...allKvs: [...{ [K in keyof KVList]: KVList[K] }]
) {
  return new TDict(allKvs);
}
