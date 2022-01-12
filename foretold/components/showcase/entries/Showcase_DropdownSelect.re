open FC.Base;

let stringSelect = () =>
  <DropdownSelect
    initialValue=None
    values=[("key1", "Label 1"), ("key2", "Label 2"), ("key3", "Label 3")]
    onSelect={v =>
      switch (v) {
      | Some(k) => Js.log2("Selected ", k)
      | None => Js.log("Selected none")
      }
    }
  />;

let intSelect = () =>
  <DropdownSelect
    initialValue={Some(2)}
    values=[(1, "Int label 1"), (2, "Int label 2"), (3, "Int label 3")]
    onSelect={v =>
      switch (v) {
      | Some(k) => Js.log2("Selected ", k)
      | None => Js.log("Selected none")
      }
    }
  />;

type customType =
  | Option1
  | Option2
  | Option3;

let customSelect = () =>
  <DropdownSelect
    initialValue={Some(Option3)}
    values=[
      (Option1, "Option1"),
      (Option2, "Option2"),
      (Option3, "Option3"),
    ]
    onSelect={v =>
      switch (v) {
      | Some(Option1) => Js.log("Option 1")
      | Some(Option2) => Js.log("Option 2")
      | Some(Option3) => Js.log("Option 3")
      | None => Js.log("None")
      }
    }
  />;

let entries =
  EntryTypes.[
    folder(
      ~title="DropdownSelect",
      ~children=[
        entry(~title="Select1", ~render=stringSelect),
        entry(~title="Int select", ~render=intSelect),
        entry(~title="Custom select", ~render=customSelect),
      ],
    ),
  ];
