let makeItem = (name, icon, bookmark): MyCommunities.item => {
  name,
  icon,
  bookmark,
  href: "",
  onClick: _ => (),
  onBookmark: _ => (),
};

let backgroundBox =
  Css.(style([background(`hex("ccc")), padding(`em(3.))]));

let innerBox =
  Css.(
    style([
      fontSize(`rem(1.1)),
      width(`em(20.)),
      border(`px(1), `solid, `hex("d5d2d2")),
      padding2(~v=`em(0.5), ~h=`em(0.)),
      borderRadius(`px(5)),
      background(`hex("fff")),
    ])
  );

let myCommunities = () =>
  <div className=backgroundBox>
    <div className=innerBox>
      <MyCommunities>
        <MyCommunities.Header name="FEEDS" />
        <MyCommunities.Item item={makeItem("Home", "HOME", false)} />
        <MyCommunities.Item
          item={makeItem("All Communities", "LIST", false)}
        />
        <MyCommunities.Header name="MY COMMUNITIES" />
        <MyCommunities.ChannelItem
          item={makeItem("Slate-Star-Codex 2019", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", true)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", true)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", true)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("AI Questions", "PEOPLE", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem("Other AI Questions", "LOCK", false)}
        />
        <MyCommunities.ChannelItem
          item={makeItem(
            "My Secret and Very Very Very Very Long-named Community",
            "LOCK",
            false,
          )}
        />
        <MyCommunities.Header name="OPTIONS" />
        <MyCommunities.Item
          item={makeItem("Create a New Community", "CIRCLE_PLUS", true)}
        />
      </MyCommunities>
    </div>
  </div>;

let entry = EntryTypes.(entry(~title="MyCommunities", ~render=myCommunities));