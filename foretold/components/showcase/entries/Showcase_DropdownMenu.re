open FC.Base;

let simpleMenu = () =>
  <DropdownMenu title="Simple menu">
    Menu.(
      <Menu onClick={e => Js.log(e.key)}>
        <Item key="item1"> "1st menu item"->React.string </Item>
        <Item key="item2"> "2nd menu item"->React.string </Item>
        <Divider />
        <Item key="item3"> "3nd menu item"->React.string </Item>
      </Menu>
    )
  </DropdownMenu>;

let subMenu = () =>
  <DropdownMenu title="Submenu" trigger=Dropdown.Hover>
    Menu.(
      <Menu onClick={e => Js.log(e.key)}>
        <Item key="item1"> "Item1"->React.string </Item>
        <Divider />
        <Item key="item2"> "Item2"->React.string </Item>
        <SubMenu title="Submenu1">
          <Item key="item3"> "Item3"->React.string </Item>
          <Item key="item4"> "Item4"->React.string </Item>
        </SubMenu>
      </Menu>
    )
  </DropdownMenu>;

let entries =
  EntryTypes.[
    folder(
      ~title="Dropdown menu",
      ~children=[
        entry(~title="Simple", ~render=simpleMenu),
        entry(~title="Submenu", ~render=subMenu),
      ],
    ),
  ];
