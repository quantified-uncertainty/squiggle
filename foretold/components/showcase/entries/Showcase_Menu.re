open FC.Base;

let simpleMenu = () =>
  Menu.(
    <Menu onClick={e => Js.log(e.key)}>
      <Item key="item1"> "Item1"->React.string </Item>
      <Item key="item2"> "Item2"->React.string </Item>
    </Menu>
  );

let subMenu = () =>
  Menu.(
    <Menu onClick={e => Js.log(e.key)}>
      <Item key="item1"> "Item1"->React.string </Item>
      <Divider />
      <Item key="item2"> "Item2"->React.string </Item>
      <SubMenu title="Submenu1">
        <Item key="item3"> "Item3"->React.string </Item>
        <Item key="item4"> "Item3"->React.string </Item>
      </SubMenu>
    </Menu>
  );

let entries =
  EntryTypes.[
    folder(
      ~title="Menu",
      ~children=[
        entry(~title="Simple", ~render=simpleMenu),
        entry(~title="Submenu", ~render=subMenu),
      ],
    ),
  ];
