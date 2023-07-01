import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { DropdownMenu } from "@quri/ui";

import {
  ModelLayoutQuery,
  ModelLayoutQuery$data,
} from "@/__generated__/ModelLayoutQuery.graphql";
import { EntityLayout } from "@/components/EntityLayout";
import { DotsDropdownButton } from "@/components/ui/DotsDropdownButton";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import {
  modelRevisionsRoute,
  modelRoute,
  modelViewRoute,
  patchModelRoute,
} from "@/routes";
import { DeleteModelAction } from "./DeleteModelAction";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";

// Doing this with a fragment would be too hard, because of how layouts work in Next.js.
// So we have to do two GraphQL queries on most model pages.
const Query = graphql`
  query ModelLayoutQuery($input: QueryModelInput!) {
    model(input: $input) {
      id
      slug
      owner {
        username
      }
      currentRevision {
        # for length; TODO - "hasExports" field?
        relativeValuesExports {
          id
        }
      }
    }
  }
`;

type CommonProps = {
  username: string;
  slug: string;
};

const MenuButton: FC<CommonProps> = ({ username, slug }) => {
  return (
    <DotsDropdownButton>
      {({ close }) => (
        <DropdownMenu>
          <UpdateModelSlugAction
            username={username}
            slug={slug}
            close={close}
          />
          <DeleteModelAction username={username} slug={slug} close={close} />
        </DropdownMenu>
      )}
    </DotsDropdownButton>
  );
};

function useFixModelUrlCasing(model: ModelLayoutQuery$data["model"]) {
  const router = useRouter();
  const pathname = usePathname();

  const patchedPathname = patchModelRoute({
    pathname,
    slug: model.slug,
    username: model.owner.username,
  });
  if (patchedPathname && patchedPathname !== pathname) {
    router.replace(patchedPathname);
  }
}

type Props = PropsWithChildren<CommonProps>;

export const ModelLayout: FC<Props> = ({ username, slug, children }) => {
  const { data: session } = useSession();

  const { model } = useLazyLoadQuery<ModelLayoutQuery>(Query, {
    input: { ownerUsername: username, slug },
  });

  useFixModelUrlCasing(model);

  return (
    <EntityLayout
      slug={slug}
      username={username}
      homepageUrl={modelRoute({ username, slug })}
      isFluid={true}
      headerChildren={
        <>
          <StyledTabLink.List>
            <StyledTabLink
              name="Editor"
              href={modelRoute({ username, slug })}
            />
            {model.currentRevision.relativeValuesExports.length ? (
              <StyledTabLink
                name="Viewer"
                href={modelViewRoute({ username, slug })}
                selected={(pathname, href) =>
                  pathname === href ||
                  pathname.startsWith(
                    modelRoute({ username, slug }) + "/relative-values"
                  )
                }
              />
            ) : null}
            <StyledTabLink
              name="Revisions"
              href={modelRevisionsRoute({ username, slug })}
            />
          </StyledTabLink.List>
          {session?.user.username === username ? (
            <MenuButton username={username} slug={slug} />
          ) : null}
        </>
      }
    >
      {children}
    </EntityLayout>
  );
};
