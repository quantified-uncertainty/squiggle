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
