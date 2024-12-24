import { FC, PropsWithChildren, Suspense } from "react";

import { AdminControls } from "@/components/admin/AdminControls";
import { AdminProvider } from "@/components/admin/AdminProvider";
import { Link } from "@/components/ui/Link";
import { loadGroupCards } from "@/groups/data/groupCards";
import { auth } from "@/lib/server/auth";
import { isAdminUser } from "@/users/auth";

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

  const isAdmin = session?.user ? isAdminUser(session.user) : false;

  return <PageMenu session={session} groups={groups} isAdmin={isAdmin} />;
};

const InnerRootLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex h-10 items-center justify-between bg-gray-800 px-8">
        <div className="flex items-center gap-2">
          <Link className="font-semibold text-slate-300" href="/">
            Squiggle Hub
          </Link>
          <AdminControls />
        </div>
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
      {/* TODO - find a way to include AdminProvider in ReactRoot (this would require loading the session in ReactRoot) */}
      <AdminProvider>
        <InnerRootLayout>{children}</InnerRootLayout>
      </AdminProvider>
    </ReactRoot>
  );
};
