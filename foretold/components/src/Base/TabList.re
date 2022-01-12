[@react.component]
let make = (~selected, ~flex=false, ~onClick=?, ~list) =>
  list
  |> E.L.React.fmapi((i, (key, label)) =>
       <Tab
         key={string_of_int(i)}
         onClick={e =>
           switch (onClick) {
           | Some(onClick) =>
             e->ReactEvent.Synthetic.preventDefault;
             onClick(key);
           | None => ()
           }
         }
         isActive={selected == key}
         flex>
         label->React.string
       </Tab>
     );

