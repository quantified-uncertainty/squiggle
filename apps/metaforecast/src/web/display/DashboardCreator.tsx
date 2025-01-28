import { ChangeEvent, EventHandler, FC, SyntheticEvent, useState } from "react";

import { Button } from "../common/Button";
import { InfoBox } from "../common/InfoBox";

const exampleInput = `{
  "title": "Random example",
  "description": "Just a random description of a random example",
  "ids": [ "metaculus-372", "goodjudgmentopen-2244", "metaculus-7550", "kalshi-09d060ee-b184-4167-b86b-d773e56b4162", "wildeford-5d1a04e1a8", "metaculus-2817" ],
  "creator": "Peter Parker"
}`;

interface Props {
  handleSubmit: (data: any) => Promise<void>;
}

export const DashboardCreator: FC<Props> = ({ handleSubmit }) => {
  const [value, setValue] = useState(exampleInput);
  const [acting, setActing] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  const handleSubmitInner: EventHandler<SyntheticEvent> = async (event) => {
    event.preventDefault();

    try {
      const newData = JSON.parse(value);

      if (!newData || !newData.ids || newData.ids.length == 0) {
        throw Error("Not enough objects");
      } else {
        setActing(true);
        await handleSubmit(newData);
        setActing(false);
      }
    } catch (error) {
      setActing(false);
      const substituteText = `Error: ${
        error instanceof Error ? error.message : "Unknown"
      }

Try something like:
${exampleInput}

Your old input was: ${value}`;
      setValue(substituteText);
    }
  };

  return (
    <form onSubmit={handleSubmitInner}>
      <div className="flex flex-col items-center space-y-5 max-w-2xl">
        <textarea value={value} onChange={handleChange} rows={8} cols={50} />
        <Button
          disabled={acting}
          onClick={acting ? undefined : handleSubmitInner}
        >
          {acting ? "Creating..." : "Create dashboard"}
        </Button>

        <InfoBox>
          You can find the necessary ids by toggling the advanced options in the
          search, or by using{" "}
          <a href="/api/graphql?query=%7B%0A++questions%28first%3A+100%29+%7B%0A++++pageInfo+%7B%0A++++++hasNextPage%0A++++++endCursor%0A++++%7D%0A++++edges+%7B%0A++++++node+%7B%0A++++++++id%0A++++++++title%0A++++++++url%0A++++++%7D%0A++++%7D%0A++%7D%0A%7D">
            GraphQL API
          </a>
        </InfoBox>
      </div>
    </form>
  );
};
