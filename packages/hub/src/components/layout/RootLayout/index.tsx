import { FC, PropsWithChildren, Suspense } from "react";

import { auth } from "@/auth";
import { Link } from "@/components/ui/Link";
import { loadGroupCards } from "@/server/groups/data/card";

import { ReactRoot } from "../../ReactRoot";
import { PageFooterIfNecessary } from "./PageFooterIfNecessary";
import { PageMenu } from "./PageMenu";

const WrappedPageMenu: FC = async () => {
  // TODO - we wait for the session, and then we do another GraphQL query in
  // `<PageMenu />`, sequentially.  We could select all relevant session data
  // through GraphQL, or avoid GraphQL queries altogether.
  const session = await auth();
  const username = session?.user?.username;
  const groups = username
    ? await loadGroupCards({ username: session?.user?.username })
    : { items: [] };

  return <PageMenu session={session} groups={groups} />;
};

const InnerRootLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex h-10 items-center justify-between bg-gray-800 px-8">
        <Link className="font-semibold text-slate-300" href="/">
          Squiggle Hub
        </Link>
        {/* Top menu is not essential for fetching and rendering other content, so we render it in a Suspense boundary */}
        <Suspense fallback={null}>
          <WrappedPageMenu />
        </Suspense>
      </div>
      <div
        // This allows us to center children vertically if necessary, e.g. in `not-found.tsx`.
        // Note that setting `height: 100%` instead of `flex-1` on children won't work;
        // see https://stackoverflow.com/questions/8468066/child-inside-parent-with-min-height-100-not-inheriting-height for details.
        className="flex flex-1 flex-col"
      >
        {children}
      </div>
      <PageFooterIfNecessary />
    </div>
  );
};

export const RootLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ReactRoot>
      <InnerRootLayout>{children}</InnerRootLayout>
    </ReactRoot>
  );
};
