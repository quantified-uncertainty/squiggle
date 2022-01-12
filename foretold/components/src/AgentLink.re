module Styles = {
  open Css;
  let avatarOuter =
    style([float(`left), position(`relative), marginRight(`em(0.4))]);
  let avatar = style([marginTop(`em(0.1)), float(`left)]);
  let ownerAvatarOuter =
    style([
      float(`left),
      width(`em(1.)),
      height(`percent(100.)),
      marginLeft(`em(0.1)),
    ]);
  let ownerAvatar = style([position(`absolute), bottom(`zero)]);
};

module Agent = {
  type user = {
    name: string,
    image: option(string),
    onClick: ReactEvent.Mouse.t => unit,
  }
  and bot = {
    name: string,
    image: option(string),
    onClick: ReactEvent.Mouse.t => unit,
    owner: option(t),
  }
  and t =
    | User(user)
    | Bot(bot);

  let onClick = agent =>
    switch (agent) {
    | User(u) => u.onClick
    | Bot(u) => u.onClick
    };

  let name = agent =>
    switch (agent) {
    | User(u) => u.name
    | Bot(u) => u.name
    };

  let image = agent =>
    switch (agent) {
    | User(u) => u.image
    | Bot(u) => u.image
    };

  let owner = agent =>
    switch (agent) {
    | User(_) => None
    | Bot(b) => b.owner
    };

  let makeUser = (~name: string, ~onClick=_ => (), ~image=?, ()): t =>
    User({name, image, onClick});

  let makeBot = (~name: string, ~onClick=_ => (), ~image=?, ~owner=?, ()): t =>
    Bot({name, image, onClick, owner});
};

module SubItem = {
  [@react.component]
  let make = (~agent: Agent.t, ~owner: option(Agent.t), ~className) =>
    <Link onClick={Agent.onClick(agent)} className>
      <div className=Styles.avatarOuter>
        <div className=Styles.avatar>
          <Avatar
            width=1.2
            src={
              Agent.image(agent)
              |> Rationale.Option.default(BotDefaultImage.botDefault)
            }
          />
        </div>
        {owner
         |> E.O.React.fmapOrNull(owner =>
              <div className=Styles.ownerAvatarOuter>
                <div className=Styles.ownerAvatar>
                  <Avatar
                    width=0.8
                    src={
                      Agent.image(owner)
                      |> Rationale.Option.default(BotDefaultImage.botDefault)
                    }
                  />
                </div>
              </div>
            )}
      </div>
      {Agent.name(agent) |> ReasonReact.string}
    </Link>;
};

[@react.component]
let make = (~agent: Agent.t, ~className="") =>
  <SubItem agent className owner={Agent.owner(agent)} />;
