export async function measureTime(f: () => Promise<void>) {
  const init = Date.now();
  await f();
  const end = Date.now();
  const difference = end - init;
  console.log(
    `Took ${difference / 1000} seconds, or ${difference / (1000 * 60)} minutes.`
  );
}
