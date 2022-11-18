import { render, screen, prettyDOM } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import { SquiggleEditor } from "../src/index";
import { SqProject } from "@quri/squiggle-lang";
import malariaConsortiumCells from "./malaria_consortium.json";
import * as fs from "fs";

test("Renders Malaria Consortium Notebook in reasonable amount of time", async () => {
  const project = SqProject.create();
  project.setEnvironment({
    sampleCount: 1000,
    xyPointLength: 1000,
  });
  malariaConsortiumCells.forEach((cell) => {
    project.setSource(cell.id, cell.source);
    project.setContinues(cell.id, cell.continues);
  });

  const { container } = render(
    <div>
      {malariaConsortiumCells.map((x) => (
        <SquiggleEditor
          key={x.id}
          sourceName={x.id}
          project={project}
          code={x.source}
          continues={x.continues}
        />
      ))}
    </div>
  );
  await fs.promises.writeFile("result.html", container.innerHTML);
});
