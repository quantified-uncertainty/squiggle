import { SqProject } from "../src";
import malariaConsortiumCells from "./malaria_consortium.json";

test("Renders Malaria Consortium Notebook in reasonable amount of time", async () => {
  const project = SqProject.create();
  malariaConsortiumCells.forEach((cell) => {
    project.setSource(cell.id, cell.source);
    project.setContinues(cell.id, cell.continues);
  });
  project.runAll();
});
