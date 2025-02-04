export async function applyIfSecretExists<T>(
  cookie: string | undefined,
  fun: (cookie: string) => T
) {
  if (cookie) {
    return await fun(cookie);
  } else {
    console.log(
      `Cannot proceed with ${fun.name} because cookie does not exist`
    );
    throw new Error(`No cookie for ${fun.name}`);
  }
}
