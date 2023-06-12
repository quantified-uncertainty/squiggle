export function chooseUsernameRoute() {
  return "/settings/choose-username";
}

export function modelRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/models/${slug}`;
}

export function modelForRelativeValuesExportRoute({
  username,
  slug,
  variableName,
  mode = "list",
}: {
  username: string;
  slug: string;
  variableName: string;
  mode?: "list" | "grid" | "plot";
}) {
  const baseRoute = `/users/${username}/models/${slug}/relative-values/${variableName}`;
  switch (mode) {
    case "list":
      return baseRoute;
    default:
      return `${baseRoute}/${mode}`;
  }
}

export function modelViewRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/models/${slug}/view`;
}

export function modelRevisionsRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/models/${slug}/revisions`;
}

export function modelRevisionRoute({
  username,
  slug,
  revisionId,
}: {
  username: string;
  slug: string;
  revisionId: string;
}) {
  return `/users/${username}/models/${slug}/revisions/${revisionId}`;
}

export function relativeValuesRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/relative-values/${slug}`;
}

export function relativeValuesEditRoute(props: {
  username: string;
  slug: string;
}) {
  return relativeValuesRoute(props) + "/edit";
}

export function userRoute({ username }: { username: string }) {
  return `/users/${username}`;
}

export function newModelRoute() {
  return "/new/model";
}

export function newDefinitionRoute() {
  return "/new/definition";
}

export function graphqlAPIRoute() {
  return graphqlPlaygroundRoute();
}

export function graphqlPlaygroundRoute(query?: string) {
  const paramsString =
    query === undefined
      ? ""
      : "?" +
        new URLSearchParams({
          query,
        }).toString();

  return `/api/graphql${paramsString}`;
}
