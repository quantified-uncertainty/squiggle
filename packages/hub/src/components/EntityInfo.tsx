import { FC, cloneElement, ReactNode } from "react";
import Link from "next/link";

import { clsx } from "clsx";
import { IconProps } from "@/relative-values/components/ui/icons/Icon";

// works both for models and for definitions
export type entityNode = {
  slug: string;
  href: string;
  icon?: FC<IconProps>;
};

const ListWithSeparator: React.FC<{
  items: ReactNode[];
  separator: (r: number) => ReactNode;
}> = ({ items, separator }) => {
  return items.reduce<React.ReactNode[]>((accumulator, item, index) => {
    const isLastItem = index === items.length - 1;
    return isLastItem
      ? [...accumulator, item]
      : [...accumulator, item, separator(index)];
  }, []);
};

const Entity: FC<entityNode & { isLast: boolean }> = ({
  slug,
  href,
  icon: Icon,
  isLast,
}) => {
  return (
    <Link
      className={clsx(
        "text-lg text-slate-700 hover:underline flex items-center gap-1 group pt-1 py-2 px-3",
        isLast ? "font-semibold" : ""
      )}
      href={href}
      key={href}
    >
      {Icon && (
        <Icon
          className="text-slate-600 opacity-50 group-hover:opacity-100 trantition mr-1"
          size={18}
        />
      )}
      {slug}
    </Link>
  );
};

export const EntityInfo: FC<{
  nodes: entityNode[];
}> = ({ nodes }) => {
  const links = nodes.map((node, i) => (
    <Entity {...node} key={i} isLast={i === nodes.length - 1} />
  ));
  const separator = (key: number) => (
    <div key={`s${key}`} className="text-lg text-gray-300">
      /
    </div>
  );

  return (
    <div className="flex items-center mr-3">
      <ListWithSeparator items={links} separator={separator} />
    </div>
  );
};
