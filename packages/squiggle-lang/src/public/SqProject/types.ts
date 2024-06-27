import { Env } from "../../dists/env.js";
import { ModuleOutput } from "./ModuleOutput.js";
import { ProjectState } from "./ProjectState.js";
import { ResolvedModuleHash } from "./ResolvedModule.js";
import { UnresolvedModule, UnresolvedModuleHash } from "./UnresolvedModule.js";

export type Project2Action =
  | {
      type: "loadImports";
      payload: UnresolvedModuleHash;
    }
  | {
      type: "addModule";
      payload: {
        module: UnresolvedModule;
      };
    }
  | {
      type: "loadModule";
      payload: {
        name: string;
        hash: string | undefined;
      };
    }
  | {
      type: "resolveIfPossible";
      payload: {
        hash: UnresolvedModuleHash;
      };
    }
  | {
      type: "buildOutputIfPossible";
      payload: {
        hash: ResolvedModuleHash;
        environment: Env;
      };
    };

export type Project2EventShape =
  | {
      type: "output";
      payload: {
        output: ModuleOutput;
      };
    }
  | {
      type: "action";
      payload: Project2Action;
    }
  | {
      type: "stateChange";
      payload: ProjectState;
    };

export type Project2EventType = Project2EventShape["type"];

export class Project2Event<T extends Project2EventType> extends Event {
  constructor(
    type: T,
    public data: Extract<Project2EventShape, { type: T }>["payload"]
  ) {
    super(type);
  }
}

export type Project2EventListener<T extends Project2EventType> = (
  event: Project2Event<T>
) => void;
