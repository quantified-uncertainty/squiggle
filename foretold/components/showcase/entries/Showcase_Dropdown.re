open FC.Base;

let staticOverlay =
  <div
    className=Css.(
      style([
        border(`px(1), `solid, Colors.grey1),
        backgroundColor(Colors.white),
        width(`px(200)),
      ])
    )>
    {"Overlay" |> React.string}
  </div>;

let divAreaStyle =
  Css.(
    style([
      backgroundColor(Colors.smokeWhite),
      width(`px(300)),
      textAlign(`center),
      padding2(~v=`em(1.), ~h=`em(1.)),
    ])
  );

let simpleDropdown = () =>
  <Dropdown overlay=staticOverlay>
    <div className=divAreaStyle>
      "Dropdown default trigger (hover)"->React.string
    </div>
  </Dropdown>;

let menuDropdown = () =>
  <Dropdown overlay={Showcase_Menu.subMenu()} trigger=Dropdown.Hover>
    <div className=divAreaStyle> "Submenu"->React.string </div>
  </Dropdown>;

let entries =
  EntryTypes.[
    folder(
      ~title="Dropdown",
      ~children=[
        entry(~title="Dropdown1", ~render=simpleDropdown),
        entry(~title="Menu dropdown", ~render=menuDropdown),
      ],
    ),
  ];
