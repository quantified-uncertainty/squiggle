import { Env } from "../../dists/env.js";
import { ProjectState } from "./ProjectState.js";
import { SqModuleOutput } from "./SqModuleOutput.js";

export type ProjectAction =
  | {
      type: "loadImports";
      payload: string;
    }
  | {
      type: "loadModule";
      payload: {
        name: string;
        hash: string | undefined;
      };
    }
  | {
      type: "processModule";
      payload: {
        hash: string;
      };
    }
  | {
      type: "gc";
    }
  | {
      type: "buildOutputIfPossible";
      payload: {
        hash: string;
        environment: Env;
      };
    };

export type ProjectEventShape =
  | {
      type: "output";
      payload: {
        output: SqModuleOutput;
      };
    }
  | {
      type: "action";
      payload: ProjectAction;
    }
  | {
      type: "state";
      payload: ProjectState;
    };

export type ProjectEventType = ProjectEventShape["type"];

export class ProjectEvent<T extends ProjectEventType> extends Event {
  constructor(
    type: T,
    public data: Extract<ProjectEventShape, { type: T }>["payload"]
  ) {
    super(type);
  }
}

export type ProjectEventListener<T extends ProjectEventType> = (
  event: ProjectEvent<T>
) => void;
