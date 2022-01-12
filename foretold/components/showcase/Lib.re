open FC.Base;
open EntryTypes;

module HS = Belt.HashMap.String;

let entriesByPath: HS.t(navEntry) = HS.make(~hintSize=100);

/* Creates unique id's per scope based on title */
let buildIds = entries => {
  let genId = (title, path) => {
    let noSpaces = Js.String.replaceByRe([%bs.re "/\\s+/g"], "-", title);
    if (!HS.has(entriesByPath, path ++ "/" ++ noSpaces)) {
      noSpaces;
    } else {
      let rec loop = num => {
        let testId = noSpaces ++ "-" ++ string_of_int(num);
        if (!HS.has(entriesByPath, path ++ "/" ++ testId)) {
          testId;
        } else {
          loop(num + 1);
        };
      };
      loop(2);
    };
  };
  let rec processFolder = (f: folderEntry, curPath) => {
    f.id = curPath ++ "/" ++ genId(f.title, curPath);
    HS.set(entriesByPath, f.id, FolderEntry(f));
    f.children
    |> E.L.iter(e =>
         switch (e) {
         | CompEntry(c) => processEntry(c, f.id)
         | FolderEntry(f) => processFolder(f, f.id)
         }
       );
  }
  and processEntry = (c: compEntry, curPath) => {
    c.id = curPath ++ "/" ++ genId(c.title, curPath);
    HS.set(entriesByPath, c.id, CompEntry(c));
  };
  entries
  |> E.L.iter(e =>
       switch (e) {
       | CompEntry(c) => processEntry(c, "")
       | FolderEntry(f) => processFolder(f, "")
       }
     );
};

let entries = Entries.entries;
buildIds(entries);

module Styles = {
  open Css;
  let pageContainer = style([display(`flex), height(`vh(100.))]);
  let leftNav =
    style([
      padding(`em(2.)),
      flexBasis(`px(200)),
      flexShrink(0.),
      backgroundColor(`hex("eaeff3")),
      boxShadows([
        Shadow.box(
          ~x=px(-1),
          ~blur=px(1),
          ~inset=true,
          rgba(0, 0, 0, 0.1),
        ),
      ]),
    ]);

  let folderNav =
    style([
      selector(
        ">h4",
        [
          cursor(`pointer),
          margin2(~v=`em(0.3), ~h=`zero),
          hover([color(`hex("7089ad"))]),
        ],
      ),
    ]);
  let folderChildren = style([paddingLeft(`px(7))]);
  let compNav =
    style([
      cursor(`pointer),
      paddingBottom(`px(3)),
      hover([color(`hex("7089ad"))]),
    ]);
  let compContainer = style([padding(`em(2.)), flexGrow(1.)]);
  // Approximate sidebar container for entry
  let sidebarContainer = style([maxWidth(`px(430))]);
  let folderChildContainer = style([marginBottom(`em(2.))]);
};

let baseUrl = "/showcase/index.html";

module Index = {
  type state = {route: ReasonReactRouter.url};

  type action =
    | ItemClick(string)
    | ChangeRoute(ReasonReactRouter.url);

  let changeId = (id: string) => {
    ReasonReactRouter.push(baseUrl ++ "#" ++ id);
    ();
  };

  let buildNav = setRoute => {
    let rec buildFolder = (f: folderEntry) => {
      <div key={f.id} className=Styles.folderNav>
        <h4 onClick={_e => changeId(f.id)}> f.title->React.string </h4>
        <div className=Styles.folderChildren>
          {(
             f.children
             |> E.L.fmap(e =>
                  switch (e) {
                  | FolderEntry(folder) => buildFolder(folder)
                  | CompEntry(entry) => buildEntry(entry)
                  }
                )
             |> E.L.toArray
           )
           ->React.array}
        </div>
      </div>;
    }
    and buildEntry = (e: compEntry) => {
      <div key={e.id} className=Styles.compNav onClick={_e => changeId(e.id)}>
        e.title->React.string
      </div>;
    };
    (
      entries
      |> E.L.fmap(e =>
           switch (e) {
           | FolderEntry(folder) => buildFolder(folder)
           | CompEntry(entry) => buildEntry(entry)
           }
         )
      |> E.L.toArray
    )
    ->React.array;
  };

  let renderEntry = e => {
    switch (e.container) {
    | FullWidth => e.render()
    | Sidebar => <div className=Styles.sidebarContainer> {e.render()} </div>
    };
  };

  [@react.component]
  let make = () => {
    let (route, setRoute) =
      React.useState(() => {
        let url: ReasonReactRouter.url = {path: [], hash: "", search: ""};
        url;
      });

    React.useState(() => {
      ReasonReactRouter.watchUrl(url => setRoute(_ => url));
      ();
    })
    |> ignore;

    <div className=Styles.pageContainer>
      <div className=Styles.leftNav> {buildNav(setRoute)} </div>
      <div className=Styles.compContainer>
        {if (route.hash == "") {
           React.null;
         } else {
           switch (HS.get(entriesByPath, route.hash)) {
           | Some(navEntry) =>
             switch (navEntry) {
             | CompEntry(c) => renderEntry(c)
             | FolderEntry(f) =>
               /* Rendering immediate children */
               (
                 f.children
                 |> E.L.fmap(child =>
                      switch (child) {
                      | CompEntry(c) =>
                        <div className=Styles.folderChildContainer key={c.id}>
                          {renderEntry(c)}
                        </div>
                      | _ => React.null
                      }
                    )
                 |> E.L.toArray
               )
               ->React.array
             }
           | None => <div> "Component not found"->React.string </div>
           };
         }}
      </div>
    </div>;
  };
};