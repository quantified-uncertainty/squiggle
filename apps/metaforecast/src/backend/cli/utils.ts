import { sleep } from "../utils/sleep";

export async function tryCatchTryAgain(fun: () => Promise<void>) {
  try {
    console.log("Initial try");
    await fun();
  } catch (error) {
    sleep(10000);
    console.log("Second try");
    console.log(error);
    try {
      await fun();
    } catch (error) {
      console.log(error);
    }
  }
}
