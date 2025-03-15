import clsx from "clsx";
import { FC, PropsWithChildren } from "react";

const Header: FC<PropsWithChildren> = ({ children }) => {
  return (
    <thead>
      <tr className="border-b bg-gray-50">{children}</tr>
    </thead>
  );
};

const HeaderCell: FC<
  PropsWithChildren<{
    className?: string;
  }>
> = ({ children, className }) => {
  return (
    <th
      className={clsx(
        "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500",
        className
      )}
    >
      {children}
    </th>
  );
};

const Body: FC<PropsWithChildren> = ({ children }) => {
  return (
    <tbody className="divide-y divide-gray-200 bg-white">{children}</tbody>
  );
};

const Row: FC<PropsWithChildren> = ({ children }) => {
  return <tr className={clsx("hover:bg-gray-50")}>{children}</tr>;
};

const Cell: FC<
  PropsWithChildren<{
    theme?: "plain" | "text";
    align?: "top";
  }>
> = ({ children, theme = "plain", align }) => {
  return (
    <td
      className={clsx(
        "px-6 py-4",
        theme === "text" && "text-sm text-gray-500",
        align === "top" && "align-top"
      )}
    >
      {children}
    </td>
  );
};

type TableType = FC<PropsWithChildren> & {
  Header: typeof Header;
  HeaderCell: typeof HeaderCell;
  Body: typeof Body;
  Cell: typeof Cell;
  Row: typeof Row;
};

const Table: TableType = ({ children }) => {
  return (
    <table className={clsx("min-w-full rounded-lg bg-white shadow-md")}>
      {children}
    </table>
  );
};

// Add components as properties of Table
Table.Header = Header;
Table.HeaderCell = HeaderCell;
Table.Body = Body;
Table.Row = Row;
Table.Cell = Cell;

export { Table };
