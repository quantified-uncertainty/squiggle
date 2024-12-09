import { z } from "zod";

import {
  type GuardedSquigglePackages,
  type SquigglePackages,
  versionedSquigglePackages,
  versionSupportsSqProjectV2,
} from "@quri/versioned-squiggle-components";

type ParsedSourceId = {
  owner: string;
  slug: string;
};

const PREFIX = "hub";

export function parseSourceId(sourceId: string): ParsedSourceId {
  const match = sourceId.match(/^(\w+):([\w-]+)\/([\w-]+)$/);

  if (!match) {
    throw new Error("Invalid import name");
  }

  const prefix = match[1];
  if (prefix !== PREFIX) {
    throw new Error(`Only ${PREFIX}: imports are supported`);
  }

  const owner = match[2];
  const slug = match[3];

  return { owner, slug };
}

export function serializeSourceId({ owner, slug }: ParsedSourceId): string {
  return `${PREFIX}:${owner}/${slug}`;
}

async function fetchSource(sourceId: string) {
  const { owner, slug } = parseSourceId(sourceId);

  const data = await fetch(
    `/api/get-source?${new URLSearchParams({ owner, slug })}`
  ).then((res) => res.json());
  const parsed = z.object({ code: z.string() }).safeParse(data);
  if (!parsed.success) {
    throw new Error(`Failed to fetch source for ${sourceId}`);
  }

  return parsed.data.code;
}

function getModernLinker(
  squiggle: GuardedSquigglePackages<typeof versionSupportsSqProjectV2>
) {
  const linker: ReturnType<typeof squiggle.lang.makeSelfContainedLinker> = {
    resolve(name: string) {
      return name;
    },
    async loadModule(sourceId: string) {
      const code = await fetchSource(sourceId);

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

const oldLinker: OldSqLinker = {
  resolve: (name: string) => name,
  loadSource: async (sourceId: string) => {
    return await fetchSource(sourceId);
  },
};

export function getHubLinker(
  squiggle: Awaited<ReturnType<typeof versionedSquigglePackages>>
) {
  if (versionSupportsSqProjectV2.object(squiggle)) {
    return getModernLinker(squiggle);
  } else {
    return oldLinker;
  }
}

export function sqProjectWithHubLinker(
  squiggle: Awaited<ReturnType<typeof versionedSquigglePackages>>
) {
  if (versionSupportsSqProjectV2.object(squiggle)) {
    return new squiggle.lang.SqProject({
      linker: getModernLinker(squiggle) as any,
    });
  } else {
    return new squiggle.lang.SqProject({ linker: oldLinker });
  }
}
