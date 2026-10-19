// Options for `@quri/hub-linker` in client components: load `hub:owner/slug`
// imports from the Hub instance that serves the page, not from production
// squigglehub.org, so that imports resolve in local development and preview
// deployments.
//
// Client components also render on the server, where `window` is undefined;
// the linker isn't used there (models only run in the browser), so we fall back
// to the linker's default server.
export function hubLinkerOptions(): { hubServer?: string } {
  return typeof window === "undefined"
    ? {}
    : { hubServer: window.location.origin };
}
