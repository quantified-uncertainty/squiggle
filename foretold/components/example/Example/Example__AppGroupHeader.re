open FC;
open Base;

let make =
  <Div>
    <GroupHeader>
      <Div float=`left>
        <div
          className=Css.(
            style([
              fontSize(`em(1.4)),
              marginTop(`px(5)),
              Colors.FontWeights.heavy,
              color(Colors.darkLink),
            ])
          )>
          {"Great Community" |> ReasonReact.string}
        </div>
        <p
          className=Css.(
            style([
              color(`hex("36485c")),
              marginTop(`px(5)),
              marginBottom(`px(3)),
            ])
          )>
          {"Lots of description for the group would be here"
           |> ReasonReact.string}
        </p>
      </Div>
      <Div float=`right>
        <Button
          variant=Button.Secondary
          isDisabled=false
          size=Button.(Medium)
          className=GroupHeader.Styles.actionButtonPosition>
          {"Leave Channel" |> ReasonReact.string}
        </Button>
        <Button
          isDisabled=false
          size=Button.(Medium)
          className=GroupHeader.Styles.actionButtonPosition>
          {"Create Question" |> ReasonReact.string}
        </Button>
        <Button
          isDisabled=false
          size=Button.(Medium)
          className=GroupHeader.Styles.actionButtonPosition>
          {"Create Question" |> ReasonReact.string}
        </Button>
      </Div>
    </GroupHeader>
    <GroupHeader.SubHeader>
      <Tab isActive=true> {"Questions" |> ReasonReact.string} </Tab>
      <Tab isActive=false> {"Knowledge Graph" |> ReasonReact.string} </Tab>
      <Tab isActive=false> {"Leaderboard" |> ReasonReact.string} </Tab>
      <Tab isActive=false> {"Settings" |> ReasonReact.string} </Tab>
    </GroupHeader.SubHeader>
  </Div>;
