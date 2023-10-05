import Link from "next/link";
import { FC } from "react";

import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { IconProps } from "@/relative-values/components/ui/icons/Icon";
import { EmptyIcon } from "@quri/ui";

export type MenuLinkModeProps =
  | {
      mode: "desktop";
      close?: undefined;
    }
  | {
      mode: "mobile";
      close: () => void;
    };

type Props = {
  title: string;
  href: string;
  icon?: FC<IconProps>;
  external?: boolean;
} & MenuLinkModeProps;

export const PageMenuLink: FC<Props> = ({
  mode,
  close,
  title,
  icon,
  href,
  external,
}) => {
  const Icon = icon;
  return mode === "desktop" ? (
    <Link
      className="text-white text-sm hover:bg-slate-700 px-2 py-1 rounded-md select-none"
      href={href}
      target={external ? "_blank" : undefined}
    >
      {Icon && <Icon className="inline-block mr-1 text-slate-400" size={14} />}
      {title}
    </Link>
  ) : (
    <DropdownMenuNextLinkItem
      href={href}
      icon={icon ?? EmptyIcon}
      title={title}
      close={close}
    />
  );
};
