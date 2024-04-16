import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { FC, useState } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import {
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

import { useUsername } from "@/hooks/useUsername";
import { SQUIGGLE_DOCS_URL } from "@/lib/common";
import { aboutRoute, newModelRoute } from "@/routes";

import { GlobalSearch } from "../../GlobalSearch";
import { DesktopUserControls } from "./DesktopUserControls";
import { DropdownWithArrow } from "./DropdownWithArrow";
import { MyGroupsMenu } from "./MyGroupsMenu";
import { MenuLinkModeProps, PageMenuLink } from "./PageMenuLink";
import { useForceChooseUsername } from "./useForceChooseUsername";
import { UserControlsMenu } from "./UserControlsMenu";

import { PageMenu$key } from "@/__generated__/PageMenu.graphql";

const AboutMenuLink: FC<MenuLinkModeProps> = (props) => {
  const { data: session } = useSession();
  if (session) {
    return null;
  }
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

const NewModelMenuLink: FC<MenuLinkModeProps> = (props) => {
  const { data: session } = useSession();
  if (!session) {
    return null;
  }
  return (
    <PageMenuLink
      {...props}
      href={newModelRoute()}
      icon={PlusIcon}
      title="New Model"
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
};

const DesktopMenu: FC<MenuProps> = ({ queryRef }) => {
  const { data: session } = useSession();
  const menu = useFragment(fragment, queryRef);
  return (
    <div className="flex items-center gap-4">
      <GlobalSearch />
      <AboutMenuLink mode="desktop" />
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
        </>
      ) : null}
      <DesktopUserControls />
    </div>
  );
};

const MobileMenu: FC<MenuProps> = ({ queryRef }) => {
  const menu = useFragment(fragment, queryRef);

  const username = useUsername();
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
              <NewModelMenuLink mode="mobile" close={close} />
              <AboutMenuLink mode="mobile" close={close} />
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

export const PageMenu: FC<MenuProps> = ({ queryRef }) => {
  useForceChooseUsername();

  return (
    <div className="flex h-10 items-center justify-between bg-gray-800 px-8">
      <Link className="font-semibold text-slate-300" href="/">
        Squiggle Hub
      </Link>
      <div className="hidden md:block">
        <DesktopMenu queryRef={queryRef} />
      </div>
      <div className="block md:hidden">
        <MobileMenu queryRef={queryRef} />
      </div>
    </div>
  );
};
