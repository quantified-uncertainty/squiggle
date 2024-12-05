import { FC } from "react";

import { EmptyIcon } from "@quri/ui";

import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { Link } from "@/components/ui/Link";
import { IconProps } from "@/relative-values/components/ui/icons/Icon";

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
  prefetch?: boolean;
} & MenuLinkModeProps;

export const PageMenuLink: FC<Props> = ({
  mode,
  close,
  title,
  icon,
  href,
  external,
  prefetch,
}) => {
  const Icon = icon;
  return mode === "desktop" ? (
    <Link
      className="select-none rounded-md px-2 py-1 text-sm text-white hover:bg-slate-700"
      href={href}
      target={external ? "_blank" : undefined}
      prefetch={prefetch}
    >
      {Icon && <Icon className="mr-1 inline-block text-slate-400" size={14} />}
      {title}
    </Link>
  ) : (
    <DropdownMenuNextLinkItem
      href={href}
      icon={icon ?? EmptyIcon}
      title={title}
      close={close}
      prefetch={prefetch}
    />
  );
};
