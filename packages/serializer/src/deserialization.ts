import { CodecConfig } from "./codec.js";
import { BaseShape, Bundle, BundleEntrypoint, Entity } from "./types.js";

// This is an object that's passed to deserialization functions to deserialize a nested node.
export type DeserializationVisitor<Shape extends BaseShape> = {
  [EntityName in keyof Shape]: (id: number) => Entity<Shape, EntityName>;
};

export class DeserializationStore<Shape extends BaseShape> {
  visited: {
    [EntityType in keyof Shape]: Entity<Shape, EntityType>[];
  };
  deserializationVisitor: DeserializationVisitor<Shape>;

  constructor(
    public bundle: Bundle<Shape>,
    config: CodecConfig<Shape>
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
  ): Entity<Shape, EntityType> {
    return this.deserializationVisitor[entrypoint.entityType](entrypoint.pos);
  }
}
