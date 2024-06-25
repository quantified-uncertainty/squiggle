import { ModuleOutput } from "./ModuleOutput.js";

export type Project2EventShapes = {
  type: "output";
  payload: {
    output: ModuleOutput;
  };
};

export type Project2EventType = Project2EventShapes["type"];

export class Project2Event<T extends Project2EventType> extends Event {
  constructor(
    type: Project2EventType,
    public data: Extract<Project2EventShapes, { type: T }>["payload"]
  ) {
    super(type);
  }
}

export type Project2EventListener<T extends Project2EventType> = (
  event: Project2Event<T>
) => void;
