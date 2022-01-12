open FC;
open Base;

let cdf = ExampleCdfs.Example1.cdf;

let futureTime = 1559005200;

let row =
  <Table.Row onClick={_ => Js.log("Row Clicked")}>
    <Table.Cell flex={`num(4.)}>
      <span className=Table.Styles.Elements.primaryText>
        {"What will be the " |> ReasonReact.string}
        <Link
          isDisabled=false
          className=Css.(
            style([
              textDecoration(`underline),
              color(`hex("384e67")),
              hover([color(Colors.link)]),
            ])
          )>
          {"GDP" |> ReasonReact.string}
        </Link>
        <Link
          href="d"
          isDisabled=false
          className=Css.(
            style([
              textDecoration(`underline),
              color(`hex("384e67")),
              hover([color(Colors.link)]),
            ])
          )>
          {"GDP" |> ReasonReact.string}
        </Link>
        {" of " |> ReasonReact.string}
        <Link
          href="China"
          isDisabled=false
          className=Css.(
            style([
              textDecoration(`underline),
              color(`hex("384e67")),
              hover([color(Colors.link)]),
            ])
          )>
          {"China" |> ReasonReact.string}
        </Link>
        {" in " |> ReasonReact.string}
        <Link
          href="2018"
          isDisabled=false
          className=Css.(
            style([
              textDecoration(`underline),
              color(`hex("384e67")),
              hover([color(Colors.link)]),
            ])
          )>
          {"2018" |> ReasonReact.string}
        </Link>
      </span>
      {StateStatus.make(
         ~state=OPEN(MomentRe.momentWithUnix(futureTime)),
         ~fontSize=`em(0.85),
         (),
       )}
    </Table.Cell>
    <Table.Cell flex={`num(2.)}>
      <CdfChart__Small
        cdf
        minX={Some(2.0)}
        color={`hex("#d9dcdf")}
        maxX={Some(12.0)}
      />
    </Table.Cell>
    <Table.Cell flex={`num(1.)} properties=Css.[paddingTop(`em(0.3))]>
      <Div>
        <Link className={Table.Styles.Elements.link(~isUnderlined=false, ())}>
          {"Series A" |> ReasonReact.string}
        </Link>
        <Link className={Table.Styles.Elements.link(~isUnderlined=false, ())}>
          {"19" |> ReasonReact.string}
        </Link>
      </Div>
      <Div>
        <Link className={Table.Styles.Elements.link(~isUnderlined=true, ())}>
          {"Edit" |> ReasonReact.string}
        </Link>
        <Link className={Table.Styles.Elements.link(~isUnderlined=true, ())}>
          {"Archive" |> ReasonReact.string}
        </Link>
      </Div>
    </Table.Cell>
  </Table.Row>;

let make =
  <PageCard>
    <PageCard.HeaderRow>
      <Div
        float=`left
        className={Css.style([
          PageCard.HeaderRow.Styles.itemTopPadding,
          PageCard.HeaderRow.Styles.itemBottomPadding,
        ])}>
        <Tab2 isActive=true number=12> {"Open" |> ReasonReact.string} </Tab2>
        <Tab2 isActive=false number=18>
          {"Pending Resolution" |> ReasonReact.string}
        </Tab2>
        <Tab2 isActive=false number=831>
          {"Closed" |> ReasonReact.string}
        </Tab2>
      </Div>
      <Div
        float=`right
        styles=[Css.style([PageCard.HeaderRow.Styles.itemTopPadding])]>
        {PaginationButtons.make({
           currentValue: Range(3, 10),
           max: 100,
           pageLeft: {
             isDisabled: false,
             onClick: _ => (),
           },
           pageRight: {
             isDisabled: true,
             onClick: _ => (),
           },
         })}
      </Div>
    </PageCard.HeaderRow>
    <Table>
      <Table.HeaderRow>
        <Table.Cell flex={`num(4.)}>
          {"Name & Status" |> ReasonReact.string}
        </Table.Cell>
        <Table.Cell flex={`num(2.)}>
          {"Aggregate Prediction" |> ReasonReact.string}
        </Table.Cell>
        <Table.Cell flex={`num(1.)}>
          {"Details" |> ReasonReact.string}
        </Table.Cell>
      </Table.HeaderRow>
      row
      row
      row
      row
      row
      row
      row
      row
      row
    </Table>
  </PageCard>;
