"use client";
import { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { FC, useState } from "react";
import { useFragment, useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import {
  BoltIcon,
  BookOpenIcon,
  DotsHorizontalIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuAsyncActionItem,
  DropdownMenuHeader,
  PlusIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@quri/ui";

import { SQUIGGLE_DOCS_URL } from "@/lib/common";
import { aboutRoute, aiRoute, newModelRoute } from "@/routes";

import { GlobalSearch } from "../../GlobalSearch";
import { DesktopUserControls } from "./DesktopUserControls";
import { DropdownWithArrow } from "./DropdownWithArrow";
import { MyGroupsMenu } from "./MyGroupsMenu";
import { MenuLinkModeProps, PageMenuLink } from "./PageMenuLink";
import { useForceChooseUsername } from "./useForceChooseUsername";
import { UserControlsMenu } from "./UserControlsMenu";

import { PageMenu$key } from "@/__generated__/PageMenu.graphql";
import { PageMenuQuery } from "@/__generated__/PageMenuQuery.graphql";

const AboutMenuLink: FC<MenuLinkModeProps> = (props) => {
  return <PageMenuLink {...props} href={aboutRoute()} title="About" />;
};

const DocsMenuLink: FC<MenuLinkModeProps> = (props) => (
  <PageMenuLink
    {...props}
    href={SQUIGGLE_DOCS_URL}
    icon={BookOpenIcon}
    title="Docs"
    external
  />
);

const AiMenuLink: FC<MenuLinkModeProps> = (props) => (
  <PageMenuLink {...props} href={aiRoute()} icon={BoltIcon} title="AI" />
);

const NewModelMenuLink: FC<MenuLinkModeProps> = (props) => {
  return (
    <PageMenuLink
      {...props}
      href={newModelRoute()}
      icon={PlusIcon}
      title="New Model"
      prefetch
    />
  );
};

const fragment = graphql`
  fragment PageMenu on Query
  @argumentDefinitions(signedIn: { type: "Boolean!" }) {
    ...MyGroupsMenu @include(if: $signedIn)
  }
`;

type MenuProps = {
  queryRef: PageMenu$key;
  session: Session | null;
};

const DesktopMenu: FC<MenuProps> = ({ queryRef, session }) => {
  const menu = useFragment(fragment, queryRef);
  return (
    <div className="flex items-center gap-4">
      <GlobalSearch />
      {!session && <AboutMenuLink mode="desktop" />}
      <DocsMenuLink mode="desktop" />
      {session ? (
        <>
          <NewModelMenuLink mode="desktop" />
          <Dropdown
            render={({ close }) => (
              <DropdownMenu>
                <MyGroupsMenu groupsRef={menu} close={close} />
              </DropdownMenu>
            )}
          >
            <DropdownWithArrow text="Groups" />
          </Dropdown>
          <AiMenuLink mode="desktop" />
        </>
      ) : null}
      <DesktopUserControls session={session} />
    </div>
  );
};

const MobileMenu: FC<MenuProps> = ({ queryRef, session }) => {
  const menu = useFragment(fragment, queryRef);

  const username = session?.user?.username;
  const [open, setOpen] = useState(false);

  const Icon = username ? UserCircleIcon : DotsHorizontalIcon;

  const close = () => setOpen(false);
  return (
    <div>
      <div className="cursor-pointer p-2">
        <Icon
          size={20}
          className="text-slate-100"
          onClick={() => setOpen(true)}
        />
      </div>
      {open && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 z-10 overflow-scroll bg-black opacity-10"
            onClick={close}
          />
          {/* sidebar panel */}
          <div className="fixed inset-y-0 right-0 z-20 overflow-y-auto overflow-x-hidden bg-white shadow-xl">
            <DropdownMenu>
              <DropdownMenuHeader>Menu</DropdownMenuHeader>
              {session && <NewModelMenuLink mode="mobile" close={close} />}
              {!session && <AboutMenuLink mode="mobile" close={close} />}
              <DocsMenuLink mode="mobile" close={close} />
              {username ? (
                <>
                  <MyGroupsMenu groupsRef={menu} close={close} />
                  <UserControlsMenu
                    mode="mobile"
                    username={username}
                    close={close}
                  />
                </>
              ) : (
                <>
                  <DropdownMenuHeader>User Actions</DropdownMenuHeader>
                  <DropdownMenuAsyncActionItem
                    title="Sign In"
                    icon={SignOutIcon}
                    onClick={signIn}
                    close={close}
                  />
                </>
              )}
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
};

export const PageMenu: FC<{ session: Session | null }> = ({ session }) => {
  // TODO - if redirecting, return a custom menu; right now we render the
  // confused version where "New Model" button is visible, but "Sign In" button
  // is visible too
  useForceChooseUsername(session);

  const queryRef = useLazyLoadQuery<PageMenuQuery>(
    graphql`
      query PageMenuQuery($signedIn: Boolean!) {
        ...PageMenu @arguments(signedIn: $signedIn)
      }
    `,
    { signedIn: !!session }
  );

  return (
    <>
      <div className="hidden md:block">
        <DesktopMenu queryRef={queryRef} session={session} />
      </div>
      <div className="block md:hidden">
        <MobileMenu queryRef={queryRef} session={session} />
      </div>
    </>
  );
};
