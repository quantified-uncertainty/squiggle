open FC;
open FC.Base;

let numbers = [
  0.000000000000000000000000000001,
  0.00000000001,
  0.00000001,
  (-0.00000001),
  0.00000001200332,
  0.00001,
  0.0000130300033,
  0.01,
  (-0.01),
  0.010000303030,
  0.0,
  0.010001,
  1.0,
  (-1.0),
  1.1000,
  1.0100,
  1.0010,
  1.0001,
  100.0,
  100.5,
  (-100.5),
  1000000.0,
  1001001.0,
  100000000000.0,
  100000000000000000.0,
  10000000000000000000000.0,
  10000100000000000000000.0,
  1000000000000100000000000000000.0,
];

module NumbersDisplay = {
  [@react.component]
  let make = () => {
    <PageCard>
      <PageCard.HeaderRow>
        <PageCard.HeaderRow.Title>
          "NumberShower"->React.string
        </PageCard.HeaderRow.Title>
      </PageCard.HeaderRow>
      <div>
        {(
           numbers
           |> E.L.fmap(n =>
                <div key={n |> Js.Float.toString}>
                  <NumberShower number=n precision=3 />
                </div>
              )
           |> E.L.toArray
         )
         ->React.array}
      </div>
    </PageCard>;
  };
};

let entry =
  EntryTypes.(entry(~title="NumberShower", ~render=() => <NumbersDisplay />));
