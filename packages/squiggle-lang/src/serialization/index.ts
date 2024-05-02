import { JsonValue } from "../utility/typeHelpers.js";

/**
 * This file contains a generic serialization system.
 *
 * Features:
 * - type-safe
 * - supports multiple data types
 * - can serialize any DAG (directed acyclic graph) and deduplicate values
 * - can serialize multiple values in a single bundle, and deserialize them back based on "entrypoints"
 *
 * Squiggle-specific adaptation of it is in `./squiggle.ts`.
 *
 * Terminology:
 * - "Entity" is a type of data that can be serialized and deserialized (e.g. "value", "expression" for Squiggle); one multi-type codec can handle multiple entities.
 * - "Node" is an instance of an entity type. I use "node" instead of "value" to avoid confusion with the "value" entity type.
 * - "Bundle" is a JSON-serializable object that contains serialized values.
 * - "Entrypoint" is a reference to a serialized value in a bundle. When you add a value to a bundle, you get an entrypoint that you can use to refer to this value later.
 * - "Visitor" is an helper object that can serialize or deserialize nested nodes.
 *
 * To make things easier to understand, you can experiment with running Squiggle code with `embedded-with-serialization` runner and `PRINT_SERIALIZED_BUNDLE=1` enabled.
 * It will print a JSON-serialized bundle to the console.
 * Example: `PRINT_SERIALIZED_BUNDLE=1 pnpm --silent cli run -r embedded-with-serialization -e 'x=2+2;y=[x,x];z()=x'`
 */

/**
 * This is a main type of serializer-deserializer ("codec") system.
 *
 * Other types are derived from it.
 */
type BaseShape = Record<
  string, // entity name
  [
    unknown, // node type
    JsonValue, // serialized node type
  ]
>;

type Node<Shape extends BaseShape, Name extends keyof Shape> = Shape[Name][0];

type SerializedNode<
  Shape extends BaseShape,
  Name extends keyof Shape,
> = Shape[Name][1];

// This is an object that's passed to serialization functions to serialize a nested node.
// Note how it returns a number (id), not `DeserializedNode` - we always store nodes themselves in a bundle, and refer to them by index.
export type SerializationVisitor<Shape extends BaseShape> = {
  [EntityName in keyof Shape]: (node: Node<Shape, EntityName>) => number;
};

// This is an object that's passed to deserialization functions to deserialize a nested node.
export type DeserializationVisitor<Shape extends BaseShape> = {
  [EntityName in keyof Shape]: (id: number) => Node<Shape, EntityName>;
};

// This config is used to describe how an entity type should be serialized and deserialized.
type EntityCodec<Shape extends BaseShape, EntityType extends keyof Shape> = {
  serialize: (
    node: Node<Shape, EntityType>,
    visitor: SerializationVisitor<Shape>
  ) => SerializedNode<Shape, EntityType>;
  deserialize: (
    serializedNode: SerializedNode<Shape, EntityType>,
    visitor: DeserializationVisitor<Shape>
  ) => Node<Shape, EntityType>;
};

// StoreConfig is the primary config for the multi-entity codec. See `squiggleConfig` in `./squiggle.ts` for how it's used.
// It will infer correct parameter types for `serialize` and `deserialize` methods, based on the `Shape` type.
export type StoreConfig<Shape extends BaseShape> = {
  [EntityType in keyof Shape]: EntityCodec<Shape, EntityType>;
};

class EntitySerializationStore<
  Shape extends BaseShape,
  EntityType extends keyof Shape,
> {
  index: Map<Node<Shape, EntityType>, number> = new Map();
  // this is an array with serialized values themselves
  data: SerializedNode<Shape, EntityType>[] = [];

  constructor(private config: EntityCodec<Shape, EntityType>) {}

  serialize(
    node: Node<Shape, EntityType>,
    visitor: SerializationVisitor<Shape>
  ) {
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
  [EntityType in keyof Shape]: EntitySerializationStore<Shape, EntityType>;
};

export type BundleEntrypoint<
  Shape extends BaseShape,
  EntityType extends keyof Shape,
> = {
  entityType: EntityType;
  pos: number;
};

export type Bundle<Shape extends BaseShape> = {
  [EntityType in keyof Shape]: SerializedNode<Shape, EntityType>[];
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

  serialize<EntityType extends keyof Shape>(
    entityType: EntityType,
    node: Node<Shape, EntityType>
  ): BundleEntrypoint<Shape, EntityType> {
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
    [EntityType in keyof Shape]: Node<Shape, EntityType>[];
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

  deserialize<const EntityType extends keyof Shape>(
    entrypoint: BundleEntrypoint<Shape, EntityType>
  ): Node<Shape, EntityType> {
    return this.deserializationVisitor[entrypoint.entityType](entrypoint.pos);
  }
}
