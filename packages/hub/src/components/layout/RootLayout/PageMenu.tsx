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
  DropdownMenuSeparator,
  PlusIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@quri/ui";

import { PageMenu$key } from "@/__generated__/PageMenu.graphql";
import { useUsername } from "@/hooks/useUsername";
import { SQUIGGLE_DOCS_URL } from "@/lib/common";
import { aboutRoute, newModelRoute } from "@/routes";
import { DesktopUserControls } from "./DesktopUserControls";
import { DropdownWithArrow } from "./DropdownWithArrow";
import { MyGroupsMenu } from "./MyGroupsMenu";
import { MenuLinkModeProps, PageMenuLink } from "./PageMenuLink";
import { UserControlsMenu } from "./UserControlsMenu";
import { useForceChooseUsername } from "./useForceChooseUsername";

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
    <div className="flex gap-6 items-baseline">
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
            <DropdownWithArrow text="My Groups" />
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
      <div className="p-2 cursor-pointer">
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
            className="fixed inset-0 z-10 bg-black opacity-10 overflow-scroll"
            onClick={close}
          />
          {/* sidebar panel */}
          <div className="fixed inset-y-0 right-0 z-20 bg-white shadow-xl overflow-y-auto overflow-x-hidden">
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
    <div className="h-10 px-8 bg-gray-800 flex items-center justify-between">
      <Link className="text-slate-300 font-semibold" href="/">
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
