import { EntityCodec, StoreConfig } from "./codec.js";
import {
  BaseShape,
  Bundle,
  BundleEntrypoint,
  Node,
  SerializedNode,
} from "./types.js";

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

// This is an object that's passed to serialization functions to serialize a nested node.
// Note how it returns a number (id), not `DeserializedNode` - we always store nodes themselves in a bundle, and refer to them by index.
export type SerializationVisitor<Shape extends BaseShape> = {
  [EntityName in keyof Shape]: (node: Node<Shape, EntityName>) => number;
};
