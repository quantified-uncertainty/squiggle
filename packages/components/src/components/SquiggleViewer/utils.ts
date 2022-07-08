export type ItemSettings = {
  collapsed: boolean;
};
export type Path = string[];

export const pathAsString = (path: Path) => path.join(".");
