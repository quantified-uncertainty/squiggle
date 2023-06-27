import userEvent from "@testing-library/user-event";

// Types are broken and hard to fix; https://github.com/testing-library/user-event/issues/1062
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const patchedUserEvent = userEvent as any;

export { patchedUserEvent as userEvent };
