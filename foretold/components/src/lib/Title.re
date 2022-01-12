[@bs.val] external document: Dom.document = "document";
[@bs.set] external setTitleDom: (Dom.document, string) => unit = "title";
[@bs.get] external getTitleDom: Dom.document => string = "title";

let getTitle = () => getTitleDom(document);
let setTitle = setTitleDom(document);
let unsetTitle = (previousTitle) => setTitle(previousTitle);

let useTitle = (title: string): unit =>{
  let prev = getTitle();
  React.useEffect1(
    () => {
      setTitle(title);
      Some(_ => unsetTitle(prev));
    },
    [|title|],
  );
};

[@react.component]
let make = (~title: string) => {
  useTitle(title);
  React.null;
};