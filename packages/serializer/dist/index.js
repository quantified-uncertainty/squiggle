class EntitySerializationStore {
    constructor(config) {
        this.config = config;
        this.index = new Map();
        this.data = [];
    }
    serialize(node, visitor) {
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
export class SerializationStore {
    constructor(config) {
        this.stores = Object.fromEntries(Object.keys(config).map((entityType) => [
            entityType,
            new EntitySerializationStore(config[entityType]),
        ]));
        this.serializationVisitor = Object.fromEntries(Object.keys(config).map((entityType) => [
            entityType,
            ((node) => this.stores[entityType].serialize(node, this.serializationVisitor)),
        ]));
    }
    serialize(entityType, node) {
        const pos = this.stores[entityType].serialize(node, this.serializationVisitor);
        return {
            entityType,
            pos,
        };
    }
    getBundle() {
        return Object.fromEntries(Object.entries(this.stores).map(([key, store]) => [key, store.data]));
    }
}
export class DeserializationStore {
    constructor(bundle, config) {
        this.bundle = bundle;
        this.visited = Object.fromEntries(Object.keys(config).map((entityType) => [
            entityType,
            [],
        ]));
        this.deserializationVisitor = Object.fromEntries(Object.keys(config).map((entityType) => [
            entityType,
            (id) => {
                if (this.visited[entityType][id] === undefined) {
                    if (id >= this.bundle[entityType].length) {
                        throw new Error(`Out of bounds index ${id}, bundle contains only ${this.bundle[entityType].length} entries of type '${String(entityType)}'`);
                    }
                    const serializedValue = this.bundle[entityType][id];
                    this.visited[entityType][id] = config[entityType].deserialize(serializedValue, this.deserializationVisitor);
                }
                return this.visited[entityType][id];
            },
        ]));
    }
    deserialize(entrypoint) {
        return this.deserializationVisitor[entrypoint.entityType](entrypoint.pos);
    }
}
export function makeCodec(config) {
    return {
        makeSerializer: () => new SerializationStore(config),
        makeDeserializer: (bundle) => new DeserializationStore(bundle, config),
    };
}
//# sourceMappingURL=index.js.map