export type ProjectEventShapes =
  | {
      type: "start-run";
      payload: {
        sourceId: string;
      };
    }
  | {
      type: "end-run";
      payload: {
        sourceId: string;
      };
    };

export type ProjectEventType = ProjectEventShapes["type"];

export class ProjectEvent<T extends ProjectEventType> extends Event {
  constructor(
    type: ProjectEventType,
    public data: Extract<ProjectEventShapes, { type: T }>["payload"]
  ) {
    super(type);
  }
}

export type ProjectEventListener<T extends ProjectEventType> = (
  event: ProjectEvent<T>
) => void;
