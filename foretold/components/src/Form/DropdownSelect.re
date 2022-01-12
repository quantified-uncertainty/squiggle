module E = E;

/**
   * Dropdown select
   * Usage
   * <DropdownSelect.String
   *   selected=Some("key2")
   *   values=[("key1", "Label1"), ("key2", "Label2")]
   *   onSelect={v =>
   *     switch (v) {
   *       | Some(k) => Js.log2("Selected: ", k)
   *       | None => Js.log("Selected none")
   *     }
   *   }
   * />
   *
   */

[@react.component]
let make =
    (
      ~initialValue,
      ~values: list(('a, string)),
      ~onSelect: option(option('a) => unit)=?,
      ~trigger=Dropdown.Click,
    ) => {
  let initLabel = "";

  let (label, setLabel) = React.useState(() => initLabel);

  <DropdownMenu title=label trigger>
    <Menu
      selectable=true
      onSelect={(info: Menu.clickInfo) =>
        switch (
          (values |> E.L.withIdx)
          ->(E.L.getBy(((i, _)) => info.key == "key" ++ string_of_int(i)))
        ) {
        | Some((_i, (key, label))) =>
          setLabel(_ => label);
          switch (onSelect) {
          | Some(onSelect) => onSelect(Some(key))
          | None => ()
          };
        | None => () // Error, could not find selected key among values
        }
      }>
      // Was a little worried about using a straight int as a key,
      // in case some conversions may go wrong or something, so added
      // "key" before

        {values
         |> E.L.React.fmapi((i, (_key, label)) =>
              <Menu.Item key={"key" ++ string_of_int(i)}>
                label->React.string
              </Menu.Item>
            )}
      </Menu>
  </DropdownMenu>;
};
