import { NextURL } from "next/dist/server/web/next-url";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === "/dashboards") {
    const dashboardId = searchParams.get("dashboardId");
    if (dashboardId) {
      return NextResponse.redirect(
        new URL(`/dashboards/view/${dashboardId}`, req.url)
      );
    }
  } else if (pathname === "/capture") {
    return NextResponse.redirect(new URL("/", req.url));
  } else if (pathname === "/secretDashboard") {
    const dashboardId = searchParams.get("dashboardId");
    if (dashboardId) {
      const url = new URL(`/dashboards/embed/${dashboardId}`, req.url);
      const numCols = searchParams.get("numCols");
      if (numCols) {
        url.searchParams.set("numCols", numCols);
      }
      return NextResponse.redirect(url);
    } else {
      return NextResponse.rewrite(new NextURL("/404", req.url));
    }
  }

  return NextResponse.next();
}
