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

export function modelForDefinitionRoute({
  username,
  slug,
  definition,
}: {
  username: string;
  slug: string;
  definition: {
    username: string;
    slug: string;
  };
}) {
  return `/users/${username}/models/${slug}/for-relative-values/${definition.username}/${definition.slug}`;
}

export function modelEditRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/models/${slug}/edit`;
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

export function relativeValuesEditRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/relative-values/${slug}/edit`;
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
