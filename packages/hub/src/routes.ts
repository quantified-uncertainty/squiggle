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

export function userRoute({ username }: { username: string }) {
  return `/users/${username}`;
}

export function newModelRoute() {
  return "/new-model";
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
