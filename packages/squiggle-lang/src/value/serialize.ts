import { SerializedValue, Value } from "./index.js";
import { VArray } from "./VArray.js";
import { VBool } from "./VBool.js";
import { VCalculator } from "./VCalculator.js";
import { VDate } from "./VDate.js";
import { VDict } from "./VDict.js";
import { VDist } from "./VDist.js";
import { VDomain } from "./VDomain.js";
import { VDuration } from "./VDuration.js";
import { VInput } from "./VInput.js";
import { VLambda } from "./vLambda.js";
import { VNumber } from "./VNumber.js";
import { VPlot } from "./VPlot.js";
import { VScale } from "./VScale.js";
import { VSpecification } from "./VSpecification.js";
import { VString } from "./VString.js";
import { VTableChart } from "./VTableChart.js";
import { VVoid } from "./VVoid.js";

export type SerializedBundle = {
  values: SerializedValue[];
  pos: number;
};

export class SerializationStorage {
  index: Map<Value, number>;
  values: SerializedValue[];

  constructor() {
    this.index = new Map();
    this.values = [];
  }

  serializeValue(value: Value): number {
    const cachedId = this.index.get(value);
    if (cachedId !== undefined) {
      return cachedId;
    }

    const serializedValue = value.serialize(this);

    const id = this.values.length;
    this.index.set(value, id);
    this.values.push(serializedValue);
    return id;
  }
}

export function serializeValue(value: Value): SerializedBundle {
  const storage = new SerializationStorage();
  const id = storage.serializeValue(value);

  return {
    values: storage.values,
    pos: id,
  };
}

export function deserializeValue(serializedValue: SerializedBundle): Value {
  const { values: nodes } = serializedValue;

  // sparse array
  const visited: Value[] = [];

  const visit = (id: number): Value => {
    if (visited[id] !== undefined) {
      return visited[id];
    }

    const node = nodes[id];
    let value: Value;

    switch (node.type) {
      case "Bool":
        value = VBool.deserialize(node.payload);
        break;
      case "Array":
        value = VArray.deserialize(node.payload, visit);
        break;
      case "Date":
        value = VDate.deserialize(node.payload);
        break;
      case "Number":
        value = VNumber.deserialize(node.payload);
        break;
      case "Lambda":
        value = VLambda.deserialize(node.payload, visit);
        break;
      case "Calculator":
        value = VCalculator.deserialize(node.payload, visit);
        break;
      case "Void":
        value = VVoid.deserialize();
        break;
      case "String":
        value = VString.deserialize(node.payload);
        break;
      case "Dict":
        value = VDict.deserialize(node.payload, visit);
        break;
      case "Input":
        value = VInput.deserialize(node.payload);
        break;
      case "Dist":
        value = VDist.deserialize(node.payload);
        break;
      case "Duration":
        value = VDuration.deserialize(node.payload);
        break;
      case "Plot":
        value = VPlot.deserialize(node.payload);
        break;
      case "Scale":
        value = VScale.deserialize(node.payload);
        break;
      case "TableChart":
        value = VTableChart.deserialize(node.payload, visit);
        break;
      case "Domain":
        value = VDomain.deserialize(node.payload);
        break;
      case "Specification":
        value = VSpecification.deserialize(node.payload, visit);
        break;
      default:
        throw new Error(`Can't deserialize node ${node satisfies never}`);
    }

    visited[id] = value;
    return value;
  };

  return visit(serializedValue.pos);
}
