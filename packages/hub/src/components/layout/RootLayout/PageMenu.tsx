import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { FC, useState } from "react";
import { FaPlus } from "react-icons/fa";

import {
  BookOpenIcon,
  DotsHorizontalIcon,
  DropdownMenu,
  DropdownMenuAsyncActionItem,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  SignOutIcon,
  UserCircleIcon,
} from "@quri/ui";

import { useUsername } from "@/hooks/useUsername";
import { SQUIGGLE_DOCS_URL } from "@/lib/common";
import { aboutRoute, newModelRoute } from "@/routes";
import { DesktopUserControls } from "./DesktopUserControls";
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
      icon={FaPlus}
      title="New Model"
    />
  );
};

const DesktopMenu: FC = () => {
  return (
    <div className="flex gap-6 items-baseline">
      <AboutMenuLink mode="desktop" />
      <DocsMenuLink mode="desktop" />
      <NewModelMenuLink mode="desktop" />
      <DesktopUserControls />
    </div>
  );
};

const MobileMenu: FC = () => {
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
            className="absolute inset-0 z-10 bg-black opacity-10"
            onClick={close}
          />
          {/* sidebar panel */}
          <div className="absolute inset-y-0 right-0 z-20 bg-white shadow-xl">
            <DropdownMenu>
              <DropdownMenuHeader>Menu</DropdownMenuHeader>
              <DropdownMenuSeparator />
              <NewModelMenuLink mode="mobile" close={close} />
              <AboutMenuLink mode="mobile" close={close} />
              <DocsMenuLink mode="mobile" close={close} />
              <DropdownMenuSeparator />
              {username ? (
                <UserControlsMenu
                  mode="mobile"
                  username={username}
                  close={close}
                />
              ) : (
                <>
                  <DropdownMenuHeader>User Actions</DropdownMenuHeader>
                  <DropdownMenuSeparator />
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

export const PageMenu: FC = () => {
  useForceChooseUsername();

  return (
    <div className="border-slate-200 h-10 flex items-center justify-between px-8 bg-gray-800">
      <div className="flex gap-6 items-baseline">
        <Link className="text-slate-300 font-semibold" href="/">
          Squiggle Hub
        </Link>
      </div>
      <div className="hidden md:block">
        <DesktopMenu />
      </div>
      <div className="block md:hidden">
        <MobileMenu />
      </div>
    </div>
  );
};
