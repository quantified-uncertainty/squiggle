"use client";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { FC, PropsWithChildren, useState } from "react";

import { DotsHorizontalIcon } from "@quri/ui";

import { Link } from "@/components/ui/Link";

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
          "group m-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors duration-75",
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

export const PageMenu: FC<PropsWithChildren> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div
        className="flex h-12 cursor-pointer items-center justify-end md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <DotsHorizontalIcon className="h-6 w-6 text-slate-500" />
      </div>
      <div
        className={clsx(
          "flex flex-col md:pointer-events-auto md:block",
          isOpen ? "block" : "hidden"
        )}
      >
        {children}
      </div>
    </div>
  );
};
