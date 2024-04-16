import { JsonValue } from "../utility/typeHelpers.js";

/**
 * This file contains a generic serialization system.
 *
 * Features:
 * - type-safe
 * - supports multiple data types
 * - can serialize any DAG (directed acyclic graph) and deduplicate values
 */

type BaseShape = Record<string, [unknown, JsonValue]>;

export type SerializationVisitor<Shape extends BaseShape> = {
  [K in keyof Shape]: (node: Shape[K][0]) => number;
};

export type DeserializationVisitor<Shape extends BaseShape> = {
  [K in keyof Shape]: (id: number) => Shape[K][0];
};

type EntitySerializer<
  Shape extends BaseShape,
  EntityType extends keyof Shape,
  Node = Shape[EntityType][0],
  SerializedNode = Shape[EntityType][1],
> = {
  serialize: (
    node: Node,
    visitor: SerializationVisitor<Shape>
  ) => SerializedNode;
  deserialize: (
    serializedNode: SerializedNode,
    visitor: DeserializationVisitor<Shape>
  ) => Node;
};

export type StoreConfig<Shape extends BaseShape> = {
  [K in keyof Shape]: EntitySerializer<Shape, K>;
};

class EntitySerializationStore<
  Shape extends BaseShape,
  EntityType extends keyof Shape,
> {
  index: Map<Shape[EntityType][0], number> = new Map();
  // this is an array with serialized values themselves
  data: Shape[EntityType][1][] = [];

  constructor(private config: EntitySerializer<Shape, EntityType>) {}

  serialize(node: Shape[EntityType][0], visitor: SerializationVisitor<Shape>) {
    const cachedId = this.index.get(node);
    if (cachedId !== undefined) {
      return cachedId;
    }

    const serializedValue = this.config.serialize(node, visitor);

    const id = this.data.length;
    this.index.set(node, id);
    this.data.push(serializedValue);
    return id;
  }
}

type EntityStores<Shape extends BaseShape> = {
  [K in keyof Shape]: EntitySerializationStore<Shape, K>;
};

export type BundleEntrypoint<Shape extends BaseShape, T extends keyof Shape> = {
  entityType: T;
  pos: number;
};

export type Bundle<Shape extends BaseShape> = {
  [K in keyof Shape]: Shape[K][1][];
};

export class SerializationStore<Shape extends BaseShape> {
  stores: EntityStores<Shape>;
  serializationVisitor: SerializationVisitor<Shape>;

  constructor(config: StoreConfig<Shape>) {
    this.stores = Object.fromEntries(
      Object.keys(config).map((entityType: keyof typeof config) => [
        entityType,
        new EntitySerializationStore<Shape, typeof entityType>(
          config[entityType]
        ),
      ])
    ) as unknown as EntityStores<Shape>; // the correctness of this type is hard to prove to TypeScript

    this.serializationVisitor = Object.fromEntries(
      Object.keys(config).map((entityType: keyof typeof config) => [
        entityType,
        ((node) =>
          this.stores[entityType].serialize(
            node,
            this.serializationVisitor
          )) satisfies SerializationVisitor<Shape>[typeof entityType],
      ])
    ) as unknown as SerializationVisitor<Shape>;
  }

  serialize<T extends keyof Shape>(
    entityType: T,
    node: Shape[T][0]
  ): BundleEntrypoint<Shape, T> {
    const pos = this.stores[entityType].serialize(
      node,
      this.serializationVisitor
    );
    return {
      entityType,
      pos,
    };
  }

  getBundle(): Bundle<Shape> {
    return Object.fromEntries(
      Object.entries(this.stores).map(([key, store]) => [key, store.data])
    ) as Bundle<Shape>;
  }
}

export class DeserializationStore<Shape extends BaseShape> {
  visited: {
    [K in keyof Shape]: Shape[K][0][];
  };
  deserializationVisitor: DeserializationVisitor<Shape>;

  constructor(
    public bundle: Bundle<Shape>,
    config: StoreConfig<Shape>
  ) {
    this.visited = Object.fromEntries(
      Object.keys(config).map((entityType: keyof typeof config) => [
        entityType,
        [],
      ])
    ) as any;

    this.deserializationVisitor = Object.fromEntries(
      Object.keys(config).map((entityType: keyof typeof config) => [
        entityType,
        (id: number) => {
          if (this.visited[entityType][id] === undefined) {
            if (id >= this.bundle[entityType].length) {
              throw new Error(
                `Out of bounds index ${id}, bundle contains only ${this.bundle[entityType].length} entries of type '${String(entityType)}'`
              );
            }
            const serializedValue = this.bundle[entityType][id];
            this.visited[entityType][id] = config[entityType].deserialize(
              serializedValue,
              this.deserializationVisitor
            );
          }
          return this.visited[entityType][id];
        },
      ])
    ) as unknown as DeserializationVisitor<Shape>;
  }

  deserialize<const T extends keyof Shape>(
    entrypoint: BundleEntrypoint<Shape, T>
  ): Shape[T][0] {
    return this.deserializationVisitor[entrypoint.entityType](entrypoint.pos);
  }
}
