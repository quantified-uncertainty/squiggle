"use client";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { FC, PropsWithChildren, ReactNode, useEffect, useState } from "react";

import { Bars3Icon, XIcon } from "@quri/ui";

import { Link } from "@/components/ui/Link";

// TODO - convert this component to RSC with Suspense until the pathname is resolved
export const PageMenuLink: FC<{ name: string; href: string }> = ({
  name,
  href,
}) => {
  const pathname = usePathname();
  const isSelected = pathname === href;

  return (
    <Link href={href}>
      <div
        className={clsx(
          "group mx-2 my-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors duration-75",
          isSelected ? "bg-blue-100" : "bg-white hover:bg-blue-100"
        )}
      >
        <div
          className={clsx(
            "flex-1 text-sm font-medium",
            isSelected
              ? "text-slate-900"
              : "text-slate-500 group-hover:text-slate-900"
          )}
        >
          {name}
        </div>
      </div>
    </Link>
  );
};

export const PageMenuSeparator: FC = () => {
  return <div className="-mx-1 my-1 h-px bg-slate-200" />;
};

export const PageMenuHeader: FC<PropsWithChildren> = ({ children }) => {
  // similar to DropdownMenuHeader
  return (
    <div className="bg-slate-100 px-2 py-1.5 text-sm font-semibold">
      {children}
    </div>
  );
};

export const PageMenu: FC<
  PropsWithChildren<{
    mobileHeader?: ReactNode;
    desktopHeader?: ReactNode;
  }>
> = ({ children, mobileHeader = null, desktopHeader = null }) => {
  const [isOpen, setIsOpen] = useState(false);

  const Icon = isOpen ? XIcon : Bars3Icon;

  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div>
      {/* mobile menu */}
      <div
        className="flex h-12 cursor-pointer items-center justify-between px-2 md:hidden md:px-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="overflow-hidden">{mobileHeader}</div>
        <Icon className="h-5 w-5 text-slate-400 hover:text-slate-500" />
      </div>
      <div className="hidden md:block">{desktopHeader}</div>
      <div
        className={clsx(
          "flex flex-col pb-2 md:pointer-events-auto md:block",
          isOpen ? "block" : "hidden"
        )}
      >
        {children}
      </div>
    </div>
  );
};
