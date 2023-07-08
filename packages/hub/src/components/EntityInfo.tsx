import { FC, cloneElement, ReactNode } from "react";
import Link from "next/link";

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

const Entity: FC<entityNode> = ({ slug, href, icon: Icon }) => {
  return (
    <Link
      className="text-lg text-blue-600 hover:underline flex items-center gap-1 group"
      href={href}
      key={href}
    >
      {Icon && (
        <Icon
          className="text-blue-600 opacity-50 group-hover:opacity-100 trantition mr-0.5"
          size={16}
        />
      )}
      {slug}
    </Link>
  );
};

export const EntityInfo: FC<{
  nodes: entityNode[];
}> = ({ nodes }) => {
  const links = nodes.map((node, i) => <Entity {...node} key={i} />);
  const separator = (key: number) => (
    <div key={`s${key}`} className="text-lg text-gray-400 mx-2">
      /
    </div>
  );

  return (
    <div className="flex items-center mr-3">
      <ListWithSeparator items={links} separator={separator} />
    </div>
  );
};
