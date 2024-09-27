export type JsonValue = string | number | boolean | null | readonly JsonValue[] | {
    [key: string]: JsonValue;
};
type BaseShape = Record<string, [
    unknown,
    JsonValue
]>;
type Node<Shape extends BaseShape, Name extends keyof Shape> = Shape[Name][0];
type SerializedNode<Shape extends BaseShape, Name extends keyof Shape> = Shape[Name][1];
export type SerializationVisitor<Shape extends BaseShape> = {
    [EntityName in keyof Shape]: (node: Node<Shape, EntityName>) => number;
};
export type DeserializationVisitor<Shape extends BaseShape> = {
    [EntityName in keyof Shape]: (id: number) => Node<Shape, EntityName>;
};
type EntityCodec<Shape extends BaseShape, EntityType extends keyof Shape> = {
    serialize: (node: Node<Shape, EntityType>, visitor: SerializationVisitor<Shape>) => SerializedNode<Shape, EntityType>;
    deserialize: (serializedNode: SerializedNode<Shape, EntityType>, visitor: DeserializationVisitor<Shape>) => Node<Shape, EntityType>;
};
export type StoreConfig<Shape extends BaseShape> = {
    [EntityType in keyof Shape]: EntityCodec<Shape, EntityType>;
};
declare class EntitySerializationStore<Shape extends BaseShape, EntityType extends keyof Shape> {
    private config;
    index: Map<Node<Shape, EntityType>, number>;
    data: SerializedNode<Shape, EntityType>[];
    constructor(config: EntityCodec<Shape, EntityType>);
    serialize(node: Node<Shape, EntityType>, visitor: SerializationVisitor<Shape>): number;
}
type EntityStores<Shape extends BaseShape> = {
    [EntityType in keyof Shape]: EntitySerializationStore<Shape, EntityType>;
};
export type BundleEntrypoint<Shape extends BaseShape, EntityType extends keyof Shape> = {
    entityType: EntityType;
    pos: number;
};
export type Bundle<Shape extends BaseShape> = {
    [EntityType in keyof Shape]: SerializedNode<Shape, EntityType>[];
};
export declare class SerializationStore<Shape extends BaseShape> {
    stores: EntityStores<Shape>;
    serializationVisitor: SerializationVisitor<Shape>;
    constructor(config: StoreConfig<Shape>);
    serialize<EntityType extends keyof Shape>(entityType: EntityType, node: Node<Shape, EntityType>): BundleEntrypoint<Shape, EntityType>;
    getBundle(): Bundle<Shape>;
}
export declare class DeserializationStore<Shape extends BaseShape> {
    bundle: Bundle<Shape>;
    visited: {
        [EntityType in keyof Shape]: Node<Shape, EntityType>[];
    };
    deserializationVisitor: DeserializationVisitor<Shape>;
    constructor(bundle: Bundle<Shape>, config: StoreConfig<Shape>);
    deserialize<const EntityType extends keyof Shape>(entrypoint: BundleEntrypoint<Shape, EntityType>): Node<Shape, EntityType>;
}
type Codec<Shape extends BaseShape> = {
    makeSerializer: () => SerializationStore<Shape>;
    makeDeserializer: (bundle: Bundle<Shape>) => DeserializationStore<Shape>;
};
export declare function makeCodec<Shape extends BaseShape>(config: StoreConfig<Shape>): Codec<Shape>;
export {};
//# sourceMappingURL=index.d.ts.map