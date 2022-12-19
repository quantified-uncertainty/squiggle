import { SqProject } from "../src";
import malariaConsortiumCells from "./malaria_consortium.json";
import { Session } from 'inspector';
import fs from 'node:fs';

test("Renders Malaria Consortium Notebook in reasonable amount of time", () => {
  new Promise((resolve, reject) => {
    const session = new Session();
    session.connect();
    
    session.post('Profiler.enable', () => {
      session.post('Profiler.start', () => {
        const project = SqProject.create();
        malariaConsortiumCells.forEach((cell) => {
          project.setSource(cell.id, cell.source);
          project.setContinues(cell.id, cell.continues);
        });
        project.runAll();
        session.post('Profiler.stop', (err, {profile}) => {
          fs.writeFileSync('./malaria_consortium.cpuprofile', JSON.stringify(profile));
          resolve(undefined)
        });
      });
    });
  })
});
