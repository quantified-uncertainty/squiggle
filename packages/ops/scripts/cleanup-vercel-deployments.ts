import { z } from "zod";

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

const teamId = "quantified-uncertainty";
const project = "quri-hub";
const keepDays = 3;

type ApiParams = ConstructorParameters<typeof URLSearchParams>[0];

async function apiCall(method: string, endpoint: string, params?: ApiParams) {
  let url = `https://api.vercel.com/${endpoint}`;
  if (params) {
    url += `?${new URLSearchParams(params)}`;
  }
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${VERCEL_API_TOKEN}`,
    },
  });
  const json = (await response.json()) as unknown;
  if (typeof json !== "object" || !json) {
    throw new Error(`Expected object, got: ${json}`);
  }
  if ("error" in json) {
    throw new Error(JSON.stringify(json));
  }
  if (process.env.DEBUG) {
    console.log(json);
  }
  return json;
}

const singleDeploymentSchema = z.object({
  id: z.string(),
  recommendedUnit: z.nullable(z.string()).optional(),
  createdAt: z.number(),
});

async function findCurrentProductionDeployment() {
  // https://vercel.com/docs/rest-api/endpoints#get-a-deployment-by-id-or-url
  const json = await apiCall("GET", "v13/deployments/squigglehub.org", {
    teamId,
    state: "READY",
    target: "production",
  });

  return singleDeploymentSchema.parse(json);
}

const paginationSchema = z.object({
  next: z.nullable(z.number()),
});

const deploymentsSchema = z.object({
  pagination: paginationSchema,
  deployments: z.array(
    z.object({
      uid: z.string(),
      name: z.string(),
      created: z.number(),
      meta: z.object({
        githubCommitRef: z.string(),
      }),
    })
  ),
});

type Deployment = z.infer<typeof deploymentsSchema>["deployments"][number];

async function deleteDeployment(deployment: Deployment) {
  // https://vercel.com/docs/rest-api/endpoints#delete-a-deployment
  if (deployment.name !== project) {
    throw new Error(
      `Expected a deployment from ${project}, got: ${deployment.name}`
    );
  }
  console.log(
    `Deleting ${deployment.uid}, branch ${deployment.meta.githubCommitRef}`
  );
  await apiCall("DELETE", `/v13/deployments/${deployment.uid}`, { teamId });
}

async function* fetchDeployments(params: Record<string, string>) {
  // https://vercel.com/docs/rest-api/endpoints#list-deployments
  let pageParams: ApiParams = { ...params };
  while (1) {
    const json = await apiCall("GET", "v6/deployments", pageParams);

    const response = deploymentsSchema.parse(json);
    for (const deployment of response.deployments) {
      yield deployment;
    }
    if (response.pagination.next) {
      pageParams.until = String(response.pagination.next);
    } else {
      break;
    }
  }
}

async function cleanupOldProductionDeployments() {
  const currentDeployment = await findCurrentProductionDeployment();

  for await (const deployment of fetchDeployments({
    teamId,
    app: project,
    target: "production",
  })) {
    if (deployment.uid === currentDeployment.id) {
      // this is a current deployment
      console.log(`Keeping ${deployment.uid}, it's a current deployement`);
      continue;
    }

    if (deployment.created >= currentDeployment.createdAt) {
      // too fresh, there might be a race condition and this is the real current deployment
      console.log(
        `Keeping ${deployment.uid}, it was created after current deployment`
      );
      continue;
    }

    if (
      deployment.created >=
      currentDeployment.createdAt - 86_400_000 * keepDays
    ) {
      console.log(`Keeping ${deployment.uid}, it's too fresh`);
      continue;
    }

    await deleteDeployment(deployment);
  }
}

async function cleanupOldPreviewDeployments() {
  const now = new Date().getTime();
  for await (const deployment of fetchDeployments({
    teamId,
    app: project,
    target: "preview",
  })) {
    if (deployment.created >= now - 86400 * keepDays) {
      console.log(`Keeping ${deployment.uid}, it's too fresh`);
      continue;
    }

    await deleteDeployment(deployment);
  }
}

async function main() {
  await cleanupOldProductionDeployments();
  await cleanupOldPreviewDeployments();
}

main();
