import { HubApiClient } from "@quri/hub-api-client";
import {
  type GuardedSquigglePackages,
  type SquigglePackages,
  versionedSquigglePackages,
  versionSupportsSqProjectV2,
} from "@quri/versioned-squiggle-components";

import { parseSourceId } from "./sourceIds.js";

async function fetchSource(
  sourceId: string,
  hubServer: string = "https://squigglehub.org"
): Promise<string> {
  const { owner, slug } = parseSourceId(sourceId);

  const api = new HubApiClient(hubServer);

  // TODO - configurable server
  return await api.getModelCode(owner, slug);
}

type LinkerOptions = {
  hubServer?: string;
};

function getModernLinker(
  squiggle: GuardedSquigglePackages<typeof versionSupportsSqProjectV2>,
  options: LinkerOptions = {}
) {
  const linker: ReturnType<typeof squiggle.lang.makeSelfContainedLinker> = {
    resolve(name: string) {
      return name;
    },
    async loadModule(sourceId: string) {
      const code = await fetchSource(sourceId, options.hubServer);

      return new squiggle.lang.SqModule({
        name: sourceId,
        code,
      }) as any;
      // Different SqModule types are not compatible, so the union of `SqModule | SqModule` doesn't work.
      // But this should be fine if we're careful because we instantiate the SqModule for `squiggle.lang`.
    },
  };
  return linker;
}

// this type extraction is awkward but it works
type OldSqLinker = NonNullable<
  NonNullable<
    ConstructorParameters<
      Extract<SquigglePackages, { version: "0.9.5" }>["lang"]["SqProject"]
    >[0]
  >["linker"]
>;

function makeOldLinker(hubServer?: string) {
  return {
    resolve: (name: string) => name,
    loadSource: async (sourceId: string) => {
      return await fetchSource(sourceId, hubServer);
    },
  };
}

export function getHubLinker(
  squiggle: Awaited<ReturnType<typeof versionedSquigglePackages>>,
  options: LinkerOptions = {}
) {
  if (versionSupportsSqProjectV2.object(squiggle)) {
    return getModernLinker(squiggle, options);
  } else {
    return makeOldLinker(options.hubServer);
  }
}

export function sqProjectWithHubLinker(
  squiggle: Awaited<ReturnType<typeof versionedSquigglePackages>>,
  options: LinkerOptions = {}
) {
  if (versionSupportsSqProjectV2.object(squiggle)) {
    return new squiggle.lang.SqProject({
      linker: getModernLinker(squiggle) as any,
    });
  } else {
    return new squiggle.lang.SqProject({
      linker: makeOldLinker(options.hubServer),
    });
  }
}
