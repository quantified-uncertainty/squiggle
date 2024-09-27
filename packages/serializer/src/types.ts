export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { [key: string]: JsonValue };

/**
 * This is a main type of serializer-deserializer ("codec") system.
 *
 * Other types are derived from it.
 */
export type BaseShape = Record<
  string, // entity type name
  [
    unknown, // entity type in typescript (e.g. a class)
    JsonValue, // serialized entity type
  ]
>;

export type Entity<
  Shape extends BaseShape,
  Name extends keyof Shape,
> = Shape[Name][0];

export type SerializedEntity<
  Shape extends BaseShape,
  Name extends keyof Shape,
> = Shape[Name][1];

export type BundleEntrypoint<
  Shape extends BaseShape,
  EntityType extends keyof Shape,
> = {
  entityType: EntityType;
  pos: number;
};

export type Bundle<Shape extends BaseShape> = {
  [EntityType in keyof Shape]: SerializedEntity<Shape, EntityType>[];
};
