/**
 * See `./auth.ts` for more details.
 */

let cliUserEmail: string | undefined = process.env["CLI_USER_EMAIL"];

export function getCliUserEmail() {
  return cliUserEmail;
}

// If a script needs to update the current user, it can do so with this function.
// Note that this is not threadsafe, and should only be used in scripts.
export function setCliUserEmail(email: string | undefined) {
  cliUserEmail = email;
}
