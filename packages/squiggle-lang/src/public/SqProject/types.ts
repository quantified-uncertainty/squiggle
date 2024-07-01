import { Env } from "../../dists/env.js";
import { ProjectState } from "./ProjectState.js";
import { ModuleHash } from "./SqModule.js";
import { SqModuleOutput } from "./SqModuleOutput.js";

export type ProjectAction =
  | {
      type: "loadImports";
      payload: ModuleHash;
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
        hash: ModuleHash;
      };
    }
  | {
      type: "gc";
    }
  | {
      type: "buildOutputIfPossible";
      payload: {
        hash: ModuleHash;
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

export type Project2EventType = ProjectEventShape["type"];

export class Project2Event<T extends Project2EventType> extends Event {
  constructor(
    type: T,
    public data: Extract<ProjectEventShape, { type: T }>["payload"]
  ) {
    super(type);
  }
}

export type Project2EventListener<T extends Project2EventType> = (
  event: Project2Event<T>
) => void;
