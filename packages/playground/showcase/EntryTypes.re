type compEntry = {
  mutable id: string,
  title: string,
  render: unit => React.element,
  container: containerType,
}
and folderEntry = {
  mutable id: string,
  title: string,
  children: list(navEntry),
}
and navEntry =
  | CompEntry(compEntry)
  | FolderEntry(folderEntry)
and containerType =
  | FullWidth
  | Sidebar;

let entry = (~title, ~render): navEntry => {
  CompEntry({id: "", title, render, container: FullWidth});
};

// Maybe different api, this avoids breaking changes
let sidebar = (~title, ~render): navEntry => {
  CompEntry({id: "", title, render, container: Sidebar});
};

let folder = (~title, ~children): navEntry => {
  FolderEntry({id: "", title, children});
};
