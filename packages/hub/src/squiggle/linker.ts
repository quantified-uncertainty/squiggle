import { z } from "zod";

import { SqLinker, SqModule } from "@quri/squiggle-lang";
import {
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

const linker: SqLinker = {
  resolve(name) {
    return name;
  },
  async loadModule(sourceId: string) {
    const { owner, slug } = parseSourceId(sourceId);

    const data = await fetch(
      `/api/get-source?${new URLSearchParams({ owner, slug })}`
    ).then((res) => res.json());

    const parsed = z.object({ code: z.string() }).safeParse(data);
    if (!parsed.success) {
      throw new Error(`Failed to fetch source for ${sourceId}`);
    }

    return new SqModule({
      name: sourceId,
      code: parsed.data.code,
    });
  },
};

const oldLinker: OldSqLinker = {
  resolve: (name) => name,
  loadSource: async (sourceId: string) => {
    return (await linker.loadModule(sourceId)).code;
  },
};

// export directly from versioned-components?
type SquigglePackages = Awaited<ReturnType<typeof versionedSquigglePackages>>;

// this type extraction is awkward but it works
type OldSqLinker = NonNullable<
  NonNullable<
    ConstructorParameters<
      Extract<SquigglePackages, { version: "0.9.5" }>["lang"]["SqProject"]
    >[0]
  >["linker"]
>;

export function getHubLinker(
  squiggle: Awaited<ReturnType<typeof versionedSquigglePackages>>
) {
  if (versionSupportsSqProjectV2.plain(squiggle.version)) {
    return linker;
  } else {
    return oldLinker;
  }
}

export function sqProjectWithHubLinker(
  squiggle: Awaited<ReturnType<typeof versionedSquigglePackages>>
) {
  if (versionSupportsSqProjectV2.object(squiggle)) {
    return new squiggle.lang.SqProject({ linker });
  } else {
    return new squiggle.lang.SqProject({ linker: oldLinker });
  }
}
